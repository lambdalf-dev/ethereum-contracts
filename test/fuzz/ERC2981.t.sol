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

contract Fuzz_RoyaltyInfo is Deployed {
  function test_fuzz_erc2981_royalty_info_is_accurate(uint256 price) public {
    uint256 tokenId = TARGET_TOKEN;
    price = bound(price, 100, 1e36); 
    address expectedRecipient = ROYALTY_RECIPIENT.addr;
    uint256 expectedAmount = price * ROYALTY_RATE / ROYALTY_BASE;
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

contract Fuzz_SetRoyalties is Deployed {
  function test_fuzz_erc2981_setting_royalties(uint96 newRate, uint256 price) public {
    address newRecipient = OPERATOR.addr;
    newRate = uint96(bound(newRate, 1, ROYALTY_BASE));
    uint256 tokenId = TARGET_TOKEN;
    price = bound(price, 100, 1e36); 
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
