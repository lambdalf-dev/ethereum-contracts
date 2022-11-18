// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

abstract contract BlacklistRegistry {
  /**
  * @dev Thrown when a blacklisted operator tries to operate.
  * 
  * @param operator : address that is trying to approve themselves
  */
	error BlacklistRegistry_NOT_ALLOWED( address operator );

	// list of blacklisted addresses
	address[] public blacklistRegistry;

	/**
	* @dev Internal function that adds a proxy registry to the list of accepted proxy registries.
	* 
	* @param address_ : the address to be blacklisted
	*/
	function _blacklistAddress( address address_ ) internal {
		uint256 _index_ = blacklistRegistry.length;
		while ( _index_ > 0 ) {
			unchecked {
				_index_ --;
			}
			if ( blacklistRegistry[ _index_ ] == address_ ) {
				return;
			}
		}
		blacklistRegistry.push( address_ );
	}

	/**
	* @dev Internal function that removes a proxy registry from the list of accepted proxy registries.
	* 
	* @param address_ : the address of the proxy registry to remove
	*/
	function _removeBlacklistedAddress( address address_ ) internal {
		uint256 _len_ = blacklistRegistry.length;
		uint256 _index_ = _len_;
		while ( _index_ > 0 ) {
			unchecked {
				_index_ --;
			}
			if ( blacklistRegistry[ _index_ ] == address_ ) {
				if ( _index_ + 1 != _len_ ) {
					blacklistRegistry[ _index_ ] = blacklistRegistry[ _len_ - 1 ];
				}
				blacklistRegistry.pop();
				return;
			}
		}
	}

	/**
	* @dev Internal function that checks if `operator_` is a registered proxy for `tokenOwner_`.
	* 
	* Note: Use this function to allow whitelisting of registered proxy.
	* 
	* @param operator_   : the proxy address that operates on behalf of the token owner
	* 
	* @return bool : whether `operator_` is allowed to operate on behalf of `tokenOwner_` or not
	*/
	function isAllowedOperator( address operator_ ) public view returns ( bool ) {
		uint256 _index_ = blacklistRegistry.length;
		while ( _index_ > 0 ) {
			unchecked {
				_index_ --;
			}
			if ( blacklistRegistry[ _index_ ] == operator_ ) {
				return false;
			}
		}
		return true;
	}
}
