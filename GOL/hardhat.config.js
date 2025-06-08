require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    },
    monad_testnet: {
      url: "https://rpc.testnet.monad.xyz/",
      chainId: 10143,
      accounts: [process.env.PRIVATE_KEY || ""]
    }
  }
};
