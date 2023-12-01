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

contract Fuzz_CheckWhitelistAllowance is Deployed {
  function test_fuzz_whitelist_allowance_is_accurate_when_whitelist_allocation_has_been_partially_consumed(uint256 consumed) public {
    uint8 whitelistId = WHITELIST_ID;
    uint256 alloted = ALLOCATED;
    address account = ALICE.addr;
    address whitelistedAccount = ALICE.addr;
    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
    consumed = bound(consumed, 1, alloted);
    uint256 expectedAllocation = alloted - consumed;
    _consumeAllowance(account, whitelistId, consumed, alloted, proof);
    assertEq(
      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
      expectedAllocation,
      "invalid allowance"
    );
  }
}
