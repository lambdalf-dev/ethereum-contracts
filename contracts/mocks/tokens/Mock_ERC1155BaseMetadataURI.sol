// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import '../../tokens/ERC1155/extensions/ERC1155BaseMetadataURI.sol';

contract Mock_ERC1155BaseMetadataURI is ERC1155BaseMetadataURI {
	constructor() {}

	function setUri( string memory baseURI_ ) public {
		_setUri( baseURI_ );
	}

	function mint( uint256 id_, uint256 amount_ ) public {
		_transfer( msg.sender, address( 0 ), msg.sender, id_, amount_, "" );
	}

	function batchMint( uint256[] memory ids_, uint256[] memory amounts_ ) public {
		_batchTransfer( msg.sender, address( 0 ), msg.sender, ids_, amounts_, "" );
	}
}
