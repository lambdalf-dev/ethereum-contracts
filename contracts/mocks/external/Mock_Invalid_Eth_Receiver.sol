// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/* solhint-disable */
contract Mock_Invalid_Eth_Receiver {
  constructor () {}

  receive() external payable {
    require( msg.value == 0, "STOP" );
  }
}
/* solhint-enable */
