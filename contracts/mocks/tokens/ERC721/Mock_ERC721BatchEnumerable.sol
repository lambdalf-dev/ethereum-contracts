// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC721/extensions/ERC721BatchEnumerable.sol";

contract Mock_ERC721BatchEnumerable is ERC721BatchEnumerable {
	constructor() {}

	function mint( address to_, uint256 qty_ ) public {
		if ( to_ == address( 0 ) ) {
			revert IERC721_INVALID_TRANSFER();
		}
		if ( qty_ > 0 ) {
			_mint( to_, qty_ );
		}
	}

	function mint2309( address to_, uint256 qty_ ) public {
		if ( to_ == address( 0 ) ) {
			revert IERC721_INVALID_TRANSFER();
		}
		if ( qty_ > 0 ) {
			_mint2309( to_, qty_ );
		}
	}
}
