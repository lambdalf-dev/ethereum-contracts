// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../../interfaces/IERC20Metadata.sol";
import "../ERC20Base.sol";

/**
* @dev Interface for the optional metadata functions from the ERC20 standard.
*/
abstract contract ERC20BaseMetadata is IERC20Metadata, ERC20Base {
	// Token name
	string private _name;

	// Token symbol
	string private _symbol;

	function _initERC20BaseMetadata( string memory name_, string memory symbol_ ) internal {
		_name   = name_;
		_symbol = symbol_;
	}

	/**
	* @dev See {IERC20Metadata-name}.
	*/
	function name() external view virtual returns ( string memory ) {
		return _name;
	}

	/**
	* @dev See {IERC20Metadata-symbol}.
	*/
	function symbol() external view virtual returns ( string memory ) {
		return _symbol;
	}

	/**
	* @dev See {IERC20Metadata-decimals}.
	*/
	function decimals() external pure virtual returns ( uint8 ) {
		return 18;
	}
}
