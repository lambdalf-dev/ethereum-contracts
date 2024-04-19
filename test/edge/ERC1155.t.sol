// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../test/utils/TestHelper.sol";
import { IArrays } from "../../src/interfaces/IArrays.sol";
import { IERC1155 } from "../../src/interfaces/IERC1155.sol";
import { IERC1155Receiver } from "../../src/interfaces/IERC1155Receiver.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC1155Events } from "../../src/mocks/events/IERC1155Events.sol";
import { Mock_NonERC1155Receiver } from "../../src/mocks/external/Mock_NonERC1155Receiver.sol";
import { Mock_ERC1155Receiver } from "../../src/mocks/external/Mock_ERC1155Receiver.sol";
import { Mock_ERC1155 } from "../../src/mocks/tokens/Mock_ERC1155.sol";

contract Deployed is TestHelper, IERC1155Events {
  Mock_ERC1155 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC1155();
  }
  function _setupSeriesFixture() internal {
    testContract.createSeries(SERIES_ID);
  }
  function _mintFixture() internal {
    _setupSeriesFixture();
    vm.prank(ALICE.addr);
    testContract.mint(SERIES_ID, ALICE_INIT_SUPPLY);
    vm.prank(BOB.addr);
    testContract.mint(SERIES_ID, BOB_SUPPLY);
    vm.prank(ALICE.addr);
    testContract.mint(SERIES_ID, ALICE_MORE_SUPPLY);
  }
  function _approveOperatorFixture(address operator) internal {
    _mintFixture();
    vm.prank(ALICE.addr);
    testContract.setApprovalForAll(operator, true);
  }
}

// **************************************
// *****            VIEW            *****
// **************************************
  // ***********************
  // * IERC1155MetaDATAURI *
  // ***********************
    contract Edge_Uri is Deployed {
      function test_edge_uri_is_accurate_when_no_base_uri() public {
        uint256 id = SERIES_ID;
        testContract.setBaseUri("");
        _setupSeriesFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.uri(id))),
          keccak256(abi.encodePacked(Strings.toString(id))),
          "invalid uri"
        );
      }
    }
  // ***********************
// **************************************
