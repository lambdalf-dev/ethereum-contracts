// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../../tokens/ERC1155/ERC1155.sol';
import '../../../interfaces/IERC165.sol';

contract Mock_ERC1155 is ERC1155, IERC165 {
	constructor() {
		_validSeries[ DEFAULT_SERIES ] = true;
	}

	function mint( address toAddress_, uint256 id_, uint256 qty_ ) public {
		if ( qty_ > 0 ) {
			_mint( toAddress_, id_, qty_ );
		}
	}

  // ***********
  // * IERC165 *
  // ***********
    /**
    * @dev See {IERC165-supportsInterface}.
    */
    function supportsInterface( bytes4 interfaceId_ ) public pure virtual override returns ( bool ) {
      return interfaceId_ == type( IERC1155 ).interfaceId ||
             interfaceId_ == type( IERC165 ).interfaceId;
    }
  // ***********
}
