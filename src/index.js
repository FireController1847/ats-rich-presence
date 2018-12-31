const DiscordRPC = require("discord-rpc");
const ETCarsClient = require("etcars-node-client");
const snekfetch = require("snekfetch");

/**
 * @typedef {import("discord-rpc").Presence} Presence
 */

/**
 * MASSIVE TODO: ADD MANY MORE CITIES
 */

class Client {
  constructor() {
    this.et = new ETCarsClient();
    this.rpc = new DiscordRPC.Client({ transport: "ipc" });

    this.mapURL = "https://api.truckyapp.com/v2/map/%game/resolve?x=%xpos&y=%zpos";

    // Used for storing data recieved from ET.
    this.data = null;

    // Update rate in seconds.
    // Note: This is a required ratelimit, so it's hard coded.
    //       The way I've seen certain others do it is abusing the API.
    //       This does not.
    this.updateRate = 5;
    this.lastUpdate = 0;

    // "Timestamp Toggle"
    // Used when the game launches and the user starts "freeroaming"
    // Or when a user just got off of a job (resets to 0).
    this.timeSinceActivityChange;
    this.activity;

    // The Current RPC Activity
    this.rpcActivity;
    this.rpcChange = 0;
  }

  init() {
    console.log("Initialization Triggered.");
    this.et.on("data", data => {
      console.log("DATA");
      this.data = data;
      if (Date.now() - this.lastUpdate >= this.updateRate * 1000) this.rpcUpdate();
    });
    this.et.on("connect", () => {
      console.log("Connected to ETCars!");
      // Possibly add support for more than ATS in the future?
      this.rpc.login({ clientId: "529091171633594368" }).then(() => {
        console.log("RPC Client Connected!");
        this.rpc.connected = true;
        this.timeSinceActivityChange = Math.floor(new Date() / 1000);
      }).catch(e => {
        // TODO: Popup to show errored...
        console.error(e);
        process.exit();
      });
    });
    this.et.on("error", e => {
      if (e.errorMessage && e.errorMessage.toString().includes("not running")) {
        console.log("No Connection!");
        if (!this.rpc.connected) return;
        return this.rpcDisconnect()
      }
      console.error(e);
      this.rpcDisconnect();
    });

    this.et.connect();
  }

  async rpcUpdate() {
    console.log("Updating presence...");
    this.lastUpdate = Date.now();
    if (!this.rpc.connected) return;
    // await this.rpcBuild();
    const activity = await this.rpcBuild();

    // Inaccurate? Is it worth loading all of lodash to check?
    // if (JSON.stringify(activity) == JSON.stringify(this.rpcActivity)) {
    //   // Prevent Unessecary Updates
    //   return console.log("Activity Unchanged.");
    // }

    this.rpcActivity = activity;
    this.rpc.setActivity(activity);
    return console.log("Activity Changed.");
  }

  async rpcBuild() {
    /** @type {Presence} */
    const activity = {};
    
    if (!this.data.telemetry) return {};
    const game = this.data.telemetry.game;
    const truck = this.data.telemetry.truck;
    const navigation = this.data.telemetry.navigation;
    const job = this.data.telemetry.job;

    // Fetch Nearest Location
    if (truck.worldPlacement.x && truck.worldPlacement.y) {
      const res = await snekfetch.get(
        this.mapURL.replace("%game", "ats")
          .replace("%xpos", truck.worldPlacement.x)
          .replace("%zpos", truck.worldPlacement.z)
      );
      if (res.body && res.body.response) {
        const locData = res.body.response;
        if (locData.distance > 0) {
          activity.largeImageKey = locData.poi.country.toLowerCase().replace(/ /g, "_");
          activity.largeImageText = "Roaming in " + locData.poi.country;
        } else {
          activity.largeImageKey = locData.poi.realName.toLowerCase().replace(/ /g, "_");
          activity.largeImageText = "In " + locData.poi.realName;
        }

        // console.log(JSON.stringify(res.body.response, null, 2));
      }
    } else {
      activity.largeImageKey = "truck";
      activity.largeImageText = "Title Screen";
    }
    if (!this.timeSinceActivityChange) this.timeSinceActivityChange = Math.floor(new Date() / 1000);
    if (job.onJob) {
      if (this.activity != "job") {
        this.timeSinceActivityChange = Math.floor(new Date() / 1000);
        this.activity = "job";
      }
      activity.details = "🚚 " + job.sourceCity + " -> " + job.destinationCity;
      
      if (this.rpcChange > 1) this.rpcChange = 0;
      if (this.rpcChange == 0) activity.state = "🛣️ " + (navigation.distance / 1609.344).toFixed(0) + " Miles Remaining";
      if (this.rpcChange == 1) activity.state = "📦 Travelling With " + job.cargo;
      // TODO: Add More Options
      this.rpcChange++;

      activity.startTimestamp = this.timeSinceActivityChange;
    } else {
      if (this.activity != "roam") {
        this.timeSinceActivityChange = Math.floor(new Date() / 1000);
        this.activity = "roam";
      }
      activity.details = "🚚 Freeroaming";
      activity.state = "🛣️ Livin' the Life";
      activity.startTimestamp = this.timeSinceActivityChange;
    }
    if (game.paused) activity.state = "⏸ Paused";
    return activity;
  }

  rpcDisconnect() {
    if (!this.rpc.connected) return;
    this.rpc.destroy();
    this.rpc.connected = false;
    console.log("RPC Client Destroyed!");
  }
}

const client = new Client();
client.init();

process.stdin.resume();