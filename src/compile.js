const { compile } = require("nexe");
const argv = require('minimist')(process.argv.slice(2));
const package = require("../package.json");

(async () => {
  await compile({
    input: "./src/index.js",
    build: true,
    ico: "./icon.ico",
    name: "./release/ATSRichPresenceCMD",
    clean: argv.clean ? true : false,
    rc: {
      "CompanyName": "FireController#1847",
      "ProductName": "ATS Rich Presence",
      "FileDescription": package.description,
      "FileVersion": package.version,
      "ProductVersion": package.version,
      "OriginalFilename": "ATSRichPresence.exe",
      "InternalName": "ATSRichPresence",
      "LegalCopyright": "Copyright FireController#1847."
    }
  });
})();