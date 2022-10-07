// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/ProxyAccess.sol";

contract Mock_ProxyAccess is ProxyAccess {
	constructor() {}

	function isRegisteredProxy( address tokenOwner_, address operator_ ) public view returns ( bool ) {
		return _isRegisteredProxy( tokenOwner_, operator_ );
	}

	function addProxyRegistry( address proxyRegistryAddress_ ) public {
		_addProxyRegistry( proxyRegistryAddress_ );
	}

	function removeProxyRegistry( address proxyRegistryAddress_ ) public {
		_removeProxyRegistry( proxyRegistryAddress_ );
	}
}