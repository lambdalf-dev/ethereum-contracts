// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../test/utils/TestHelper.sol";
import { IERC721Receiver } from "../../src/interfaces/IERC721Receiver.sol";
import { IERC2309 } from "../../src/interfaces/IERC2309.sol";
import { IERC721 } from "../../src/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../src/interfaces/IERC721Enumerable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC721Events } from "../../src/mocks/events/IERC721Events.sol";
import { Mock_NonERC721Receiver } from "../../src/mocks/external/Mock_NonERC721Receiver.sol";
import { Mock_ERC721Receiver } from "../../src/mocks/external/Mock_ERC721Receiver.sol";
import { Mock_ERC721Batch } from "../../src/mocks/tokens/Mock_ERC721Batch.sol";

contract Deployed is TestHelper, IERC721Events, IERC2309 {
  Mock_ERC721Batch testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC721Batch();
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
}

// **************************************
// *****            VIEW            *****
// **************************************
  // *********************
  // * IERC721Enumerable *
  // *********************
    contract Edge_TokenByIndex is Deployed {
      function test_edge_erc721Batch_revert_when_requesting_token_at_non_existant_index() public {
        uint256 index = MINTED_SUPPLY + 1;
        _mintFixture();
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721Enumerable.IERC721Enumerable_INDEX_OUT_OF_BOUNDS.selector,
            index
          )
        );
        testContract.tokenByIndex(index);
      }
    }
  // *********************

  // *******************
  // * IERC721Metadata *
  // *******************
    contract Edge_TokenURI is Deployed {
      function test_edge_erc721Batch_token_uri_is_accurate_when_no_base_uri() public {
        uint256 tokenId = TARGET_TOKEN;
        testContract.setBaseUri("");
        _mintFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(Strings.toString(tokenId))),
          "invalid uri"
        );
      }
    }
  // *******************
// **************************************
