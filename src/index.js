const DiscordRPC = require("discord-rpc");
const ETCarsClient = require("etcars-node-client");
const fetch = require("node-fetch");
const log = require("node-file-logger");
const argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
if (!fs.existsSync("./logs/")) fs.mkdirSync("./logs/");
if (fs.existsSync("./logs/Output.log")) fs.writeFileSync("./logs/Output.log", "");
log.SetUserOptions({
  folderPath: "./logs/",
  dateBasedFileNaming: false,
  fileName: "Output",
  fileNameExtension: ".log",
  dateFormat: "YYYY/MM/DD",
  timeFormat: "h:mm:ss A",
  logLevel: (argv.D || argv.debug ? "debug" : "prod"),
  onlyFileLogging: false
});

/**
 * @typedef {import("discord-rpc").Presence} Presence
 */

/**
 * MASSIVE TODO: ADD MORE CITIES
 */
class Client {
  constructor() {
    this.et = new ETCarsClient();
    this.rpc = new DiscordRPC.Client({ transport: "ipc" });

    this.truckyMapApi = "https://api.truckyapp.com/v2/map/%game/resolve?x=%xpos&y=%zpos";
    this.lastData = null;
    this.minUpdateRate = 2;
    this.minStateUpdateRate = 5;
    this.updating = false;
    this.activity = null;
    this.state = null;

    this.timeSinceLastUpdate = 0;
    this.timeSinceLastStateUpdate = 0;
    this.timeSinceActivityChange = null;

    this.rpcStateMark = 0;
    this.firstRun = true;
  }

  init() {
    log.Info("Connecting...");

    this.et.on("data", data => {
      log.Debug("Data Recieved");
      this.data = data;
      if (Date.now() - this.timeSinceLastUpdate >= this.minUpdateRate * 1000 && !this.updating) this.update();
    });

    this.et.on("connect", () => {
      log.Info("ETCars Connected");
      this.firstRun = false;

      // Hard code the ATS client for now.
      this.rpc.login({ clientId: "529091171633594368" }).then(() => {
        log.Info("RPC Connected");
        this.rpc.connected = true;
        this.timeSinceActivityChange = new Date();
      }).catch(e => {
        // TODO: Popup to show errored...
        log.Fatal(e);
        process.exit();
      });
    });

    this.et.on("error", e => {
      if (e.errorMessage && e.errorMessage.toString().includes("not running")) {
        if (this.firstRun) {
          log.Info("No Connection; Awaiting for user to launch ATS.");
          this.firstRun = false;
        } else {
          log.Debug("No Connection; Awaiting ATS Reconnect.");
        }
        if (!this.rpc.connected) return;
        return this.disconnect();
      }
      log.Error(e);
      return this.disconnect();
    });

    this.et.connect();
  }

  disconnect() {
    log.Warn("RPC Disconnecting...");
    if (!this.rpc.connected) return;
    this.rpc.destroy();
    this.rpc.connected = false;
    log.Info("RPC Disconnected");
  }

  async update() {
    log.Debug("Running Presence Update...");
    if (!this.timeSinceLastUpdate) this.timeSinceLastUpdate = Date.now();

    if (!this.rpc.connected) return;
    const activity = await this.build();
    this.updating = true;
    await this.rpc.setActivity(activity);
    this.updating = false;
    this.timeSinceLastUpdate = Date.now();
    log.Debug("Presence Updated.");
  }

  async build() {
    /** @type {Presence} */
    const activity = {};

    if (!this.data.telemetry) return {};
    const data = {
      game: this.data.telemetry.game,
      truck: this.data.telemetry.truck,
      navigation: this.data.telemetry.navigation,
      job: this.data.telemetry.job
    };

    // Handle Images
    if (data.truck.worldPlacement.x && data.truck.worldPlacement.z) {
      // Fetch the nearest location.
      const res = await fetch(this.truckyMapApi
        .replace("%game", "ats")
        .replace("%xpos", data.truck.worldPlacement.x)
        .replace("%zpos", data.truck.worldPlacement.z)
      );
      const body = await res.json();
      if (!body || !body.response) {
        activity.largeImageKey = "truck";
        activity.largeImageText = "Unable To Fetch Location";
      } else {
        const locData = body.response;
        if (locData.distance > 0) {
          activity.largeImageKey = locData.poi.country.toLowerCase().replace(/ /g, "_");
          activity.largeImageText = "Roaming in " + locData.poi.country;
        } else {
          activity.largeImageKey = locData.poi.realName.toLowerCase().replace(/ /g, "_");
          activity.largeImageText = "In " + locData.poi.realName;
        }
      }
    } else {
      activity.largeImageKey = "truck";
      activity.largeImageText = "Menu Screen";
    }

    // Handle Details & State
    if (!this.timeSinceActivityChange) timeSinceActivityChange = new Date();
    if (data.job.onJob) {
      if (this.activity != "job") {
        this.timeSinceActivityChange = new Date();
        this.activity = "job";
      }

      activity.details = "🚚 " + data.job.sourceCity + " -> " + data.job.destinationCity;

      if (Date.now() - this.timeSinceLastStateUpdate >= this.minStateUpdateRate * 1000) {
        this.timeSinceLastStateUpdate = Date.now();

        if (this.rpcStateMark > 2) this.rpcStateMark = 0;
        if (this.rpcStateMark == 0) this.state = "🛣️ " + (data.navigation.distance / 1609.344).toFixed(0) + " Miles Remaining";
        if (this.rpcStateMark == 1) this.state = "📦 Carrying " + data.job.cargo;
        if (this.rpcStateMark == 2) this.state = "💨 Going " + Math.ceil(data.truck.speed * 2.237) + " MPH";
        this.rpcStateMark++;
      }

      activity.state = this.state;
    } else {
      if (this.activity != "roam") {
        this.timeSinceActivityChange = new Date();
        this.activity = "roam";
      }
      
      activity.details = "🚚 Freeroaming";
      activity.state = "🛣️ Livin' the Life";
    }
    activity.startTimestamp = Math.floor(this.timeSinceActivityChange / 1000);

    // Overrides
    if (data.game.paused) {
      activity.state = "⏸ Paused";
      this.timeSinceActivityChange.setMilliseconds(this.timeSinceActivityChange.getMilliseconds() + (Date.now() - this.timeSinceLastUpdate));
    }

    return activity;
  }
}

const client = new Client();
client.init();

process.stdin.resume();