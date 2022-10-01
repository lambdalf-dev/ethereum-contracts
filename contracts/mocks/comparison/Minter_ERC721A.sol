// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../tokens/ERC721/ERC721A.sol";

contract Minter_ERC721A is ERC721A {
	constructor() ERC721A( 'NFT Token', 'TOKEN', 20, 10000 ) {}

	function mint_01() public {
		_safeMint( msg.sender, 1 );
	}

	function mint_05() public {
		_safeMint( msg.sender, 5 );
	}

	function mint_20() public {
		_safeMint( msg.sender, 20 );
	}

	function mint_Max( uint256 max_ ) public {
		for ( uint256 i; i < max_; i += 20 ) {
			uint256 qty = 20;
			if ( i + qty > max_ ) {
				qty = max_ % 20;
			}
			_safeMint( msg.sender, qty );
		}
	}
}
