// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.20;

import { IWhitelist } from "../interfaces/IWhitelist.sol";

abstract contract Whitelist is IWhitelist {
  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    /// @dev The address signing the whitelist proofs.
    address private _adminSigner;
    /// @dev Whitelist ID mapped to user's whitelist concumption.
    mapping(uint8 => mapping(address => uint256)) private _consumed;
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /// @dev Returns the amount that `account_` is allowed to access from the whitelist.
    /// 
    /// @param account_ the address to validate access
    /// @param whitelistId_ the identifier of the whitelist being queried
    /// @param alloted_ the max amount of whitelist spots allocated
    /// @param proof_ the signature proof to validate whitelist allocation
    /// 
    /// @return remainingAllocation the total amount of whitelist allocation remaining for `account_`
    /// 
    /// Requirements:
    /// 
    /// - `_adminSigner` must be set.
    function checkWhitelistAllowance(address account_, uint8 whitelistId_, uint256 alloted_, Proof memory proof_) public virtual view returns (uint256 remainingAllocation) {
      if (_adminSigner == address(0)) {
        revert WHITELIST_NOT_SET();
      }
      if (! _validateProof(account_, whitelistId_, alloted_, proof_)) {
        return 0;
      }
      return alloted_ - _consumed[whitelistId_][account_];
    }
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /// @dev Consumes `amount_` whitelist access passes from `account_`.
    /// 
    /// Note: Before calling this function, eligibility should be checked through {checkWhitelistAllowance}.
    /// 
    /// @param account_ the address to consume access from
    /// @param whitelistId_ the identifier of the whitelist being queried
    /// @param qty_ the amount of whitelist access consumed
    function _consumeWhitelist(address account_, uint8 whitelistId_, uint256 qty_) internal virtual {
      unchecked {
        _consumed[whitelistId_][account_] += qty_;
      }
    }
    /// @notice Updates the whitelist signer.
    /// 
    /// @param newAdminSigner_ the new whitelist signer
    ///  
    /// Requirements:
    function _setWhitelist(address newAdminSigner_) internal virtual {
      _adminSigner = newAdminSigner_;
    }
    /// @dev Internal function to decode a signature and compare it with the `_adminSigner`.
    /// 
    /// @param account_ the address to validate access
    /// @param whitelistId_ the identifier of the whitelist being queried
    /// @param alloted_ the max amount of whitelist spots allocated
    /// @param proof_ the signature proof to validate whitelist allocation
    /// 
    /// @return isValid whether the signature is valid or not
    function _validateProof(address account_, uint8 whitelistId_, uint256 alloted_, Proof memory proof_) internal virtual view returns (bool isValid) {
      bytes32 _digest_ = keccak256(abi.encode(whitelistId_, alloted_, account_));
      address _signer_ = ecrecover(_digest_, proof_.v, proof_.r, proof_.s);
      return _signer_ == _adminSigner;
    }
  // **************************************
}