// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IERC2981} from "../../../contracts/interfaces/IERC2981.sol";

contract Behavior_ERC2981 is TestHelper {
  // REVERTS
  function revertWhenInvalidRoyalties(address callee, bytes memory signature) internal {
    vm.expectRevert(IERC2981.IERC2981_INVALID_ROYALTIES.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidRoyalties(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(IERC2981.IERC2981_INVALID_ROYALTIES.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}
