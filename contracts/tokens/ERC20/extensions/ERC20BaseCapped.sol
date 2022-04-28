// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../ERC20Base.sol";

/**
* @dev Extension of {ERC20Base} that adds a cap to the supply of tokens.
*/
abstract contract ERC20BaseCapped is ERC20Base {
	// Errors
	error ERC20BaseCapped_INVALID_MAX_SUPPLY();
	error ERC20BaseCapped_MAX_SUPPLY_EXCEEDED();

	uint256 public MAX_SUPPLY;

	/**
	* @dev Sets the value of the `MAX_SUPPLY`. This value is immutable, it can only be
	* set once during construction.
	*/
	function _initERC20BaseCapped( uint256 maxSupply_ ) internal {
		if ( maxSupply_ < 1 ) {
			revert ERC20BaseCapped_INVALID_MAX_SUPPLY();
		}
		MAX_SUPPLY = maxSupply_;
	}

	/**
	* @dev See {ERC20Base-airdrop}.
	*/
	function _mint( address account_, uint256 amount_ ) internal virtual override {
		if ( ERC20Base.totalSupply() + amount_ > MAX_SUPPLY ) {
			revert ERC20BaseCapped_MAX_SUPPLY_EXCEEDED();
		}

		super._mint( account_, amount_ );
	}

	/**
	* @dev See {ERC20Base-mintBatch}.
	*/
	function _mintBatch( address[] memory accounts_, uint256 amount_ ) internal virtual override {
		if ( ERC20Base.totalSupply() + amount_ * accounts_.length > MAX_SUPPLY ) {
			revert ERC20BaseCapped_MAX_SUPPLY_EXCEEDED();
		}

		super._mintBatch( accounts_, amount_ );
	}

	/**
	* @dev See {ERC20Base-mintBatch}.
	*/
	function _mintBatch( address[] memory accounts_, uint256[] memory amounts_ ) internal virtual override {
		uint256 _amount_;
		uint256 _len_ = amounts_.length;

		for ( uint i; i < _len_; i ++ ) {
			_amount_ += amounts_[ i ];
		}

		if ( ERC20Base.totalSupply() + _amount_ > MAX_SUPPLY ) {
			revert ERC20BaseCapped_MAX_SUPPLY_EXCEEDED();
		}

		super._mintBatch( accounts_, amounts_ );
	}
}
