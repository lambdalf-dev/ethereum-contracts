# Ethereum Contracts

This project is an attempt to create a more efficient implementation of the common interface IERC721 compared to Open Zeppelin's implementation.

## Installation

### Hardhat

Run `npm install` in the command line to install the list of dependencies.

### Foundry

Ensure you have rust installed. Afterwards, follow the installation guide to install Foundry _(https://book.getfoundry.sh/getting-started/installation)_. Finally, run the following command to install the necessary libraries for forge testing.

```bash
git submodule update --init --recursive
```

## Commands

### Hardhat

- `npx hardhat help` Display Hardhat help section
- `npx hardhat clean` Cleans hardhat generated files
- `npx hardhat compile` Compiles the contract and generate artifacts
- `npx hardhat test` Runs the test suite and generate a gas usage report
- `npx hardhat coverage` Runs the test suite and generates a coverage report
- `npx hardhat check` Runs the linter test
- `npx hardhat run scripts/deployTest.js --network goerli` Runs the deployment script on Goerli testnet (requires ALCHEMY_API_KEY and TEST_PRIVATE_KEY)
- `npx hardhat verify <contract address> --network goerli [constructor parameters]` Verify the contract on Goerli testnet (requires ETHERSCAN_API_KEY)
- `npx hardhat run scripts/deploy.js --network mainnet` Runs the deployment script on Ethereum mainnet (requires ALCHEMY_API_KEY and PRIVATE_KEY)
- `npx hardhat verify <contract address> --network mainnet [constructor parameters]` Verify the contract on Ethereum mainnet (requires ETHERSCAN_API_KEY)
- `npx hardhat generate-proofs` Generate a set of proofs for the list of addresses saved in `/generate-proofs/whitelist.js` (requires SIGNER_PRIVATE_KEY and SIGNER_ADDRESS)
- `npx hardhat generate-proofs-hardhat` Generate a set of proofs for each hardhat signer
- `npx hardhat create-wallet` Creates a brand new wallet and displays its Private Key and Address on the console

### Foundry

- `forge test` Run all tests under _test/foundry_
- `forge test -m <TEST NAME>` Run only tests with the following TEST_NAME
- `forge test -v` Run tests (or single tests with `-m`) in verbose mode. This can be extended to `-vvvvv` for the most amount of verbosity
- `forge test --debug <TEST_NAME>` Run TEST_NAME in debugger
- `forge coverage --report debug` Run test coverage and generate coverage report in command line
- `forge coverage --report lcov` Run test coverage and generate coverage report file
