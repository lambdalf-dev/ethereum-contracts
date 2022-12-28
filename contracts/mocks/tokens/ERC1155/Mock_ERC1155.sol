// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC1155/ERC1155.sol";

contract Mock_ERC1155 is ERC1155 {
	constructor() {
		_validSeries[ DEFAULT_SERIES ] = true;
	}

	function mint( address toAddress_, uint256 id_, uint256 qty_ ) public {
		if ( qty_ > 0 ) {
			_mint( toAddress_, id_, qty_ );
		}
	}
}
