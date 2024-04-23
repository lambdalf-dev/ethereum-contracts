# Ethereum Contracts

This project is an attempt to create a more efficient implementation of the common interface IERC721 compared to Open Zeppelin's implementation.

## What's Inside

- [Forge](https://github.com/foundry-rs/foundry/blob/master/forge): compile, test, fuzz, format, and deploy smart
  contracts
- [Forge Std](https://github.com/foundry-rs/forge-std): collection of helpful contracts and utilities for testing

## Installation

Foundry typically uses git submodules to manage dependencies, but this template uses Node.js packages because
[submodules don't scale](https://twitter.com/PaulRBerg/status/1736695487057531328).

This is how to install dependencies:

1. Install the dependency using your preferred package manager, e.g. `yarn install dependency-name`
   - Use this syntax to install from GitHub: `yarn install github:username/repo-name`
2. Add a remapping for the dependency in [remappings.txt](./remappings.txt), e.g.
   `dependency-name=node_modules/dependency-name`

## Usage

### Build/Compile

Build the contracts:

- ```yarn build```
- ```forge build```
- ```forge compile```

### Clean

Delete the build artifacts and cache directories:

- ```yarn clean```
- ```forge clean```

### Coverage

Get a test coverage report:

- ```yarn coverage```
- ```forge coverage```

### Gas Report

Get a gas report:

- ```yarn gas```
- ```forge test --gas-report```

### Lint

Format the contracts:

- ```yarn lint```
- ```forge fmt check```

### Test

Run all tests:

- ```yarn test```
- ```forge test```

Run all tests with verbose output:

- ```yarn test:verbose```
- ```forge test -vvvv```

Run all unit tests (test name starts with "test_unit_"):

- ```yarn test:unit```
- ```forge test --mt test_unit_```

Run all fuzz tests (test name starts with "test_fuzz_"):

- ```yarn test:fuzz```
- ```forge test --mt test_fuzz_```

Run all edge tests (test name starts with "test_edge_"):

- ```yarn test:edge```
- ```forge test --mt test_edge_```
