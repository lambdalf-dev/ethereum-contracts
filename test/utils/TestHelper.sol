// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { Test } from "forge-std/src/Test.sol";

contract Accounts is Test {
  // Default token owner
  Account public ALICE;
  // Other token owner
  Account public BOB;
  // Default approved operator
  Account public OPERATOR;
  // Default transaction recipient
  Account public RECIPIENT;
  // Default treasury
  Account public TREASURY;
  // Default royalty recipient
  Account public ROYALTY_RECIPIENT;
  // Whitelist signer
  Account public SIGNER;
  // Whitelist forger
  Account public FORGER;

  /// @dev Generates a user, labels its address, and funds it with test assets.
  function _createUser(string memory name) internal returns (Account memory account) {
    account = makeAccount(name);
    vm.deal({ account: account.addr, newBalance: 100 ether });
  }
}

contract ContractHelper {
  function _isContract(address account) internal view returns (bool) {
    uint256 _size_;
    assembly {
      _size_ := extcodesize(account)
    }
    return _size_ > 0;
  }
}

contract Constants {
  string public constant NAME = "NFT Collection";
  string public constant SYMBOL = "NFT";
  string public constant BASE_URI = "https://api.example.com/";
  string public constant NEW_BASE_URI = "https://example.com/api/";
  uint256 public constant FIRST_TOKEN = 1;
  uint256 public constant TARGET_TOKEN = 4;
  uint256 public constant TARGET_INDEX = 3;
  uint256 public constant BOB_TOKEN = 7;
  uint256 public constant ALICE_INIT_SUPPLY = 6;
  uint256 public constant ALICE_MORE_SUPPLY = 3;
  uint256 public constant ALICE_SUPPLY = ALICE_INIT_SUPPLY + ALICE_MORE_SUPPLY;
  uint256 public constant BOB_SUPPLY = 1;
  uint256 public constant MINTED_SUPPLY = ALICE_SUPPLY + BOB_SUPPLY;
  uint256 public constant BURNED_SUPPLY = 1;
  uint256 public constant DEFAULT_SERIES = 0;
  uint256 public constant SERIES_ID = 1;
  uint256 public constant TARGET_AMOUNT = 2;
  uint256 public constant MAX_BATCH = 10;
  uint256 public constant MAX_SUPPLY = 5000;
  uint256 public constant RESERVE = 5;
  uint256 public constant PRIVATE_SALE_PRICE = 1000000000000000000;
  uint256 public constant PUBLIC_SALE_PRICE = 2000000000000000000;
  uint96 public constant ROYALTY_BASE = 10_000;
  uint96 public constant ROYALTY_RATE = 100;
  bytes4 public constant RETVAL = 0x000d0b74;
  bytes public constant DATA = "0x000d0b7417742123dfd8";
  uint8 public constant WHITELIST_ID = 1;
  uint256 public constant ALLOCATED = 5;
  uint256 public constant WHITELIST_CONSUMED = 1;
}

abstract contract TestHelper is Constants, Accounts, ContractHelper {
  function setUp() public virtual {
    ALICE = _createUser("Alice");
    BOB = _createUser("Bob");
    OPERATOR = _createUser("Operator");
    RECIPIENT = _createUser("Recipient");
    TREASURY = _createUser("Treasury");
    ROYALTY_RECIPIENT = _createUser("RoyaltyRecipient");
    SIGNER = _createUser("Signer");
    FORGER = _createUser("Forger");
  }
}
