// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_ERC173} from "./utils/Behavior.ERC173.sol";
import {Mock_ERC173} from "../../contracts/mocks/utils/Mock_ERC173.sol";
import {IERC173} from "../../contracts/interfaces/IERC173.sol";

contract Deployed is Behavior_ERC173 {
  Mock_ERC173 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC173();
  }
}

contract Owner is Deployed {
  function test_owner_is_correct() public {
    assertEq(
      testContract.owner(),
      address(this),
      "invalid owner"
    );
  }
}

contract TransferOwnership is Deployed {
  function test_cannot_transfer_ownership_when_not_owner(address operator) public {
    vm.assume(operator != address(this));
    vm.prank(operator);
    revertWhenCallerNotContractOwner(
      address(testContract),
      abi.encodeWithSignature(
        "transferOwnership(address)",
        operator
      ),
      operator
    );
  }
  function test_emit_transfer_ownership_when_owner(address newOwner) public {
    vm.assume(newOwner != address(this));
    emitOwnershipTransferredEvent(
      address(testContract),
      abi.encodeWithSignature(
        "transferOwnership(address)",
        newOwner
      ),
      address(testContract),
      address(this),
      newOwner
    );
    assertEq(
      testContract.owner(),
      newOwner,
      "invalid owner"
    );
  }
  function test_renounce_ownership() public {
    emitOwnershipTransferredEvent(
      address(testContract),
      abi.encodeWithSignature(
        "transferOwnership(address)",
        address(0)
      ),
      address(testContract),
      address(this),
      address(0)
    );
    assertEq(
      testContract.owner(),
      address(0),
      "invalid owner"
    );
  }
}
