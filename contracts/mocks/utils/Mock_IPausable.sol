// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IPausable.sol";

contract Mock_IPausable is IPausable {
	constructor() {}

	function setSaleState( SaleState newState_ ) public {
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
}
