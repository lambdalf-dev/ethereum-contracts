// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IERC173} from "../../../contracts/interfaces/IERC173.sol";

contract Behavior_ERC173 is TestHelper {
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
  // EVENTS
  function emitOwnershipTransferredEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address previousOwner,
    address newOwner
  ) internal {
    vm.expectEmit(emitter);
    emit OwnershipTransferred(previousOwner, newOwner);
    (bool success,) = callee.call(signature);
  }
  function emitOwnershipTransferredEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address previousOwner,
    address newOwner,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit OwnershipTransferred(previousOwner, newOwner);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  // REVERTS
  function revertWhenCallerNotContractOwner(address callee, bytes memory signature, address operator) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC173.IERC173_NOT_OWNER.selector,
        operator
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenCallerNotContractOwner(address callee, bytes memory signature, address operator, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC173.IERC173_NOT_OWNER.selector,
        operator
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}

