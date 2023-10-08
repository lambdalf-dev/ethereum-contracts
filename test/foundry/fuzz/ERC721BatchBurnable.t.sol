// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IERC721Receiver } from "../../../contracts/interfaces/IERC721Receiver.sol";
import { IERC2309 } from "../../../contracts/interfaces/IERC2309.sol";
import { IERC721 } from "../../../contracts/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../contracts/interfaces/IERC721Enumerable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC721Events } from "../../../test/mocks/events/IERC721Events.sol";
import { Mock_NonERC721Receiver } from "../../../test/mocks/external/Mock_NonERC721Receiver.sol";
import { Mock_ERC721Receiver } from "../../../test/mocks/external/Mock_ERC721Receiver.sol";
import { Mock_ERC721BatchBurnable } from "../../../test/mocks/tokens/Mock_ERC721BatchBurnable.sol";

contract Deployed is TestHelper, IERC721Events, IERC2309 {
  Mock_ERC721BatchBurnable testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC721BatchBurnable();
  }
  function _mintFixture() internal {
    vm.prank(ALICE.addr);
    testContract.mint(ALICE_INIT_SUPPLY);
    vm.prank(BOB.addr);
    testContract.mint(BOB_SUPPLY);
    vm.prank(ALICE.addr);
    testContract.mint(ALICE_MORE_SUPPLY);
  }
  function _approveFixture(address account) internal {
    _mintFixture();
    vm.prank(ALICE.addr);
    testContract.approve(account, TARGET_TOKEN);
  }
  function _approveAllFixture(address account) internal {
    _mintFixture();
    vm.prank(ALICE.addr);
    testContract.setApprovalForAll(account, true);
  }
  function _burnFixture() internal {
    _mintFixture();
    vm.prank(ALICE.addr);
    testContract.burn(TARGET_TOKEN);
  }
}

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ********************
  // * Mock_ERC721Batch *
  // ********************
    contract Fuzz_Mint is Deployed {
      function test_fuzz_erc721BatchBurnable_emit_Transfer_event_when_minting_via_mint(uint256 amount) public {
        address operator = ALICE.addr;
        amount = bound(amount, 1, 4147);
        vm.prank(operator);
        for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount; ++i) {
          vm.expectEmit(address(testContract));
          emit Transfer(address(0), operator, i);
        }
        testContract.mint(amount);
        assertEq(
          testContract.balanceOf(operator),
          amount,
          "invalid balance"
        );
        assertEq(
          testContract.totalSupply(),
          amount,
          "invalid supply"
        );
      }
    }
    contract Fuzz_Mint2309 is Deployed {
      function test_fuzz_erc721BatchBurnable_emit_ConsecutiveTransfer_event_when_minting_via_mint2309(uint256 amount) public {
        address operator = ALICE.addr;
        amount = bound(amount, 1, 11515);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ConsecutiveTransfer(FIRST_TOKEN, FIRST_TOKEN + amount - 1, address(0), operator);
        testContract.mint2309(amount);
        assertEq(
          testContract.balanceOf(operator),
          amount,
          "invalid balance"
        );
        assertEq(
          testContract.totalSupply(),
          amount,
          "invalid supply"
        );
      }
    }
  // ********************
// **************************************

// **************************************
// *****            VIEW            *****
// **************************************
  // ***********
  // * IERC721 *
  // ***********
    contract Fuzz_OwnerOf is Deployed {
      function test_fuzz_erc721BatchBurnable_ownership_of_existing_tokens_is_accurate(uint256 tokenId) public {
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        _mintFixture();
        if (tokenId == BOB_TOKEN) {
          assertEq(
            testContract.ownerOf(tokenId),
            BOB.addr,
            "invalid owner"
          );
        }
        else {
          assertEq(
            testContract.ownerOf(tokenId),
            ALICE.addr,
            "invalid owner"
          );
        }
      }
    }
  // ***********

  // *********************
  // * IERC721Enumerable *
  // *********************
    contract Fuzz_TokenByIndex is Deployed {
      function test_fuzz_erc721BatchBurnable_token_by_index_is_accurate(uint256 index) public {
        _mintFixture();
        vm.assume(index < MINTED_SUPPLY);
        assertEq(
          testContract.tokenByIndex(index),
          index + FIRST_TOKEN,
          "invalid index"
        );
      }
    }
    contract Fuzz_TokenOfOwnerByIndex is Deployed {
      function test_fuzz_erc721BatchBurnable_token_of_owner_by_index_is_accurate(uint256 index) public {
        _mintFixture();
        vm.assume(index < MINTED_SUPPLY - BOB_SUPPLY);
        if (index < ALICE_INIT_SUPPLY) {
          assertEq(
            testContract.tokenOfOwnerByIndex(ALICE.addr, index),
            index + FIRST_TOKEN,
            "invalid token id"
          );
        }
        else {
          assertEq(
            testContract.tokenOfOwnerByIndex(ALICE.addr, index),
            index + FIRST_TOKEN + BOB_SUPPLY,
            "invalid token id"
          );
        }
      }
    }
  // *********************

  // *******************
  // * IERC721Metadata *
  // *******************
    contract Fuzz_TokenURI is Deployed {
      function test_fuzz_erc721BatchBurnable_token_uri_is_accurate(uint256 tokenId) public {
        _mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
    }
  // *******************
// **************************************
