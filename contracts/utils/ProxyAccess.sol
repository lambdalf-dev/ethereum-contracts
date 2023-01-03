// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

interface ProxyRegistry {
  function proxies(address tokenOwner_) external view returns (address);
}

abstract contract ProxyAccess {
  // Errors
  error ProxyAccess_ALREADY_REGISTERED();
  error ProxyAccess_NON_EXISTANT_PROXY();

  // list of accepted proxy registries
  address[] public proxyRegistries;

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Internal function that adds a proxy registry to the list of accepted proxy registries.
    * 
    * @param proxyRegistryAddress_ : the address of the new proxy registry
    */
    function _addProxyRegistry(address proxyRegistryAddress_) internal {
      uint256 _index_ = proxyRegistries.length;
      while (_index_ > 0) {
        unchecked {
          --_index_;
        }
        if (proxyRegistries[ _index_ ] == proxyRegistryAddress_) {
          revert ProxyAccess_ALREADY_REGISTERED();
        }
      }
      proxyRegistries.push(proxyRegistryAddress_);
    }
    /**
    * @dev Internal function that removes a proxy registry from the list of accepted proxy registries.
    * 
    * @param proxyRegistryAddress_ : the address of the proxy registry to remove
    */
    function _removeProxyRegistry(address proxyRegistryAddress_) internal {
      uint256 _len_ = proxyRegistries.length;
      uint256 _index_ = _len_;
      while (_index_ > 0) {
        unchecked {
          --_index_;
        }
        if (proxyRegistries[ _index_ ] == proxyRegistryAddress_) {
          if (_index_ + 1 != _len_) {
            proxyRegistries[ _index_ ] = proxyRegistries[ _len_ - 1 ];
          }
          proxyRegistries.pop();
          return;
        }
      }
      revert ProxyAccess_NON_EXISTANT_PROXY();
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /**
    * @notice Checks if `operator_` is a registered proxy for `tokenOwner_`.
    * 
    * Note: Use this function to allow whitelisting of registered proxy.
    * 
    * @param tokenOwner_ : the address the proxy operates on the behalf of
    * @param operator_   : the proxy address that operates on behalf of the token owner
    * 
    * @return bool : whether `operator_` is allowed to operate on behalf of `tokenOwner_` or not
    */
    function isRegisteredProxy(address tokenOwner_, address operator_) public view returns (bool) {
      uint256 _index_ = proxyRegistries.length;
      while (_index_ > 0) {
        unchecked {
          --_index_;
        }
        ProxyRegistry _proxyRegistry_ = ProxyRegistry(proxyRegistries[ _index_ ]);
        if (address(_proxyRegistry_.proxies(tokenOwner_)) == operator_) {
          return true;
        }
      }
      return false;
    }
  // **************************************
}
