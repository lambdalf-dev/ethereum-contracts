// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../tokens/ERC20/extensions/ERC20BaseCapped.sol";

contract Mock_ERC20BaseCapped is ERC20BaseCapped {
	constructor( uint256 maxSupply_ ) {
		_initERC20BaseCapped( maxSupply_ );
	}

	function mint( address account_, uint256 amount_ ) public {
		_mint( account_, amount_ );
	}

	function mintBatch( address[] memory accounts_, uint256 amount_ ) public {
		_mintBatch( accounts_, amount_ );
	}

	function mintBatch( address[] memory accounts_, uint256[] memory amounts_ ) public {
		_mintBatch( accounts_, amounts_ );
	}
}
