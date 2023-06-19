// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

/**
* @dev A simple mock ProxyRegistry for use in local tests with minimal security
*/
/* solhint-disable */
contract Mock_ProxyRegistry {
  mapping(address => address) public proxies;

  /**
  * @notice Allow the owner to set a proxy for testing
  * @param address_ The address that the proxy will act on behalf of
  * @param proxyForAddress_ The proxy that will act on behalf of the address
  */
  function setProxy(address address_, address proxyForAddress_) external {
    proxies[address_] = proxyForAddress_;
  }
}
/* solhint-enable */
