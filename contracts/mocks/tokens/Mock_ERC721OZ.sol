// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
* @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
* the Metadata extension and the Enumerable extension.
* 
* Note: This implementation is only compatible with a sequential order of tokens minted.
* If you need to mint tokens in a random order, you will need to override the following functions:
* ~ ownerOf() 
* ~ _exists()
* ~ _mint()
* Note also that the implementations of the function balanceof() are extremely inefficient and as such, 
* those functions should be avoided inside non-view functions.
*/
contract Mock_ERC721OZ is ERC721 {
	uint256 private _count;

	constructor( string memory name_, string memory symbol_ ) ERC721( name_, symbol_ ) {}

	function mint( uint256 qty_ ) public {
		uint256 _index_ = _count;
		_count += qty_;
		for ( uint256 i; i < qty_; i ++ ) {
			_safeMint( msg.sender, _index_ + i );
		}
	}
}
