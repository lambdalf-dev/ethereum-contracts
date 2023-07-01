// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_ERC2981} from "./utils/Behavior.ERC2981.sol";
import {Mock_ERC2981} from "../../contracts/mocks/utils/Mock_ERC2981.sol";
import {IERC2981} from "../../contracts/interfaces/IERC2981.sol";

contract Constants is Behavior_ERC2981 {
  uint96 ROYALTY_BASE = 10_000;
  uint96 ROYALTY_RATE = 100;
  address ROYALTY_RECIPIENT = user19.publicKey;
}

contract Deployed is Constants {
  Mock_ERC2981 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC2981(ROYALTY_RECIPIENT, ROYALTY_RATE);
  }
}

contract ContractConstants is Deployed {
  function test_erc2981_royalty_base_is_correct() public {
    assertEq(
      testContract.ROYALTY_BASE(),
      ROYALTY_BASE,
      "invalid royalty base"
    );
  }
}

contract RoyaltyInfo is Deployed {
  function test_erc2981_no_royalties_when_price_is_zero(uint256 tokenId) public {
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, 0);
    assertEq(
      recipient,
      address(0),
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      0,
      "invalid royalty amount"
    );
  }
  function test_erc2981_royalty_info_is_accurate(uint256 tokenId, uint256 price) public {
    price = bound(price, 100, 1e36); 
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
    assertEq(
      recipient,
      ROYALTY_RECIPIENT,
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      price * ROYALTY_RATE / ROYALTY_BASE,
      "invalid royalty amount"
    );
  }
}

contract SetRoyalties is Deployed {
  function test_erc2981_revert_when_new_royalty_rate_is_higher_than_royalty_base(uint96 newRate) public {
    vm.assume(newRate > ROYALTY_BASE);
    revertWhenInvalidRoyalties(
      address(testContract),
      abi.encodeWithSignature(
        "setRoyaltyInfo(address,uint96)",
        user1.publicKey,
        newRate
      )
    );
  }
  function test_erc2981_setting_royalties(address newRecipient, uint96 newRate, uint256 tokenId, uint256 price) public {
    vm.assume(newRate > 0);
    vm.assume(newRate <= ROYALTY_BASE);
    vm.assume(newRecipient != address(0));
    testContract.setRoyaltyInfo(newRecipient, newRate);
    price = bound(price, 100, 1e36); 
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
    assertEq(
      recipient,
      newRecipient,
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      price * newRate / ROYALTY_BASE,
      "invalid royalty amount"
    );
  }
  function test_erc2981_removing_royalty_recipient(uint96 newRate, uint256 tokenId, uint256 price) public {
    vm.assume(newRate > 0);
    vm.assume(newRate <= ROYALTY_BASE);
    testContract.setRoyaltyInfo(address(0), newRate);
    price = bound(price, 100, 1e36); 
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
    assertEq(
      recipient,
      address(0),
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      0,
      "invalid royalty amount"
    );
  }
  function test_erc2981_removing_royalty_rate(address newRecipient, uint256 tokenId, uint256 price) public {
    vm.assume(newRecipient != address(0));
    testContract.setRoyaltyInfo(address(0), 0);
    price = bound(price, 100, 1e36); 
    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
    assertEq(
      recipient,
      address(0),
      "invalid royalty recipient"
    );
    assertEq(
      royaltyAmount,
      0,
      "invalid royalty amount"
    );
  }
}
