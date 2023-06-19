// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { ProxyAccess } from "../../utils/ProxyAccess.sol";

/* solhint-disable */
contract Mock_ProxyAccess is ProxyAccess {
  constructor() {}

  function addProxyRegistry(address proxyRegistryAddress_) public {
    _addProxyRegistry(proxyRegistryAddress_);
  }
  function removeProxyRegistry(address proxyRegistryAddress_) public {
    _removeProxyRegistry(proxyRegistryAddress_);
  }
}
/* solhint-enable */
