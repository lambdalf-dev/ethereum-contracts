// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/Context.sol";

/**
* @dev Contract module which provides a basic access control mechanism, where
* there is an account (an owner) that can be granted exclusive access to
* specific functions.
*
* By default, the owner account will be the one that deploys the contract. This
* can later be changed with {transferOwnership}.
*
* This module is used through inheritance. It will make available the modifier
* `onlyOwner`, which can be applied to your functions to restrict their use to
* the owner.
*/
abstract contract IOwnable is Context {
	// Errors
	error IOwnable_NOT_OWNER( address operator );

	// The owner of the contract
	address private _owner;

	/**
	* @dev Emitted when contract ownership changes.
	*/
	event OwnershipTransferred( address indexed previousOwner, address indexed newOwner );

	/**
	* @dev Initializes the contract setting the deployer as the initial owner.
	*/
	function _initIOwnable( address owner_ ) internal {
		_owner = owner_;
	}

	/**
	* @dev Returns the address of the current owner.
	*/
	function owner() public view virtual returns ( address ) {
		return _owner;
	}

	/**
	* @dev Throws if called by any account other than the owner.
	*/
	modifier onlyOwner() {
		address _sender_ = _msgSender();
		if ( owner() != _sender_ ) {
			revert IOwnable_NOT_OWNER( _sender_ );
		}
		_;
	}

	/**
	* @dev Transfers ownership of the contract to a new account (`newOwner`).
	* Can only be called by the current owner.
	*/
	function transferOwnership( address newOwner_ ) public virtual onlyOwner {
		address _oldOwner_ = _owner;
		_owner = newOwner_;
		emit OwnershipTransferred( _oldOwner_, newOwner_ );
	}
}
