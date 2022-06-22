// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IPausable.sol";

contract Mock_IPausable_extended is IPausable {
	uint8 constant STAGE2  = 3;

	constructor() {}

	/**
	* @dev Throws if sale state is not ``SALE``.
	*/
	modifier stage2Open {
		if ( saleState != STAGE2 ) {
			revert IPausable_INCORRECT_SALE_STATE( saleState, STAGE2 );
		}
		_;
	}

	function setSaleState( uint8 newState_ ) public {
		_setSaleState( newState_ );
	}

	function saleIsClosed() public view saleClosed returns ( bool ) {
		return true;
	}

	function presaleIsOpen() public view presaleOpen returns ( bool ) {
		return true;
	}

	function saleIsOpen() public view saleOpen returns ( bool ) {
		return true;
	}

	function saleIsStage2() public view stage2Open returns ( bool ) {
		return true;
	}
}
