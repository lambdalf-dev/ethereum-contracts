// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../test/utils/TestHelper.sol";

import { Mock_ERC2981 } from "../../src/mocks/utils/Mock_ERC2981.sol";

contract Deployed is TestHelper {
  Mock_ERC2981 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC2981(ROYALTY_RECIPIENT.addr, ROYALTY_RATE);
  }
}

contract Edge_SetRoyalties is Deployed {
  function test_edge_erc2981_success_when_new_royalty_rate_equals_royalty_base() public {
    address newRecipient = OPERATOR.addr;
    uint96 newRate = ROYALTY_BASE;
    uint256 tokenId = TARGET_TOKEN;
    uint256 price = PRIVATE_SALE_PRICE;
    address expectedRecipient = newRecipient;
    uint256 expectedAmount = price * newRate / ROYALTY_BASE;
    testContract.setRoyaltyInfo(newRecipient, newRate);
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
    assertEq(
      recipient,
      expectedRecipient,
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      expectedAmount,
      "invalid royalty amount"
    );
  }
}
