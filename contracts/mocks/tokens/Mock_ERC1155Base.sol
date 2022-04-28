// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import '../../tokens/ERC1155/ERC1155BaseV1.sol';

contract Mock_ERC1155BaseV1 is ERC1155BaseV1 {
	constructor() {}

	function mint( uint256 id_, uint256 amount_ ) public {
		_transfer( msg.sender, address( 0 ), msg.sender, id_, amount_, "" );
	}

	function batchMint( uint256[] memory ids_, uint256[] memory amounts_ ) public {
		_batchTransfer( msg.sender, address( 0 ), msg.sender, ids_, amounts_, "" );
	}
}