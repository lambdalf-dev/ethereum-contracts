// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/ERC2981Base.sol";

contract Mock_ERC2981Base is ERC2981Base {
	constructor( address recipient_, uint256 royaltyRate_ ) {
		_initERC2981Base( recipient_, royaltyRate_ );
	}

	function setRoyaltyInfo( address recipient_, uint256 royaltyRate_ ) public {
		_setRoyaltyInfo( recipient_, royaltyRate_ );
	}
}
