// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../utils/ERC2981.sol';

contract Mock_ERC2981 is ERC2981 {
	constructor( address recipient_, uint256 royaltyRate_ ) {
		_setRoyaltyInfo( recipient_, royaltyRate_ );
	}

	function setRoyaltyInfo( address recipient_, uint256 royaltyRate_ ) public {
		_setRoyaltyInfo( recipient_, royaltyRate_ );
	}
}
