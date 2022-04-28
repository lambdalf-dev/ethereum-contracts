// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../tokens/ERC20/extensions/ERC20BaseBurnable.sol";

/**
* @dev Extension of {ERC20Base} that adds a cap to the supply of tokens.
*/
contract Mock_ERC20BaseBurnable is ERC20BaseBurnable {
	constructor() {}

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
