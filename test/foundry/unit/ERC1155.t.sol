// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IArrays } from "../../../contracts/interfaces/IArrays.sol";
import { IERC1155 } from "../../../contracts/interfaces/IERC1155.sol";
import { IERC1155Receiver } from "../../../contracts/interfaces/IERC1155Receiver.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC1155Events } from "../../../test/mocks/events/IERC1155Events.sol";
import { Mock_NonERC1155Receiver } from "../../../test/mocks/external/Mock_NonERC1155Receiver.sol";
import { Mock_ERC1155Receiver } from "../../../test/mocks/external/Mock_ERC1155Receiver.sol";
import { Mock_ERC1155 } from "../../../test/mocks/tokens/Mock_ERC1155.sol";

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
    contract Unit_Mint is Deployed {
      function test_unit_mint_revert_when_series_dont_exist() public {
        address operator = OPERATOR.addr;
        uint256 id = SERIES_ID;
        uint256 amount = TARGET_AMOUNT;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.mint(id, amount);
      }
      function test_unit_mint_emit_TransferSingle_event() public {
        address operator = OPERATOR.addr;
        uint256 id = SERIES_ID;
        uint256 amount = TARGET_AMOUNT;
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
    contract Unit_CreateSeries is Deployed {
      function test_unit_create_series_revert_when_series_exist() public {
        uint256 id = SERIES_ID;
        _setupSeriesFixture();
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.createSeries(id);
      }
      function test_unit_create_series_successfully() public {
        uint256 id = SERIES_ID;
        testContract.createSeries(id);
        assertTrue(testContract.exists(id), "invalid series");
      }
    }
    contract Unit_SetBaseUri is Deployed {
      function test_unit_emit_URI_event_when_setting_uri() public {
        string memory newBaseUri = NEW_BASE_URI;
        vm.expectEmit(address(testContract));
        emit URI(newBaseUri, DEFAULT_SERIES);
        testContract.setBaseUri(newBaseUri);
      }
    }
  // ****************

  // ************
  // * IERC1155 *
  // ************
    contract Unit_SafeBatchTransferFrom is Deployed {
      function test_unit_safe_batch_transfer_revert_when_series_dont_exist() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_from_address_with_insufficient_balance() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _setupSeriesFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INSUFFICIENT_BALANCE.selector,
            operator,
            id
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_array_lengths_dont_match() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount;
        amounts[1] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(IArrays.ARRAY_LENGTH_MISMATCH.selector));
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_address_zero() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(0);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_caller_not_owner_or_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_CALLER_NOT_APPROVED.selector,
            ALICE.addr,
            operator
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_non_erc1155_receiver_contract() public {
        Mock_NonERC1155Receiver receivingContract = new Mock_NonERC1155Receiver();
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_returns_unexpected_value() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          RETVAL,
          Mock_ERC1155Receiver.Error.None
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_custom_error() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155BatchReceived.selector,
          Mock_ERC1155Receiver.Error.RevertWithError
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(Mock_ERC1155Receiver.ERC1155ReceiverError.selector);
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_message() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155BatchReceived.selector,
          Mock_ERC1155Receiver.Error.RevertWithMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert("Mock_ERC1155Receiver: reverting");
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_without_message() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155BatchReceived.selector,
          Mock_ERC1155Receiver.Error.RevertWithoutMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert();
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_panics() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155BatchReceived.selector,
          Mock_ERC1155Receiver.Error.Panic
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
        testContract.safeBatchTransferFrom(tokenOwner, recipient, ids, amounts, DATA);
      }
      function test_unit_emit_TransferBatch_event_when_caller_owns_tokens() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
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
      function test_unit_emit_TransferBatch_event_when_caller_is_approved_by_token_owner() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        _approveOperatorFixture(operator);
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
    contract Unit_SafeTransferFrom is Deployed {
      function test_unit_safe_transfer_revert_when_series_dont_exist() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_from_address_with_insufficient_balance() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        _setupSeriesFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INSUFFICIENT_BALANCE.selector,
            operator,
            id
          )
        );
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_address_zero() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(0);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_caller_not_owner_or_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_CALLER_NOT_APPROVED.selector,
            tokenOwner,
            operator
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_non_erc1155_receiver_contract() public {
        Mock_NonERC1155Receiver receivingContract = new Mock_NonERC1155Receiver();
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_returns_unexpected_value() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          RETVAL,
          Mock_ERC1155Receiver.Error.None
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_custom_error() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155Received.selector,
          Mock_ERC1155Receiver.Error.RevertWithError
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(Mock_ERC1155Receiver.ERC1155ReceiverError.selector);
        testContract.safeTransferFrom(ALICE.addr, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_message() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155Received.selector,
          Mock_ERC1155Receiver.Error.RevertWithMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert("Mock_ERC1155Receiver: reverting");
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_without_message() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155Received.selector,
          Mock_ERC1155Receiver.Error.RevertWithoutMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert();
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_panics() public {
        Mock_ERC1155Receiver receivingContract = new Mock_ERC1155Receiver(
          IERC1155Receiver.onERC1155Received.selector,
          Mock_ERC1155Receiver.Error.Panic
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = address(receivingContract);
        uint256 amount = TARGET_AMOUNT;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
        testContract.safeTransferFrom(operator, recipient, id, amount, DATA);
      }
      function test_unit_emit_TransferSingle_event_when_caller_owns_tokens() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
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
      function test_unit_emit_TransferSingle_event_when_caller_is_approved_by_token_owner() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address recipient = RECIPIENT.addr;
        uint256 amount = TARGET_AMOUNT;
        _approveOperatorFixture(operator);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit TransferSingle(operator, tokenOwner, recipient, id, amount);
        testContract.safeTransferFrom(tokenOwner, recipient, id, amount, DATA);
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
    contract Unit_SetApprovalForAll is Deployed {
      function test_unit_revert_when_approving_self() public {
        address operator = ALICE.addr;
        address approvedAccount = ALICE.addr;
        bool approval = true;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(IERC1155.IERC1155_INVALID_APPROVAL.selector);
        testContract.setApprovalForAll(approvedAccount, approval);
        assertFalse(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
      function test_unit_emit_ApprovalForAll_when_approving_other() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        bool approval = true;
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ApprovalForAll(operator, approvedAccount, approval);
        testContract.setApprovalForAll(approvedAccount, approval);
        assertTrue(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
      function test_unit_emit_ApprovalForAll_when_disproving_other() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        bool approval = false;
        _approveOperatorFixture(approvedAccount);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ApprovalForAll(operator, approvedAccount, approval);
        testContract.setApprovalForAll(approvedAccount, approval);
        assertFalse(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
    }
  // ************
// **************************************

// **************************************
// *****            VIEW            *****
// **************************************
  // ***********
  // * ERC1155 *
  // ***********
    contract Unit_DefaultSeries is Deployed {
      function test_unit_default_series_is_accurate() public {
        assertEq(
          testContract.DEFAULT_SERIES(),
          DEFAULT_SERIES,
          "invalid series id"
        );
      }
    }
    contract Unit_Exists is Deployed {
      function test_unit_series_not_created_dont_exist() public {
        uint256 id = SERIES_ID;
        assertFalse(
          testContract.exists(id),
          "invalid existence"
        );
      }
      function test_unit_created_series_exist() public {
        uint256 id = SERIES_ID;
        _setupSeriesFixture();
        assertTrue(
          testContract.exists(SERIES_ID),
          "invalid existence"
        );
      }
    }
  // ***********

  // ************
  // * IERC1155 *
  // ************
    contract Unit_BalanceOf is Deployed {
      function test_unit_revert_when_series_dont_exist() public {
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.balanceOf(tokenOwner, id);
      }
      function test_unit_balance_of_non_token_owner_is_zero() public {
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        _setupSeriesFixture();
        assertEq(
          testContract.balanceOf(tokenOwner, id),
          0,
          "invalide balance"
        );
      }
      function test_unit_balance_of_token_owners_is_accurate() public {
        address tokenOwner = ALICE.addr;
        address otherOwner = BOB.addr;
        uint256 id = SERIES_ID;
        _mintFixture();
        assertEq(
          testContract.balanceOf(tokenOwner, id),
          ALICE_SUPPLY,
          "invalid ALICE balance"
        );
        assertEq(
          testContract.balanceOf(otherOwner, id),
          BOB_SUPPLY,
          "invalid BOB balance"
        );
      }
    }
    contract Unit_BalanceOfBatch is Deployed {
      function test_unit_balance_of_batch_revert_when_batch_includes_invalid_series_id() public {
        address tokenOwner = ALICE.addr;
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](1);
        accounts[0] = tokenOwner;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.balanceOfBatch(accounts, ids);
      }
      function test_unit_balance_of_batch_revert_when_array_lengths_dont_match() public {
        address tokenOwner = ALICE.addr;
        address otherOwner = BOB.addr;
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](2);
        accounts[0] = tokenOwner;
        accounts[1] = otherOwner;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        _setupSeriesFixture();
        vm.expectRevert(abi.encodeWithSelector(IArrays.ARRAY_LENGTH_MISMATCH.selector));
        testContract.balanceOfBatch(accounts, ids);
      }
      function test_unit_balance_of_batch_of_non_token_owner_is_zero() public {
        address tokenOwner = OPERATOR.addr;
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](1);
        accounts[0] = tokenOwner;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        _setupSeriesFixture();
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          0,
          "invalide balance"
        );
      }
      function test_unit_balance_of_batch_of_token_owners_is_accurate() public {
        address tokenOwner = ALICE.addr;
        address otherOwner = BOB.addr;
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](2);
        accounts[0] = tokenOwner;
        accounts[1] = otherOwner;
        uint256[] memory ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        _mintFixture();
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          ALICE_SUPPLY,
          "invalid ALICE balance"
        );
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[1],
          BOB_SUPPLY,
          "invalid BOB balance"
        );
      }
    }
    contract Unit_IsApprovedForAll is Deployed {
      function test_unit_approval_for_all_status_is_false_by_default() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        assertFalse(
          testContract.isApprovedForAll(tokenOwner, operator),
          "invalid approval"
        );
      }
    }
  // ************

  // ***********************
  // * IERC1155MetaDATAURI *
  // ***********************
    contract Unit_Uri is Deployed {
      function test_unit_uri_revert_when_token_dont_exist() public {
        uint256 id = SERIES_ID;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
            id
          )
        );
        testContract.uri(id);
      }
      function test_unit_uri_is_accurate() public {
        uint256 id = SERIES_ID;
        _setupSeriesFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.uri(id))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(id))),
          "invalid uri"
        );
      }
    }
  // ***********************
// **************************************
