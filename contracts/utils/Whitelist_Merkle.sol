// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
* Edit  : Squeebo
*/

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract Whitelist_Merkle {
  // Errors
  /**
  * @dev Thrown when trying to query the whitelist while it"s not set
  */
  error Whitelist_NOT_SET();
  /**
  * @dev Thrown when `account` has consumed their alloted access and tries to query more
  * 
  * @param account address trying to access the whitelist
  */
  error Whitelist_CONSUMED(address account);
  /**
  * @dev Thrown when `account` does not have enough alloted access to fulfil their query
  * 
  * @param account address trying to access the whitelist
  */
  error Whitelist_FORBIDDEN(address account);

  /**
  * @dev A structure representing a specific whitelist.
  */
  struct Whitelist {
    bytes32 root;
    uint256 alloted;
    mapping(address => uint256) consumed;
  }

  mapping(uint256 => Whitelist) private _whitelists;

  // **************************************
  // *****          MODIFIER          *****
  // **************************************
    /**
    * @dev Ensures that `account_` is allowed to mint `qty_` token on the identified whitelist
    * 
    * @param account_ the address to verify
    * @param proof_ the Merkle Proof for the whitelist
    * @param qty_ the amount of tokens desired
    * @param whitelistId_ the whitelist identifier
    */
    modifier isWhitelisted(address account_, bytes32[] memory proof_, uint256 qty_, uint256 whitelistId_) {
      uint256 _alloted_ = checkWhitelistAllowance(account_, proof_, whitelistId_);
      if (_alloted_ < qty_) {
        revert Whitelist_FORBIDDEN(account_);
      }
      _;
    }
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Internal function consuming `amount_` whitelist access from `account_`.
    * 
    * Note: Before calling this function, eligibility should be checked through {_checkWhitelistAllowance}
    * 
    * @param account_ the address to verify
    * @param qty_ the amount of whitelist allowance consumed
    * @param whitelistId_ the whitelist identifier
    */
    function _consumeWhitelist(address account_, uint256 qty_, uint256 whitelistId_) internal {
      unchecked {
        _whitelists[ whitelistId_ ].consumed[ account_ ] += qty_;
      }
    }
    /**
    * @dev Internal function setting up a whitelist.
    * 
    * @param root_ the whitelist"s Merkle root
    * @param alloted_ the max amount people can mint on whitelist
    * @param whitelistId_ the whitelist identifier
    */
    function _setWhitelist(bytes32 root_, uint256 alloted_, uint256 whitelistId_) internal virtual {
      _whitelists[ whitelistId_ ].alloted = alloted_;
      _whitelists[ whitelistId_ ].root    = root_;
    }
    /**
    * @dev Internal function ensuring that `account_` is indeed on the whitelist identified
    * 
    * @param account_ the address to verify
    * @param proof_ the Merkle Proof for the whitelist
    * @param whitelistId_ the whitelist identifier
    * 
    * @return bool : whether `account_` is whitelisted or not
    */
    function _validateProof(
      address account_,
      bytes32[] memory proof_,
      uint256 whitelistId_
    ) private view returns (bool) {
      bytes32 _leaf_ = keccak256(abi.encodePacked(account_));
      return MerkleProof.processProof(proof_, _leaf_) == _whitelists[ whitelistId_ ].root;
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /**
    * @dev Internal function returning the amount that `account_` is allowed to access from the whitelist.
    * 
    * Requirements:
    * 
    * - the whitelist with identifier `whitelistId_` must be set.
    * 
    * @param account_ the address to verify
    * @param proof_ the Merkle Proof for the whitelist
    * @param whitelistId_ the whitelist identifier
    * 
    * @return uint256 : the total amount of whitelist allocation remaining for `account_`
    */
    function checkWhitelistAllowance(
      address account_,
      bytes32[] memory proof_,
      uint256 whitelistId_
    ) public view returns (uint256) {
      if (_whitelists[ whitelistId_ ].root == 0) {
        revert Whitelist_NOT_SET();
      }
      if (_whitelists[ whitelistId_ ].consumed[ account_ ] >= _whitelists[ whitelistId_ ].alloted) {
        revert Whitelist_CONSUMED(account_);
      }
      if (! _validateProof(account_, proof_, whitelistId_)) {
        revert Whitelist_FORBIDDEN(account_);
      }
      uint256 _res_;
      unchecked {
        _res_ = _whitelists[ whitelistId_ ].alloted - _whitelists[ whitelistId_ ].consumed[ account_ ];
      }
      return _res_;
    }
  // **************************************
}
