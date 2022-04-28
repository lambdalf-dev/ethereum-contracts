// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

contract OwnableDelegateProxy {}

contract ProxyRegistry {
	mapping( address => OwnableDelegateProxy ) public proxies;
}

abstract contract ITradable {
	// OpenSea proxy registry address
	address[] internal _proxyRegistries;

	function _addProxyRegistry( address proxyRegistryAddress_ ) internal {
		_proxyRegistries.push( proxyRegistryAddress_ );
	}

	/**
	* @dev Checks if `operator_` is the registered proxy for `tokenOwner_`.
	* 
	* Note: Use this function to allow whitelisting of registered proxy.
	*/
	function _isRegisteredProxy( address tokenOwner_, address operator_ ) internal view returns ( bool ) {
		for ( uint256 i; i < _proxyRegistries.length; i++ ) {
			ProxyRegistry _proxyRegistry_ = ProxyRegistry( _proxyRegistries[ i ] );
			if ( address( _proxyRegistry_.proxies( tokenOwner_ ) ) == operator_ ) {
				return true;
			}
		}
		return false;
	}
}