// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../tokens/ERC721/ERC721B.sol";

contract Minter_ERC721B is ERC721B {
	constructor() ERC721B( 'NFT Token', 'TOKEN' ) {}

	function mint_01() public {
		_safeMint( msg.sender, 0 );
	}

	function mint_05() public {
		for ( uint256 i; i < 5; i ++ ) {
			_safeMint( msg.sender, i );
		}
	}

	function mint_20() public {
		for ( uint256 i; i < 20; i ++ ) {
			_safeMint( msg.sender, i );
		}
	}

	function mint_Max( uint256 max_ ) public {
		for ( uint256 i; i < max_; i ++ ) {
			_safeMint( msg.sender, i );
		}
	}

	function tokenURI( uint256 tokenId_ ) public virtual view override returns ( string memory ) {
		return "";
	}
}
