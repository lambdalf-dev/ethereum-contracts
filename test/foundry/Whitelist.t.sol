// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_Whitelist} from "./utils/Behavior.Whitelist.sol";
import {Mock_Whitelist} from "../../contracts/mocks/utils/Mock_Whitelist.sol";
import {IWhitelist} from "../../contracts/interfaces/IWhitelist.sol";

contract Constants is Behavior_Whitelist {
  Wallet SIGNER = user17;
  Wallet FORGER = user16;
  address WHITELISTED = user15.publicKey;
  uint8 WHITELIST_ID = 2;
  uint256 ALLOCATED = 5;
  uint256 WHITELIST_CONSUMED = 1;
}

contract Deployed is Constants {
  Mock_Whitelist testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_Whitelist();
  }
  function whitelistSetFixture() internal {
    testContract.setWhitelist(SIGNER.publicKey);
  }
  function consumeAllowance(address account, uint8 whitelistId, uint256 consumed, uint256 alloted, IWhitelist.Proof memory proof) internal {
    testContract.consumeWhitelist(account, whitelistId, consumed, alloted, proof);
  }
}

contract CheckWhitelistAllowance is Deployed {
  function test_revert_when_whitelist_is_not_set(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    revertWhenWhitelistNotSet(
      address(testContract),
      abi.encodeWithSignature(
        "checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))",
        account,
        whitelistId,
        alloted,
        proof
      )
    );
  }
  function test_return_zero_when_checking_allowance_with_other_user_proof(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(account != WHITELISTED);
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, WHITELISTED, SIGNER);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      0,
      "invalid allowance"
    );
  }
  function test_return_zero_when_checking_allowance_with_forged_proof(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, FORGER);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      0,
      "invalid allowance"
    );
  }
  function test_return_zero_when_checking_allowance_for_different_whitelist_than_allocated(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(whitelistId != WHITELIST_ID);
    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      0,
      "invalid allowance"
    );
  }
  function test_return_zero_when_checking_allowance_for_more_than_allocated(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(alloted > ALLOCATED);
    IWhitelist.Proof memory proof = createProof(whitelistId, ALLOCATED, account, SIGNER);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      0,
      "invalid allowance"
    );
  }
  function test_allowance_is_accurate_when_whitelist_allocation_has_not_been_consumed(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      alloted,
      "invalid allowance"
    );
  }
  function test_allowance_is_accurate_when_whitelist_allocation_has_been_partially_consumed(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(alloted > WHITELIST_CONSUMED);
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    consumeAllowance(account, whitelistId, WHITELIST_CONSUMED, alloted, proof);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      alloted - WHITELIST_CONSUMED,
      "invalid allowance"
    );
  }
  function test_allowance_is_accurate_when_whitelist_allocation_has_been_fully_consumed(
    address account,
    uint8 whitelistId,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(alloted > WHITELIST_CONSUMED);
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    consumeAllowance(account, whitelistId, alloted, alloted, proof);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      0,
      "invalid allowance"
    );
  }
}

contract ConsumeWhitelist is Deployed {
  function test_revert_when_whitelist_is_not_set(
    address account,
    uint8 whitelistId,
    uint256 amount,
    uint256 alloted
  ) public {
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    revertWhenWhitelistNotSet(
      address(testContract),
      abi.encodeWithSignature(
        "consumeWhitelist(address,uint8,uint256,uint256,tuple(bytes32,bytes32,uint8))",
        account,
        whitelistId,
        amount,
        alloted,
        proof
      )
    );
  }
  function test_revert_when_not_whitelisted(
    address account,
    uint8 whitelistId,
    uint256 amount,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, FORGER);
    revertWhenNotWhitelisted(
      address(testContract),
      abi.encodeWithSignature(
        "consumeWhitelist(address,uint8,uint256,uint256,tuple(bytes32,bytes32,uint8))",
        account,
        whitelistId,
        amount,
        alloted,
        proof
      ),
      account
    );
  }
  function test_revert_when_consuming_more_than_allocated(
    address account,
    uint8 whitelistId,
    uint256 amount,
    uint256 alloted
  ) public {
    whitelistSetFixture();
    vm.assume(amount > alloted);
    IWhitelist.Proof memory proof = createProof(whitelistId, alloted, account, SIGNER);
    revertWhenNotWhitelisted(
      address(testContract),
      abi.encodeWithSignature(
        "consumeWhitelist(address,uint8,uint256,uint256,tuple(bytes32,bytes32,uint8))",
        account,
        whitelistId,
        amount,
        alloted,
        proof
      ),
      account
    );
  }
}
