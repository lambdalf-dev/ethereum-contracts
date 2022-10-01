// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/IPausable.sol";

contract Mock_IPausable is IPausable {
	constructor() {}

	function setPauseState( uint8 newState_ ) public {
		if ( newState_ > OPEN ) {
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
}
