// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC721/ERC721Batch.sol";
import "../../../interfaces/IERC165.sol";

contract Mock_ERC721Batch is ERC721Batch, IERC165 {
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

  // ***********
  // * IERC165 *
  // ***********
    /**
    * @dev See {IERC165-supportsInterface}.
    */
    function supportsInterface( bytes4 interfaceId_ ) public pure virtual override returns ( bool ) {
      return interfaceId_ == type( IERC721 ).interfaceId ||
             interfaceId_ == type( IERC165 ).interfaceId;
    }
  // ***********
}
