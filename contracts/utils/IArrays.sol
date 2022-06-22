// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

abstract contract IArrays {
	error ARRAY_LENGTH_MISMATCH( uint256 len1, uint256 len2 );

	/**
	* @dev Ensures that array lengths match.
	*/
	modifier validateArrayLengths( uint256 len1_, uint256 len2_ ) {
		if ( len1_ != len2_ ) {
			revert ARRAY_LENGTH_MISMATCH( len1_, len2_ );
		}
		_;
	}
}