const ETCarsClient = require("etcars-node-client");
const fs = require("fs");

const etcars = new ETCarsClient();

etcars.on("data", d => {
  console.log(d);
  console.log("DATA RECIEVED");
  fs.writeFileSync("./data.json", JSON.stringify(d, null, 2));
});

etcars.on("connect", d => {
  console.log("Connected!");
});

etcars.on("error", e => {
  console.error(e);
});

etcars.connect();