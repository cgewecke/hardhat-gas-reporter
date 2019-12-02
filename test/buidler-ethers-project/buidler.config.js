usePlugin("@nomiclabs/buidler-ethers");

// We load the plugin here.
// We recommend using loadPluginFile in tests, as using usePlugin from within
// a plugin can interfer with any build step you have (e.g. TypeScript).
const { loadPluginFile } = require("@nomiclabs/buidler/plugins-testing");
loadPluginFile(__dirname + "/../../src/index");

module.exports = {
  solc: {
    version: "0.5.8"
  },
  defaultNetwork: 'development',
  networks: {
    development: {
      gas: 5000000,
      url: "http://localhost:8545"
    }
  },
};
