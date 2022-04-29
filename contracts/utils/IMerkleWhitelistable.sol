// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
* Edit  : Squeebo
*/

pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract IMerkleWhitelistable {
	// Errors
	error IWhitelistable_NOT_SET();
	error IWhitelistable_CONSUMED( address account );
	error IWhitelistable_FORBIDDEN( address account );

	bytes32 private _root;
	mapping( address => uint256 ) private _consumed;

	modifier isWhitelisted( address account_, bytes32[] memory proof_, uint256 passMax_, uint256 qty_ ) {
		// if ( qty_ > passMax_ ) {
		// 	revert IWhitelistable_FORBIDDEN( account_ );
		// }

		uint256 _allowed_ = _checkWhitelistAllowance( account_, proof_/*, passMax_*/ );

		if ( _allowed_ < 1/*qty_*/ ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		_;
	}

	/**
	* @dev Sets the pass to protect the whitelist.
	*/
	function _setWhitelist( bytes32 root_ ) internal virtual {
		_root = root_;
	}

	/**
	* @dev Returns the amount that `account_` is allowed to access from the whitelist.
	* 
	* Requirements:
	* 
	* - `_root` must be set.
	* 
	* See {IWhitelistable-_consumeWhitelist}.
	*/
	function _checkWhitelistAllowance( address account_, bytes32[] memory proof_/*, uint256 passMax_*/ ) internal view returns ( uint256 ) {
		if ( _root == 0 ) {
			revert IWhitelistable_NOT_SET();
		}

		if ( _consumed[ account_ ] >= 1/*passMax_*/ ) {
			revert IWhitelistable_CONSUMED( account_ );
		}

		if ( ! _computeProof( account_, proof_ ) ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		// uint256 _res_;
		// unchecked {
		// 	_res_ = passMax_ - _consumed[ account_ ];
		// }

		return 1/*_res_*/;
	}

	function _computeProof( address account_, bytes32[] memory proof_ ) private view returns ( bool ) {
		bytes32 leaf = keccak256(abi.encodePacked(account_));
		return MerkleProof.processProof( proof_, leaf ) == _root;
	}

	/**
	* @dev Consumes `amount_` pass passes from `account_`.
	* 
	* Note: Before calling this function, eligibility should be checked through {IWhitelistable-checkWhitelistAllowance}.
	*/
	function _consumeWhitelist( address account_/*, uint256 qty_*/ ) internal {
		unchecked {
			_consumed[ account_ ] += 1/*qty_*/;
		}
	}
}
