// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IWhitelist } from "../../../contracts/interfaces/IWhitelist.sol";

import { Mock_Whitelist } from "../../../contracts/mocks/utils/Mock_Whitelist.sol";

contract Deployed is TestHelper {
  Mock_Whitelist testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_Whitelist();
  }
  function _whitelistSetFixture() internal {
    testContract.setWhitelist(SIGNER.addr);
  }
  function _consumeAllowance(address account, uint8 whitelistId, uint256 consumed, uint256 alloted, IWhitelist.Proof memory proof) internal {
    _whitelistSetFixture();
    testContract.consumeWhitelist(account, whitelistId, consumed, alloted, proof);
  }
  function _createProof(uint8 whitelistId, uint256 allotted, address account, Account memory signer) internal pure returns(IWhitelist.Proof memory proof) {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      uint256(signer.key),
      keccak256(abi.encode(whitelistId, allotted, account))
    );
    return IWhitelist.Proof(r, s, v);
  }
}

contract Unit_CheckWhitelistAllowance is Deployed {
  function test_unit_whitelist_revert_when_whitelist_is_not_set() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    vm.expectRevert(IWhitelist.WHITELIST_NOT_SET.selector);
    testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof);
  }
  function test_unit_whitelist_return_zero_when_checking_allowance_with_other_user_proof() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = OPERATOR.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = 0;
    _whitelistSetFixture();
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_return_zero_when_checking_allowance_with_forged_proof() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, FORGER);
    uint256 expectedAllocation = 0;
    _whitelistSetFixture();
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_return_zero_when_checking_allowance_for_different_whitelist_than_allocated() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = 0;
    _whitelistSetFixture();
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId + 1, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_return_zero_when_checking_allowance_for_more_than_allocated() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = 0;
    _whitelistSetFixture();
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted + 1, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_allowance_is_accurate_when_whitelist_allocation_has_not_been_consumed() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = alloted;
    _whitelistSetFixture();
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_allowance_is_accurate_when_whitelist_allocation_has_been_partially_consumed() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = alloted - WHITELIST_CONSUMED;
    _consumeAllowance(account, whitelistId, WHITELIST_CONSUMED, alloted, proof);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
  function test_unit_whitelist_allowance_is_accurate_when_whitelist_allocation_has_been_fully_consumed() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    uint256 expectedAllocation = 0;
    _consumeAllowance(account, whitelistId, alloted, alloted, proof);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
}

contract Unit_ConsumeWhitelist is Deployed {
  function test_unit_whitelist_revert_when_whitelist_is_not_set() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    uint256 amount = WHITELIST_CONSUMED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    vm.expectRevert(IWhitelist.WHITELIST_NOT_SET.selector);
    testContract.consumeWhitelist(account, whitelistId, amount, alloted, proof);
  }
  function test_unit_whitelist_revert_when_not_whitelisted() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    uint256 amount = WHITELIST_CONSUMED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, FORGER);
    _whitelistSetFixture();
    vm.expectRevert(
      abi.encodeWithSelector(
        IWhitelist.WHITELIST_FORBIDDEN.selector,
        account
      )
    );
    testContract.consumeWhitelist(account, whitelistId, amount, alloted, proof);
  }
  function test_unit_whitelist_revert_when_consuming_more_than_allocated() public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    uint256 amount = alloted + WHITELIST_CONSUMED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    _whitelistSetFixture();
    vm.expectRevert(
      abi.encodeWithSelector(
        IWhitelist.WHITELIST_FORBIDDEN.selector,
        account
      )
    );
    testContract.consumeWhitelist(account, whitelistId, amount, alloted, proof);
  }
}
