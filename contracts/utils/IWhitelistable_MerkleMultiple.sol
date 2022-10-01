// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
* Edit  : Squeebo
*/

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract IWhitelistable_MerkleMultiple {
	// Errors
	error IWhitelistable_NOT_SET();
	error IWhitelistable_CONSUMED( address account );
	error IWhitelistable_FORBIDDEN( address account );

	struct Whitelist {
		bytes32 root;
		uint256 passMax;
		mapping( address => uint256 ) consumed;
	}

	mapping( uint256 => Whitelist ) private _whitelists;

	/**
	* @dev Ensures that `account_` is allowed to mint `qty_` token on the identified whitelist
	* 
	* @param account_     ~ type = address   : the address to verify
	* @param proof_       ~ type = bytes32[] : the Merkle Proof for the whitelist
	* @param qty_         ~ type = uint256   : the amount of tokens desired
	* @param whitelistId_ ~ type = uint256   : the whitelist identifier
	*/
	modifier isWhitelisted( address account_, bytes32[] memory proof_, uint256 qty_, uint256 whitelistId_ ) {
		uint256 _allowed_ = _checkWhitelistAllowance( account_, proof_, whitelistId_ );

		if ( _allowed_ < qty_ ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		_;
	}

	/**
	* @dev Internal function setting up a whitelist.
	* 
	* @param root_        ~ type = bytes32   : the whitelist's Merkle root
	* @param passMax_     ~ type = uint256   : the max amount people can mint on whitelist
	* @param whitelistId_ ~ type = uint256   : the whitelist identifier
	*/
	function _setWhitelist( bytes32 root_, uint256 passMax_, uint256 whitelistId_ ) internal virtual {
		_whitelists[ whitelistId_ ].passMax = passMax_;
		_whitelists[ whitelistId_ ].root    = root_;
	}

	/**
	* @dev Internal function returning the amount that `account_` is allowed to access from the whitelist.
	* 
	* Requirements:
	* 
	* - the whitelist with identifier `whitelistId_` must be set.
	* 
	* @param account_     ~ type = address   : the address to verify
	* @param proof_       ~ type = bytes32[] : the Merkle Proof for the whitelist
	* @param whitelistId_ ~ type = uint256   : the whitelist identifier
	*/
	function _checkWhitelistAllowance( address account_, bytes32[] memory proof_, uint256 whitelistId_ ) internal view returns ( uint256 ) {
		if ( _whitelists[ whitelistId_ ].root == 0 ) {
			revert IWhitelistable_NOT_SET();
		}

		if ( _whitelists[ whitelistId_ ].consumed[ account_ ] >= _whitelists[ whitelistId_ ].passMax ) {
			revert IWhitelistable_CONSUMED( account_ );
		}

		if ( ! _computeProof( account_, proof_, whitelistId_ ) ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		uint256 _res_;
		unchecked {
			_res_ = _whitelists[ whitelistId_ ].passMax - _whitelists[ whitelistId_ ].consumed[ account_ ];
		}

		return _res_;
	}

	/**
	* @dev Internal function ensuring that `account_` is indeed on the whitelist identified
	* 
	* @param account_     ~ type = address   : the address to verify
	* @param proof_       ~ type = bytes32[] : the Merkle Proof for the whitelist
	* @param whitelistId_ ~ type = uint256   : the whitelist identifier
	*/
	function _computeProof( address account_, bytes32[] memory proof_, uint256 whitelistId_ ) private view returns ( bool ) {
		bytes32 _leaf_ = keccak256( abi.encodePacked( account_ ) );
		return MerkleProof.processProof( proof_, _leaf_ ) == _whitelists[ whitelistId_ ].root;
	}

	/**
	* @dev Consumes `amount_` pass passes from `account_`.
	* 
	* Note: Before calling this function, eligibility should be checked through {_checkWhitelistAllowance}
	* 
	* @param account_     ~ type = address   : the address to verify
	* @param qty_         ~ type = uint256   : the amount of whitelist allowance consumed
	* @param whitelistId_ ~ type = uint256   : the whitelist identifier
	*/
	function _consumeWhitelist( address account_, uint256 qty_, uint256 whitelistId_ ) internal {
		unchecked {
			_whitelists[ whitelistId_ ].consumed[ account_ ] += qty_;
		}
	}
}
