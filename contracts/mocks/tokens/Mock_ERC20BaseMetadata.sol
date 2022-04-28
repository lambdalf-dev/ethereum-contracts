// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../tokens/ERC20/extensions/ERC20BaseMetadata.sol";

contract Mock_ERC20BaseMetadata is ERC20BaseMetadata {
	constructor( string memory name_, string memory symbol_ ) { 
		_initERC20BaseMetadata( name_, symbol_ );
	}

	function mint( address recipient_, uint256 amount_ ) public {
		_mint( recipient_, amount_ );
	}

	function mintBatch( address[] memory recipients_, uint256 amount_ ) public {
		_mintBatch( recipients_, amount_ );
	}

	function mintBatch( address[] memory recipients_, uint256[] memory amounts_ ) public {
		_mintBatch( recipients_, amounts_ );
	}
}
