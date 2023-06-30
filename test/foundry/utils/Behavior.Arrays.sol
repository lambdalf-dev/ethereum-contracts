// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IArrays} from "../../../contracts/interfaces/IArrays.sol";

contract Behavior_Arrays is TestHelper {
  // REVERTS
  function revertWhenArrayLengthsDontMatch(address callee, bytes memory signature) internal {
    vm.expectRevert(abi.encodeWithSelector(IArrays.ARRAY_LENGTH_MISMATCH.selector));
    (bool success,) = callee.call(signature);
  }
  function revertWhenArrayLengthsDontMatch(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(abi.encodeWithSelector(IArrays.ARRAY_LENGTH_MISMATCH.selector));
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}

