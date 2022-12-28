// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC721/extensions/ERC721BatchBurnable.sol";

contract Mock_ERC721BatchBurnable is ERC721BatchBurnable {
	constructor() {}

	function mint( address to_, uint256 qty_ ) public {
		if ( qty_ > 0 ) {
			_mint( to_, qty_ );
		}
	}

	function mint2309( address to_, uint256 qty_ ) public {
		if ( qty_ > 0 ) {
			_mint2309( to_, qty_ );
		}
	}
}
