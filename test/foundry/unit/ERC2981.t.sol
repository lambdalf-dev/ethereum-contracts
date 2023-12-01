// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IERC2981 } from "../../../contracts/interfaces/IERC2981.sol";

import { Mock_ERC2981 } from "../../../contracts/mocks/utils/Mock_ERC2981.sol";

contract Deployed is TestHelper {
  Mock_ERC2981 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC2981(ROYALTY_RECIPIENT.addr, ROYALTY_RATE);
  }
}

contract Unit_ContractConstants is Deployed {
  function test_unit_erc2981_royalty_base_is_correct() public {
    assertEq(
      testContract.ROYALTY_BASE(),
      ROYALTY_BASE,
      "invalid royalty base"
    );
  }
}

contract Unit_RoyaltyInfo is Deployed {
  function test_unit_erc2981_no_royalties_when_price_is_zero() public {
    uint256 tokenId = TARGET_TOKEN;
    uint256 price = 0;
    address expectedRecipient = address(0);
    uint256 expectedAmount = 0;
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
  function test_unit_erc2981_royalty_info_is_accurate() public {
    uint256 tokenId = TARGET_TOKEN;
    uint256 price = PRIVATE_SALE_PRICE;
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

contract Unit_SetRoyalties is Deployed {
  function test_unit_erc2981_revert_when_new_royalty_rate_is_higher_than_royalty_base() public {
    address newRecipient = OPERATOR.addr;
    uint96 newRate = ROYALTY_BASE + 1;
    vm.expectRevert(IERC2981.IERC2981_INVALID_ROYALTIES.selector);
    testContract.setRoyaltyInfo(newRecipient, newRate);
  }
  function test_unit_erc2981_setting_royalties() public {
    address newRecipient = OPERATOR.addr;
    uint96 newRate = ROYALTY_RATE / 2;
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
  function test_unit_erc2981_removing_royalty_recipient() public {
    address newRecipient = address(0);
    uint96 newRate = ROYALTY_RATE / 2;
    uint256 tokenId = TARGET_TOKEN;
    uint256 price = PRIVATE_SALE_PRICE;
    address expectedRecipient = address(0);
    uint256 expectedAmount = 0;
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
  function test_unit_erc2981_removing_royalty_rate() public {
    address newRecipient = OPERATOR.addr;
    uint96 newRate = 0;
    uint256 tokenId = TARGET_TOKEN;
    uint256 price = PRIVATE_SALE_PRICE;
    address expectedRecipient = address(0);
    uint256 expectedAmount = 0;
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
