// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/ContractState.sol";

contract Mock_ContractState is ContractState {
	uint8 public constant PUBLIC_SALE = 1;
	constructor() {}

	function setPauseState( uint8 newState_ ) public {
		if ( newState_ > PUBLIC_SALE ) {
			revert ContractState_INVALID_STATE( newState_ );
		}

		_setContractState( newState_ );
	}

	function stateIsClosed() public view isState( PAUSED ) returns ( bool ) {
		return true;
	}

	function stateIsNotClosed() public view isNotState( PAUSED ) returns ( bool ) {
		return true;
	}

	function stateIsOpen() public view isState( PUBLIC_SALE ) returns ( bool ) {
		return true;
	}

	function stateIsNotOpen() public view isNotState( PUBLIC_SALE ) returns ( bool ) {
		return true;
	}
}
