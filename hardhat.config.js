require('dotenv').config()
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-etherscan')
require('@nomicfoundation/hardhat-chai-matchers')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('./snapshot/snapshot')
require('./snapshot/snapshotOS')
require('./create-wallet/create-wallet')
require('./generate-proofs/generate-proofs')
require('./generate-proofs/generate-single-proof')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
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
    version: "0.8.21",
    settings: {
      // viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10000,
      },
      outputSelection: {
        "*": {
          "*": ["evm.assembly", "irOptimized"],
        },
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // goerli: {
    //   url: `https://eth-goerli.g.alchemy.com/v2/${ process.env.ALCHEMY_API_KEY }`,
    //   accounts: [ process.env.TEST_PRIVATE_KEY ],
    // },
    // mainnet: {
    //   url: `https://eth-mainnet.g.alchemy.com/v2/${ process.env.ALCHEMY_API_KEY }`,
    //   accounts: [ process.env.PRIVATE_KEY ],
    // }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: 'gas-report.txt',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 200000,
  },
}
