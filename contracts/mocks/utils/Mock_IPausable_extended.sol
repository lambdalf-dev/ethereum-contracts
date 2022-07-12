// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IPausable.sol";

contract Mock_IPausable_Extended is IPausable {
	uint8 constant STAGE2  = 2;

	constructor() {}

	function setPauseState( uint8 newState_ ) public {
		if ( newState_ > STAGE2 ) {
			revert IPausable_INVALID_STATE( newState_ );
		}

		_setPauseState( newState_ );
	}

	function stateIsClosed() public view isClosed returns ( bool ) {
		return true;
	}

	function stateIsNotClosed() public view isNotClosed returns ( bool ) {
		return true;
	}

	function stateIsOpen() public view isOpen returns ( bool ) {
		return true;
	}

	function stateIsNotOpen() public view isNotOpen returns ( bool ) {
		return true;
	}

	function stateIsStage2() public view returns ( bool ) {
		uint8 _currentState_ = getPauseState();
		if ( _currentState_ != STAGE2 ) {
			revert IPausable_INCORRECT_STATE( _currentState_ );
		}

		return true;
	}

	function stateIsNotStage2() public view returns ( bool ) {
		uint8 _currentState_ = getPauseState();
		if ( _currentState_ == STAGE2 ) {
			revert IPausable_INCORRECT_STATE( _currentState_ );
		}

		return true;
	}
}
