// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IERC173 } from "../../../contracts/interfaces/IERC173.sol";

import { IERC173Events } from "../../../contracts/mocks/events/IERC173Events.sol";
import { Mock_ERC173 } from "../../../contracts/mocks/utils/Mock_ERC173.sol";

contract Deployed is TestHelper, IERC173Events {
  Mock_ERC173 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC173();
  }
}

contract Unit_Owner is Deployed {
  function test_unit_erc173_owner_is_correct() public {
    assertEq(
      testContract.owner(),
      address(this),
      "invalid owner"
    );
  }
}

contract Unit_TransferOwnership is Deployed {
  function test_unit_erc173_cannot_transfer_ownership_when_not_owner() public {
    address operator = OPERATOR.addr;
    vm.prank(operator);
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC173.IERC173_NOT_OWNER.selector,
        operator
      )
    );
    testContract.transferOwnership(operator);
  }
  function test_unit_erc173_emit_transfer_ownership_when_owner() public {
    address newOwner = OPERATOR.addr;
    vm.expectEmit(address(testContract));
    emit OwnershipTransferred(address(this), newOwner);
    testContract.transferOwnership(newOwner);
    assertEq(
      testContract.owner(),
      newOwner,
      "invalid owner"
    );
  }
  function test_unit_erc173_renounce_ownership() public {
    address newOwner = OPERATOR.addr;
    vm.expectEmit(address(testContract));
    emit OwnershipTransferred(address(this), newOwner);
    testContract.transferOwnership(newOwner);
    assertEq(
      testContract.owner(),
      newOwner,
      "invalid owner"
    );
  }
}
