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

	function mint( uint256 id_, uint256 qty_, address to_ ) public isValidSeries( id_ ) {
		if ( to_ == address( 0 ) ) {
			revert IERC1155_INVALID_TRANSFER();
		}
		if ( qty_ > 0 ) {
			_mint( to_, id_, qty_ );
		}
	}
}
