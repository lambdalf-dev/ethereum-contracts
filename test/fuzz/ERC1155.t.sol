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
// *****           PUBLIC           *****
// **************************************
  // ****************
  // * Mock_ERC1155 *
  // ****************
    contract Fuzz_Mint is Deployed {
      function test_fuzz_erc1155_mint_emit_TransferSingle_event(uint256 amount) public {
        address operator = OPERATOR.addr;
        uint256 id = SERIES_ID;
        vm.assume(amount > 0);
        _setupSeriesFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit TransferSingle(operator, address(0), operator, id, amount);
        testContract.mint(id, amount);
        assertEq(
          testContract.balanceOf(operator, id),
          amount,
          "invalid balance"
        );
        address[] memory accounts = new address[](1);
        accounts[0] = operator;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          amount,
          "invalid balance"
        );
      }
    }
    contract Fuzz_SetBaseUri is Deployed {
      function test_unit_emit_URI_event_when_setting_uri(string memory newBaseUri) public {
        // string memory newBaseUri = NEW_BASE_URI;
        vm.expectEmit(address(testContract));
        emit URI(newBaseUri, DEFAULT_SERIES);
        testContract.setBaseUri(newBaseUri);
        uint256 id = SERIES_ID;
        _setupSeriesFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.uri(id))),
          keccak256(abi.encodePacked(newBaseUri, Strings.toString(id))),
          "invalid uri"
        );
      }
    }
  // ****************

  // ************
  // * IERC1155 *
  // ************
    contract Fuzz_SafeBatchTransferFrom is Deployed {
      function test_fuzz_erc1155_emit_TransferBatch_event_when_caller_owns_tokens(uint256 amount) public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        amount = bound(amount, 1, ALICE_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit TransferBatch(operator, tokenOwner, recipient, ids, amounts);
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
        assertEq(
          testContract.balanceOf(tokenOwner, SERIES_ID),
          ALICE_SUPPLY - amount,
          "invalid balance"
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
        address[] memory accounts = new address[](2);
        accounts[0] = tokenOwner;
        accounts[1] = recipient;
        ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          ALICE_SUPPLY - amount,
          "invalid balance"
        );
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[1],
          amount,
          "invalid balance"
        );
      }
    }
    contract Fuzz_SafeTransferFrom is Deployed {
      function test_fuzz_erc1155_emit_TransferSingle_event_when_caller_owns_tokens(uint256 amount) public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        amount = bound(amount, 1, ALICE_SUPPLY);
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit TransferSingle(operator, tokenOwner, recipient, id, amount);
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
        assertEq(
          testContract.balanceOf(tokenOwner, SERIES_ID),
          ALICE_SUPPLY - amount,
          "invalid balance"
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
        address[] memory accounts = new address[](2);
        accounts[0] = tokenOwner;
        accounts[1] = recipient;
        uint256[] memory ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          ALICE_SUPPLY - amount,
          "invalid balance"
        );
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[1],
          amount,
          "invalid balance"
        );
      }
    }
  // ************
// **************************************
