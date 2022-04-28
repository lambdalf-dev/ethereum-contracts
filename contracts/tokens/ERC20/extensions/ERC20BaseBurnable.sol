// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../ERC20Base.sol";

/**
* @dev Extension of {ERC20Base} that adds a cap to the supply of tokens.
*/
abstract contract ERC20BaseBurnable is ERC20Base {
	/**
	* @dev See {ERC20Base-_burn}.
	*/
	function burn( uint256 amount_ ) public virtual returns ( bool ) {
		_burnFrom( msg.sender, amount_ );
		return true;
	}

	/**
	* @dev See {ERC20Base-_burnFrom} and {IERC20-allowance}.
	*/
	function burnFrom( address owner_, uint256 amount_ ) public virtual returns ( bool ) {
		if ( allowance( owner_, msg.sender ) < amount_ ) {
			revert IERC20_CALLER_NOT_ALLOWED();
		}
		_burnFrom( owner_, amount_ );
		return true;
	}

	function _burnFrom( address owner_, uint256 amount_ ) internal virtual {
		_transferFrom( owner_, address( 0 ), amount_ );
	}
}
