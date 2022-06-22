// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

abstract contract IPausable {
	// Enum to represent the sale state, defaults to ``CLOSED``.
	uint8 constant CLOSED  = 0;
	uint8 constant PRESALE = 1;
	uint8 constant SALE    = 2;

	// Errors
	error IPausable_INCORRECT_SALE_STATE( uint8 currentState, uint8 requiredState );

	// The current state of the contract
	uint8 public saleState;

	/**
	* @dev Emitted when the sale state changes
	*/
	event SaleStateChanged( uint8 indexed previousState, uint8 indexed newState );

	/**
	* @dev Sale state can have one of 3 values, ``CLOSED``, ``PRESALE``, or ``SALE``.
	*/
	function _setSaleState( uint8 newState_ ) internal virtual {
		uint8 _previousState_ = saleState;
		saleState = newState_;
		emit SaleStateChanged( _previousState_, newState_ );
	}

	/**
	* @dev Throws if sale state is not ``CLOSED``.
	*/
	modifier saleClosed {
		if ( saleState != CLOSED ) {
			revert IPausable_INCORRECT_SALE_STATE( saleState, CLOSED );
		}
		_;
	}

	/**
	* @dev Throws if sale state is not ``SALE``.
	*/
	modifier saleOpen {
		if ( saleState != SALE ) {
			revert IPausable_INCORRECT_SALE_STATE( saleState, SALE );
		}
		_;
	}

	/**
	* @dev Throws if sale state is not ``PRESALE``.
	*/
	modifier presaleOpen {
		if ( saleState != PRESALE ) {
			revert IPausable_INCORRECT_SALE_STATE( saleState, PRESALE );
		}
		_;
	}
}
