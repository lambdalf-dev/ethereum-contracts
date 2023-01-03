// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

/* solhint-disable */
abstract contract WithdrawableContract {
  function withdraw() external virtual;
}

contract Mock_Invalid_Eth_Receiver {
  WithdrawableContract _contract;

  constructor(address contract_) {
    _contract = WithdrawableContract(contract_);
  }

  function withdraw() external {
    _contract.withdraw();
  }

  fallback() external {}

  receive() external payable {
    require(msg.value == 0, "STOP");
  }
}
/* solhint-enable */
