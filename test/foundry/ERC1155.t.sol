// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_Arrays} from "./utils/Behavior.Arrays.sol";
import {Behavior_ERC1155} from "./utils/Behavior.ERC1155.sol";
import {Mock_NonERC1155Receiver} from "../../contracts/mocks/external/Mock_NonERC1155Receiver.sol";
import {Mock_ERC1155Receiver} from "../../contracts/mocks/external/Mock_ERC1155Receiver.sol";
import {Mock_ERC1155} from "../../contracts/mocks/tokens/Mock_ERC1155.sol";
import {IERC1155Receiver} from "../../contracts/interfaces/IERC1155Receiver.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Constants is Behavior_Arrays, Behavior_ERC1155 {
  string BASE_URI = "https://api.exemple.com/";
  address TOKEN_OWNER = user19.publicKey;
  address OTHER_OWNER = user18.publicKey;
  uint256 TOKEN_OWNER_INIT_SUPPLY = 6;
  uint256 TOKEN_OWNER_MORE_SUPPLY = 3;
  uint256 TOKEN_OWNER_SUPPLY = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY;
  uint256 OTHER_OWNER_SUPPLY = 1;
  uint256 MINTED_SUPPLY = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY;
  uint256 DEFAULT_SERIES = 0;
  uint256 SERIES_ID = 1;
}

contract Deployed is Constants {
  Mock_ERC1155 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC1155();
  }
  function setupSeriesFixture() internal {
    testContract.createSeries(SERIES_ID);
  }
  function mintFixture() internal {
    setupSeriesFixture();
    vm.prank(TOKEN_OWNER);
    testContract.mint(SERIES_ID, TOKEN_OWNER_INIT_SUPPLY);
    vm.prank(OTHER_OWNER);
    testContract.mint(SERIES_ID, OTHER_OWNER_SUPPLY);
    vm.prank(TOKEN_OWNER);
    testContract.mint(SERIES_ID, TOKEN_OWNER_MORE_SUPPLY);
  }
  function approveOperatorFixture(address operator) internal {
    mintFixture();
    vm.prank(TOKEN_OWNER);
    testContract.setApprovalForAll(operator, true);
  }
}

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ****************
  // * Mock_ERC1155 *
  // ****************
    contract Mint is Deployed {
      function test_erc1155_mint_revert_when_series_dont_exist(address operator, uint256 id, uint256 amount) public {
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "mint(uint256,uint256)",
            id,
            amount
          ),
          id
        );
      }
      function test_erc1155_mint_emit_TransferSingle_event(address operator, uint256 amount) public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        vm.prank(operator);
        emitTransferSingleEvent(
          address(testContract),
          abi.encodeWithSignature(
            "mint(uint256,uint256)",
            id,
            amount
          ),
          address(testContract),
          operator,
          address(0),
          operator,
          id,
          amount
        );
      }
    }
    contract CreateSeries is Deployed {
      function test_erc1155_create_series_revert_when_series_exist() public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        revertWhenTokenExists(
          address(testContract),
          abi.encodeWithSignature(
            "createSeries(uint256)",
            id
          ),
          id
        );
      }
      function test_erc1155_create_series_successfully(uint256 id) public {
        testContract.createSeries(id);
        assertTrue(testContract.exists(id), "invalid series");
      }
    }
    contract SetBaseUri is Deployed {
      function test_erc1155_emit_URI_event_when_setting_uri(string memory baseUri) public {
        emitURIEvent(
          address(testContract),
          abi.encodeWithSignature(
            "setBaseUri(string)",
            baseUri
          ),
          address(testContract),
          baseUri,
          DEFAULT_SERIES
        );
      }
    }
  // ****************

  // ************
  // * IERC1155 *
  // ************
    contract SafeBatchTransferFrom is Deployed {
      function test_erc1155_safe_batch_transfer_revert_when_series_dont_exist(address operator, uint256 id, address recipient, uint256 amount, bytes memory data) public {
        vm.assume(recipient != address(0));
        vm.prank(operator);
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        revertWhenTokenExists(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            operator,
            recipient,
            ids,
            amounts,
            data
          ),
          id
        );        
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_from_address_with_insufficient_balance(address operator, address recipient, uint256 amount, bytes memory data) public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        vm.assume(amount > 0);
        vm.assume(recipient != address(0));
        vm.prank(operator);
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        revertWhenTokenOwnerDontOwnEnough(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            operator,
            recipient,
            ids,
            amounts,
            data
          ),
          operator,
          id
        );        
      }
      function test_erc1155_safe_batch_transfer_revert_when_array_lengths_dont_match(address recipient, bytes memory data) public {
        mintFixture();
        vm.assume(recipient != address(0));
        vm.prank(TOKEN_OWNER);
        uint256 id = SERIES_ID;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;
        revertWhenArrayLengthsDontMatch(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          )
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_address_zero(uint256 amount, bytes memory data) public {
        mintFixture();
        address recipient = address(0);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        vm.prank(TOKEN_OWNER);
        uint256 id = SERIES_ID;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          recipient
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_caller_not_owner_or_approved(address operator, address recipient, uint256 amount, bytes memory data) public {
        mintFixture();
        vm.assume(recipient != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(!testContract.isApprovedForAll(TOKEN_OWNER, operator));
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          TOKEN_OWNER,
          operator
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_non_erc1155_receiver_contract(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_NonERC1155Receiver recipient = new Mock_NonERC1155Receiver();
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            address(recipient),
            ids,
            amounts,
            data
          ),
          address(recipient)
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_returns_unexpected_value(uint256 amount, bytes memory data, bytes4 retval) public {
        mintFixture();
        vm.assume(retval != IERC1155Receiver.onERC1155BatchReceived.selector);
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(retval, Mock_ERC1155Receiver.Error.None);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          address(recipient)
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_custom_error(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155BatchReceived.selector, Mock_ERC1155Receiver.Error.RevertWithError);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithError
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_message(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155BatchReceived.selector, Mock_ERC1155Receiver.Error.RevertWithMessage);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithMessage
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_without_message(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155BatchReceived.selector, Mock_ERC1155Receiver.Error.RevertWithoutMessage);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithoutMessage
        );
      }
      function test_erc1155_safe_batch_transfer_revert_when_transfering_to_a_receiver_contract_that_panics(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155BatchReceived.selector, Mock_ERC1155Receiver.Error.Panic);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          Mock_ERC1155Receiver.Error.Panic
        );
      }
      function test_erc1155_emit_TransferBatch_event_when_caller_owns_tokens(address recipient, uint256 amount, bytes memory data) public {
        mintFixture();
        vm.assume(recipient != address(0));
        vm.assume(recipient != TOKEN_OWNER);
        vm.assume(recipient != OTHER_OWNER);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(TOKEN_OWNER);
        emitTransferBatchEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          TOKEN_OWNER,
          recipient,
          ids,
          amounts
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
      }
      function test_erc1155_emit_TransferBatch_event_when_caller_is_approved_by_token_owner(address operator, address recipient, uint256 amount, bytes memory data) public {
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        approveOperatorFixture(operator);
        vm.assume(recipient != address(0));
        vm.assume(recipient != TOKEN_OWNER);
        vm.assume(recipient != OTHER_OWNER);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256[] memory ids = new uint256[](1);
        ids[0] = SERIES_ID;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        vm.prank(operator);
        emitTransferBatchEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
            TOKEN_OWNER,
            recipient,
            ids,
            amounts,
            data
          ),
          address(testContract),
          operator,
          TOKEN_OWNER,
          recipient,
          ids,
          amounts
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
      }
    }
    contract SafeTransferFrom is Deployed {
      function test_erc1155_safe_transfer_revert_when_series_dont_exist(address operator, uint256 id, address recipient, uint256 amount, bytes memory data) public {
        vm.prank(operator);
        revertWhenTokenExists(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            operator,
            recipient,
            id,
            amount,
            data
          ),
          id
        );        
      }
      function test_erc1155_safe_transfer_revert_when_transfering_from_address_with_insufficient_balance(address operator, address recipient, uint256 amount, bytes memory data) public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        vm.assume(amount > 0);
        vm.assume(recipient != address(0));
        vm.prank(operator);
        revertWhenTokenOwnerDontOwnEnough(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            operator,
            recipient,
            id,
            amount,
            data
          ),
          operator,
          id
        );        
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_address_zero(uint256 amount, bytes memory data) public {
        mintFixture();
        address recipient = address(0);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        vm.prank(TOKEN_OWNER);
        uint256 id = SERIES_ID;
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          recipient
        );
      }
      function test_erc1155_safe_transfer_revert_when_caller_not_owner_or_approved(address operator, address recipient, uint256 amount, bytes memory data) public {
        mintFixture();
        vm.assume(recipient != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(!testContract.isApprovedForAll(TOKEN_OWNER, operator));
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          TOKEN_OWNER,
          operator
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_non_erc1155_receiver_contract(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_NonERC1155Receiver recipient = new Mock_NonERC1155Receiver();
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            address(recipient),
            id,
            amount,
            data
          ),
          address(recipient)
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_returns_unexpected_value(uint256 amount, bytes memory data, bytes4 retval) public {
        mintFixture();
        vm.assume(retval != IERC1155Receiver.onERC1155Received.selector);
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(retval, Mock_ERC1155Receiver.Error.None);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          address(recipient)
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_custom_error(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155Received.selector, Mock_ERC1155Receiver.Error.RevertWithError);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithError
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_with_message(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155Received.selector, Mock_ERC1155Receiver.Error.RevertWithMessage);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithMessage
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_reverts_without_message(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155Received.selector, Mock_ERC1155Receiver.Error.RevertWithoutMessage);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          Mock_ERC1155Receiver.Error.RevertWithoutMessage
        );
      }
      function test_erc1155_safe_transfer_revert_when_transfering_to_a_receiver_contract_that_panics(uint256 amount, bytes memory data) public {
        mintFixture();
        Mock_ERC1155Receiver recipient = new Mock_ERC1155Receiver(IERC1155Receiver.onERC1155Received.selector, Mock_ERC1155Receiver.Error.Panic);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          Mock_ERC1155Receiver.Error.Panic
        );
      }
      function test_erc1155_emit_TransferSingle_event_when_caller_owns_tokens(address recipient, uint256 amount, bytes memory data) public {
        mintFixture();
        vm.assume(recipient != address(0));
        vm.assume(recipient != TOKEN_OWNER);
        vm.assume(recipient != OTHER_OWNER);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(TOKEN_OWNER);
        emitTransferSingleEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          TOKEN_OWNER,
          recipient,
          id,
          amount
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
      }
      function test_erc1155_emit_TransferSingle_event_when_caller_is_approved_by_token_owner(address operator, address recipient, uint256 amount, bytes memory data) public {
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        approveOperatorFixture(operator);
        vm.assume(recipient != address(0));
        vm.assume(recipient != TOKEN_OWNER);
        vm.assume(recipient != OTHER_OWNER);
        amount = bound(amount, 1, TOKEN_OWNER_SUPPLY);
        uint256 id = SERIES_ID;
        vm.prank(operator);
        emitTransferSingleEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,uint256,bytes)",
            TOKEN_OWNER,
            recipient,
            id,
            amount,
            data
          ),
          address(testContract),
          operator,
          TOKEN_OWNER,
          recipient,
          id,
          amount
        );
        assertEq(
          testContract.balanceOf(recipient, SERIES_ID),
          amount,
          "invalid balance"
        );
      }
    }
    contract SetApprovalForAll is Deployed {
      function test_erc1155_revert_when_approving_self() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenApprovingTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            TOKEN_OWNER,
            true
          )
        );
        assertFalse(testContract.isApprovedForAll(TOKEN_OWNER, TOKEN_OWNER), "invalid approval");
      }
      function test_erc1155_emit_ApprovalForAll_when_approving_other(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != address(0));
        vm.prank(TOKEN_OWNER);
        emitApprovalForAllEvent(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            operator,
            true
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          true
        );
        assertTrue(
          testContract.isApprovedForAll(TOKEN_OWNER, operator),
          "invalid approval"
        );
      }
      function test_erc1155_emit_ApprovalForAll_when_disproving_other(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != address(0));
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(TOKEN_OWNER);
        emitApprovalForAllEvent(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            operator,
            false
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          false
        );
        assertFalse(
          testContract.isApprovedForAll(TOKEN_OWNER, operator),
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
    contract DefaultSeries is Deployed {
      function test_erc1155_default_series_is_accurate() public {
        assertEq(
          testContract.DEFAULT_SERIES(),
          DEFAULT_SERIES,
          "invalid series id"
        );
      }
    }
    contract Exists is Deployed {
      function test_erc1155_series_not_created_dont_exist(uint256 id) public {
        assertFalse(
          testContract.exists(id),
          "invalid existence"
        );
      }
      function test_erc1155_created_series_exist() public {
        setupSeriesFixture();
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
    contract BalanceOf is Deployed {
      function test_erc1155_revert_when_series_dont_exist(address tokenOwner, uint256 id) public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "balanceOf(address,uint256)",
            tokenOwner,
            id
          ),
          id
        );
      }
      function test_erc1155_balance_of_non_token_owner_is_zero(address nonOwner) public {
        setupSeriesFixture();
        assertEq(
          testContract.balanceOf(nonOwner, SERIES_ID),
          0,
          "invalide balance"
        );
      }
      function test_erc1155_balance_of_token_owners_is_accurate() public {
        mintFixture();
        assertEq(
          testContract.balanceOf(TOKEN_OWNER, SERIES_ID),
          TOKEN_OWNER_SUPPLY,
          "invalid TOKEN_OWNER balance"
        );
        assertEq(
          testContract.balanceOf(OTHER_OWNER, SERIES_ID),
          OTHER_OWNER_SUPPLY,
          "invalid OTHER_OWNER balance"
        );
      }
    }
    contract BalanceOfBatch is Deployed {
      function test_erc1155_balance_of_batch_revert_when_batch_includes_invalid_series_id(address account, uint256 id) public {
        address[] memory accounts = new address[](1);
        accounts[0] = account;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "balanceOfBatch(address[],uint256[])",
            accounts,
            ids
          ),
          id
        );
      }
      function test_erc1155_balance_of_batch_revert_when_array_lengths_dont_match(address account1, address account2) public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](2);
        accounts[0] = account1;
        accounts[1] = account2;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        revertWhenArrayLengthsDontMatch(
          address(testContract),
          abi.encodeWithSignature(
            "balanceOfBatch(address[],uint256[])",
            accounts,
            ids
          )
        );
      }
      function test_erc1155_balance_of_batch_of_non_token_owner_is_zero(address account) public {
        setupSeriesFixture();
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](1);
        accounts[0] = account;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          0,
          "invalide balance"
        );
      }
      function test_erc1155_balance_of_batch_of_token_owners_is_accurate() public {
        mintFixture();
        uint256 id = SERIES_ID;
        address[] memory accounts = new address[](2);
        accounts[0] = TOKEN_OWNER;
        accounts[1] = OTHER_OWNER;
        uint256[] memory ids = new uint256[](2);
        ids[0] = id;
        ids[1] = id;
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[0],
          TOKEN_OWNER_SUPPLY,
          "invalid TOKEN_OWNER balance"
        );
        assertEq(
          testContract.balanceOfBatch(accounts, ids)[1],
          OTHER_OWNER_SUPPLY,
          "invalid OTHER_OWNER balance"
        );
      }
    }
    contract IsApprovedForAll is Deployed {
      function test_erc1155_approval_for_all_status_is_false_by_default(address tokenOwner, address operator) public {
        assertFalse(
          testContract.isApprovedForAll(tokenOwner, operator),
          "invalid approval"
        );
      }
    }
  // ************

  // ***********************
  // * IERC1155MetadataURI *
  // ***********************
    contract Uri is Deployed {
      function test_erc1155_uri_revert_when_token_dont_exist(uint256 id) public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "uri(uint256)",
            id
          ),
          id
        );
      }
      function test_erc1155_uri_is_accurate() public {
        setupSeriesFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.uri(SERIES_ID))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(SERIES_ID))),
          "invalid uri"
        );
      }
    }
  // ***********************
// **************************************
