// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../tokens/ERC721/extensions/Reg_ERC721BatchBurnable.sol";

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
contract Mock_Reg_ERC721BatchBurnable is Reg_ERC721BatchBurnable {
	constructor( string memory baseURI_, string memory symbol_, string memory name_ ) {
		_initERC721Metadata( name_, symbol_, baseURI_ );
	}

	function mint( address to_, uint256 qty_ ) public {
		if ( to_ == address( 0 ) ) {
			revert IERC721_INVALID_TRANSFER();
		}
		if ( qty_ > 0 ) {
			_mint( to_, qty_ );
		}
	}

	function setBaseURI( string memory baseURI_ ) public {
		_setBaseURI( baseURI_ );
	}
}
