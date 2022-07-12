// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
* Edit  : Squeebo
*/

pragma solidity 0.8.10;

abstract contract IWhitelistable_ECDSA {
	// Errors
	error IWhitelistable_NOT_SET();
	error IWhitelistable_CONSUMED( address account );
	error IWhitelistable_FORBIDDEN( address account );

	struct Proof {
		bytes32 r;
		bytes32 s;
		uint8   v;
	}

	address private _adminSigner;
	mapping( address => uint256 ) private _consumed;

	modifier isWhitelisted( address account_, uint256 qty_, uint256 alloted_, Proof memory proof_ ) {
		uint256 _allowed_ = _checkWhitelistAllowance( account_, alloted_, proof_ );

		if ( _allowed_ < qty_ ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		_;
	}

	/**
	* @dev Sets the pass to protect the whitelist.
	*/
	function _setWhitelist( address adminSigner_ ) internal virtual {
		_adminSigner = adminSigner_;
	}

	/**
	* @dev Returns the amount that `account_` is allowed to access from the whitelist.
	* 
	* Requirements:
	* 
	* - `_adminSigner` must be set.
	*/
	function _checkWhitelistAllowance( address account_, uint256 alloted_, Proof memory proof_ ) internal view returns ( uint256 ) {
		if ( _adminSigner == address( 0 ) ) {
			revert IWhitelistable_NOT_SET();
		}

		if ( _consumed[ account_ ] >= alloted_ ) {
			revert IWhitelistable_CONSUMED( account_ );
		}

		bytes32 _digest_ = keccak256( abi.encode( alloted_, account_ ) );
		if ( ! _validateProof( _digest_, proof_ ) ) {
			revert IWhitelistable_FORBIDDEN( account_ );
		}

		return alloted_ - _consumed[ account_ ];
	}

	function _validateProof( bytes32 digest_, Proof memory proof_ ) private view returns ( bool ) {
		address _signer_ = ecrecover( digest_, proof_.v, proof_.r, proof_.s );
		return _signer_ == _adminSigner;
	}

	/**
	* @dev Consumes `amount_` pass passes from `account_`.
	* 
	* Note: Before calling this function, eligibility should be checked through {IWhitelistable-checkWhitelistAllowance}.
	*/
	function _consumeWhitelist( address account_, uint256 qty_ ) internal {
		unchecked {
			_consumed[ account_ ] += qty_;
		}
	}
}
