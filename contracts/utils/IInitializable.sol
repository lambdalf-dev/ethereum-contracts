// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

abstract contract IInitializable {
	// Errors
	error IInitializable_ALREADY_INITIALIZED();

	bool private _initialized;

	modifier initializer() {
		if ( _initialized ) {
			revert IInitializable_ALREADY_INITIALIZED();
		}

		_;

		_initialized = true;
	}
}
