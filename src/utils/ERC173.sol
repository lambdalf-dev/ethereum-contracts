// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity ^0.8.17;

import { IERC173 } from "../interfaces/IERC173.sol";

abstract contract ERC173 is IERC173 {
  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    /// @dev The current contract owner.
    address private _owner;
  // **************************************

  constructor(address owner_) {
    _owner = owner_;
  }

  // **************************************
  // *****          MODIFIERS         *****
  // **************************************
    /// @dev Throws if called by any account other than the owner.
    modifier onlyOwner() {
      if (owner() != msg.sender) {
        revert IERC173_NOT_OWNER();
      }
      _;
    }
  // **************************************

  // **************************************
  // *****       CONTRACT_OWNER       *****
  // **************************************
    /// @dev Transfers ownership of the contract to `newOwner_`.
    /// 
    /// @param newOwner_ address of the new contract owner
    /// 
    /// Requirements:
    /// 
    /// - Caller must be the contract owner.
    function transferOwnership(address newOwner_) public virtual override onlyOwner {
      address _oldOwner_ = _owner;
      _owner = newOwner_;
      emit OwnershipTransferred(_oldOwner_, newOwner_);
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /// @dev Returns the address of the current contract owner.
    /// 
    /// @return contractOwner the current contract owner
    function owner() public virtual view override returns (address contractOwner) {
      return _owner;
    }
  // **************************************
}
