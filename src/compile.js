const { compile } = require("nexe");
const argv = require('minimist')(process.argv.slice(2));

(async () => {
  await compile({
    input: "./src/index.js",
    build: true,
    ico: "./icon.ico",
    name: "./release/ATSRichPresenceCMD",
    clean: argv.clean ? true : false
  });
})();