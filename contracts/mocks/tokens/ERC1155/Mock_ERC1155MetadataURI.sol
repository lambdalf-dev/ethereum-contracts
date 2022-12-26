// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC1155/extensions/ERC1155MetadataURI.sol";

contract Mock_ERC1155MetadataURI is ERC1155MetadataURI {
	constructor() {
		_validSeries[ DEFAULT_SERIES ] = true;
		_setUri( "https://api.example.com/metadata/" );
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
