// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

interface IWhitelist {
  // **************************************
  // *****         DATA TYPES         *****
  // **************************************
    /// @dev A structure representing a signature proof to be decoded by the contract
    struct Proof {
      bytes32 r;
      bytes32 s;
      uint8   v;
    }
  // **************************************

  // **************************************
  // *****           ERRORS           *****
  // **************************************
    /// @dev Thrown when trying to query the whitelist while it's not set
    error WHITELIST_NOT_SET();
    /// @dev Thrown when `account` does not have enough alloted access to fulfil their query
    /// 
    /// @param account address trying to access the whitelist
    error WHITELIST_FORBIDDEN(address account);
  // **************************************
}
