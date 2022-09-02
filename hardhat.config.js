require("dotenv").config()

require("@nomiclabs/hardhat-etherscan")
require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("./snapshot/snapshot")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
* @type import('hardhat/config').HardhatUserConfig
*/
module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      }
    }
  },
  networks: {
    hardhat: {
      hardfork: "london",
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    // outputFile: 'gas-report.txt',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 200000
  }
}
