// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IERC721Receiver } from "../../../contracts/interfaces/IERC721Receiver.sol";
import { IERC2309 } from "../../../contracts/interfaces/IERC2309.sol";
import { IERC721 } from "../../../contracts/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../contracts/interfaces/IERC721Enumerable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC721Events } from "../../../contracts/mocks/events/IERC721Events.sol";
import { Mock_NonERC721Receiver } from "../../../contracts/mocks/external/Mock_NonERC721Receiver.sol";
import { Mock_ERC721Receiver } from "../../../contracts/mocks/external/Mock_ERC721Receiver.sol";
import { Mock_ERC721Batch } from "../../../contracts/mocks/tokens/Mock_ERC721Batch.sol";

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
// *****           PUBLIC           *****
// **************************************
  // ********************
  // * Mock_ERC721Batch *
  // ********************
    contract Unit_Mint is Deployed {
      function test_unit_erc721Batch_emit_Transfer_event_when_minting_via_mint() public {
        address operator = ALICE.addr;
        uint256 amount = TARGET_AMOUNT;
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
      }
    }
    contract Unit_Mint2309 is Deployed {
      function test_unit_erc721Batch_emit_ConsecutiveTransfer_event_when_minting_via_mint2309() public {
        address operator = ALICE.addr;
        uint256 amount = TARGET_AMOUNT;
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ConsecutiveTransfer(FIRST_TOKEN, FIRST_TOKEN + amount - 1, address(0), operator);
        testContract.mint2309(amount);
        assertEq(
          testContract.balanceOf(operator),
          amount,
          "invalid balance"
        );
      }
    }
    contract Unit_SetBaseUri is Deployed {
      function test_unit_erc721Batch_set_base_uri() public {
        string memory newBaseUri = NEW_BASE_URI;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        testContract.setBaseUri(newBaseUri);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(newBaseUri, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
    }
  // ********************

  // ***********
  // * IERC721 *
  // ***********
    contract Unit_Approve is Deployed {
      function test_unit_erc721Batch_revert_when_token_dont_exist() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        uint256 tokenId = TARGET_TOKEN;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.approve(approvedAccount, tokenId);
      }
      function test_unit_erc721Batch_revert_when_operator_not_approved() public {
        address operator = OPERATOR.addr;
        address approvedAccount = OPERATOR.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_CALLER_NOT_APPROVED.selector,
            operator,
            tokenId
          )
        );
        testContract.approve(approvedAccount, tokenId);
      }
      function test_unit_erc721Batch_revert_when_approving_token_owner() public {
        address operator = ALICE.addr;
        address approvedAccount = ALICE.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(IERC721.IERC721_INVALID_APPROVAL.selector);
        testContract.approve(approvedAccount, tokenId);
      }
      function test_unit_erc721Batch_emit_Approval_event_when_caller_is_token_owner() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Approval(operator, approvedAccount, tokenId);
        testContract.approve(approvedAccount, tokenId);
        assertEq(
          testContract.getApproved(tokenId),
          approvedAccount,
          "invalid approval"
        );
      }
      function test_unit_erc721Batch_emit_Approval_event_when_caller_is_individually_approved() public {
        address operator = OPERATOR.addr;
        address approvedAccount = OPERATOR.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveFixture(approvedAccount);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Approval(ALICE.addr, approvedAccount, tokenId);
        testContract.approve(approvedAccount, tokenId);
        assertEq(
          testContract.getApproved(tokenId),
          approvedAccount,
          "invalid approval"
        );
      }
      function test_unit_erc721Batch_emit_Approval_event_when_caller_is_approved_for_all() public {
        address operator = OPERATOR.addr;
        address approvedAccount = OPERATOR.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveAllFixture(approvedAccount);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Approval(ALICE.addr, approvedAccount, tokenId);
        testContract.approve(approvedAccount, tokenId);
        assertEq(
          testContract.getApproved(tokenId),
          approvedAccount,
          "invalid approval"
        );
      }
    }
    contract Unit_SafeTransferFrom is Deployed {
      function test_unit_erc721Batch_revert_when_token_dont_exist() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_recipient_is_address_zero() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(0);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_from_dont_own_token() public {
        address operator = ALICE.addr;
        address tokenOwner = OPERATOR.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_operator_not_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_CALLER_NOT_APPROVED.selector,
            operator,
            TARGET_TOKEN
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_is_non_receiver_contract() public {
        Mock_NonERC721Receiver receivingContract = new Mock_NonERC721Receiver();
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_contract_returns_unexpected_value() public {
        Mock_ERC721Receiver receivingContract = new Mock_ERC721Receiver(
          RETVAL,
          Mock_ERC721Receiver.Error.None
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_contract_reverts_with_custom_error() public {
        Mock_ERC721Receiver receivingContract = new Mock_ERC721Receiver(
          type(IERC721Receiver).interfaceId,
          Mock_ERC721Receiver.Error.RevertWithError
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(Mock_ERC721Receiver.ERC721ReceiverError.selector);
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_contract_reverts_with_message() public {
        Mock_ERC721Receiver receivingContract = new Mock_ERC721Receiver(
          type(IERC721Receiver).interfaceId,
          Mock_ERC721Receiver.Error.RevertWithMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert("Mock_ERC721Receiver: reverting");
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_contract_reverts_without_message() public {
        Mock_ERC721Receiver receivingContract = new Mock_ERC721Receiver(
          type(IERC721Receiver).interfaceId,
          Mock_ERC721Receiver.Error.RevertWithoutMessage
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert();
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_receiver_contract_panics() public {
        Mock_ERC721Receiver receivingContract = new Mock_ERC721Receiver(
          type(IERC721Receiver).interfaceId,
          Mock_ERC721Receiver.Error.Panic
        );
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(receivingContract);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_token_owner() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_individually_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveFixture(operator);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_approved_for_all() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveAllFixture(operator);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.safeTransferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
    }
    contract Unit_SetApprovalForAll is Deployed {
      function test_unit_erc721Batch_revert_when_approving_self() public {
        address operator = ALICE.addr;
        address approvedAccount = ALICE.addr;
        bool isApproved = true;
        vm.prank(operator);
        vm.expectRevert(IERC721.IERC721_INVALID_APPROVAL.selector);
        testContract.setApprovalForAll(approvedAccount, isApproved);
        assertFalse(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
      function test_unit_erc721Batch_emit_ApprovalForAll_when_approving_other() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        bool isApproved = true;
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ApprovalForAll(operator, approvedAccount, isApproved);
        testContract.setApprovalForAll(approvedAccount, isApproved);
        assertTrue(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
      function test_unit_erc721Batch_emit_ApprovalForAll_when_disproving_other() public {
        address operator = ALICE.addr;
        address approvedAccount = OPERATOR.addr;
        bool isApproved = false;
        _approveAllFixture(approvedAccount);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit ApprovalForAll(operator, approvedAccount, isApproved);
        testContract.setApprovalForAll(approvedAccount, isApproved);
        assertFalse(
          testContract.isApprovedForAll(operator, approvedAccount),
          "invalid approval"
        );
      }
    }
    contract Unit_TransferFrom is Deployed {
      function test_unit_erc721Batch_revert_when_token_dont_exist() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.transferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_recipient_is_address_zero() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = address(0);
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_INVALID_RECEIVER.selector,
            recipient
          )
        );
        testContract.transferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_from_dont_own_token() public {
        address operator = ALICE.addr;
        address tokenOwner = OPERATOR.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
        testContract.transferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_revert_when_operator_not_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_CALLER_NOT_APPROVED.selector,
            operator,
            tokenId
          )
        );
        testContract.transferFrom(tokenOwner, recipient, tokenId);
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_token_owner() public {
        address operator = ALICE.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.transferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_individually_approved() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveFixture(operator);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.transferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
      function test_unit_erc721Batch_emit_Transfer_event_when_caller_is_approved_for_all() public {
        address operator = OPERATOR.addr;
        address tokenOwner = ALICE.addr;
        address recipient = RECIPIENT.addr;
        uint256 tokenId = TARGET_TOKEN;
        _approveAllFixture(operator);
        vm.prank(operator);
        vm.expectEmit(address(testContract));
        emit Transfer(tokenOwner, recipient, tokenId);
        testContract.transferFrom(tokenOwner, recipient, tokenId);
        assertEq(
          testContract.ownerOf(tokenId),
          recipient,
          "invalid token owner"
        );
      }
    }
  // ***********
// **************************************

// **************************************
// *****            VIEW            *****
// **************************************
  // ***********
  // * IERC721 *
  // ***********
    contract Unit_BalanceOf is Deployed {
      function test_unit_erc721Batch_revert_when_checking_balance_of_zero_address() public {
        address tokenOwner = address(0);
        vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
        testContract.balanceOf(address(0));
      }
      function test_unit_erc721Batch_balance_of_non_token_owner_is_zero() public {
        address tokenOwner = OPERATOR.addr;
        _mintFixture();
        assertEq(
          testContract.balanceOf(tokenOwner),
          0,
          "invalide balance"
        );
      }
      function test_unit_erc721Batch_balance_of_token_owners_is_accurate() public {
        _mintFixture();
        assertEq(
          testContract.balanceOf(ALICE.addr),
          ALICE_SUPPLY,
          "invalid ALICE.addr balance"
        );
        assertEq(
          testContract.balanceOf(BOB.addr),
          BOB_SUPPLY,
          "invalid BOB.addr balance"
        );
      }
    }
    contract Unit_GetApproved is Deployed {
      function test_unit_erc721Batch_revert_when_requesting_approval_status_of_token_zero() public {
        uint256 tokenId = 0;
        _mintFixture();
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.getApproved(tokenId);
      }
      function test_unit_erc721Batch_revert_when_requesting_approval_status_of_non_existant_token() public {
        uint256 tokenId = TARGET_TOKEN;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.getApproved(tokenId);
      }
      function test_unit_erc721Batch_individual_approval_status_of_freshly_minted_token_is_address_zero() public {
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        assertEq(
          testContract.getApproved(tokenId),
          address(0),
          "invalid approval"
        );
      }
    }
    contract Unit_IsApprovedForAll is Deployed {
      function test_unit_erc721Batch_approval_for_all_status_is_false_by_default() public {
        address tokenOwner = ALICE.addr;
        address operator = OPERATOR.addr;
        assertFalse(
          testContract.isApprovedForAll(tokenOwner, operator),
          "invalid approval"
        );
      }
    }
    contract Unit_OwnerOf is Deployed {
      function test_unit_erc721Batch_revert_when_requesting_ownership_of_token_zero() public {
        uint256 tokenId = 0;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.ownerOf(tokenId);
      }
      function test_unit_erc721Batch_revert_when_requesting_ownership_of_non_existant_token() public {
        uint256 tokenId = TARGET_TOKEN;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.ownerOf(tokenId);
      }
      function test_unit_erc721Batch_ownership_of_existing_tokens_is_accurate() public {
        _mintFixture();
        assertEq(
          testContract.ownerOf(BOB_TOKEN),
          BOB.addr,
          "invalid owner"
        );
        assertEq(
          testContract.ownerOf(TARGET_TOKEN),
          ALICE.addr,
          "invalid owner"
        );
      }
    }
  // ***********

  // *********************
  // * IERC721Enumerable *
  // *********************
    contract Unit_TokenByIndex is Deployed {
      function test_unit_erc721Batch_revert_when_requesting_token_at_non_existant_index() public {
        uint256 index = TARGET_INDEX;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721Enumerable.IERC721Enumerable_INDEX_OUT_OF_BOUNDS.selector,
            index
          )
        );
        testContract.tokenByIndex(index);
      }
      function test_unit_erc721Batch_token_by_index_is_accurate() public {
        uint256 index = TARGET_INDEX;
        _mintFixture();
        assertEq(
          testContract.tokenByIndex(index),
          TARGET_TOKEN,
          "invalid index"
        );
      }
    }
    contract Unit_TokenOfOwnerByIndex is Deployed {
      function test_unit_erc721Batch_revert_when_requesting_index_of_token_owned_by_address_zero() public {
        address tokenOwner = address(0);
        uint256 index = TARGET_INDEX;
        _mintFixture();
        vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
        testContract.tokenOfOwnerByIndex(tokenOwner, index);
      }
      function test_unit_erc721Batch_revert_when_requesting_index_of_non_owned_token() public {
        address tokenOwner = OPERATOR.addr;
        uint256 index = TARGET_INDEX;
        _mintFixture();
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721Enumerable.IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS.selector,
            index
          )
        );
        testContract.tokenOfOwnerByIndex(tokenOwner, index);
      }
      function test_unit_erc721Batch_token_of_owner_by_index_is_accurate() public {
        _mintFixture();
        assertEq(
          testContract.tokenOfOwnerByIndex(BOB.addr, 0),
          BOB_TOKEN,
          "invalid token id"
        );
        assertEq(
          testContract.tokenOfOwnerByIndex(ALICE.addr, TARGET_INDEX),
          TARGET_TOKEN,
          "invalid token id"
        );
      }
    }
    contract Unit_TotalSupply is Deployed {
      function test_unit_erc721Batch_initial_total_supply_is_accurate() public {
        assertEq(
          testContract.totalSupply(),
          0,
          "invalid total supply"
        );
      }
      function test_unit_erc721Batch_total_supply_is_accurate_after_minting_some_tokens() public {
        _mintFixture();
        assertEq(
          testContract.totalSupply(),
          MINTED_SUPPLY,
          "invalid total supply"
        );
      }
    }
  // *********************

  // *******************
  // * IERC721Metadata *
  // *******************
    contract Unit_Name is Deployed {
      function test_unit_erc721Batch_name_is_accurate() public {
        assertEq(
          testContract.name(),
          NAME,
          "invalid name"
        );
      }
    }
    contract Unit_Symbol is Deployed {
      function test_unit_erc721Batch_symbol_is_accurate() public {
        assertEq(
          testContract.symbol(),
          SYMBOL,
          "invalid ticker"
        );
      }
    }
    contract Unit_TokenURI is Deployed {
      function test_unit_erc721Batch_revert_when_requesting_uri_of_token_zero() public {
        uint256 tokenId = 0;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.tokenURI(tokenId);
      }
      function test_unit_erc721Batch_revert_when_requesting_uri_of_non_existant_token() public {
        uint256 tokenId = TARGET_TOKEN;
        vm.expectRevert(
          abi.encodeWithSelector(
            IERC721.IERC721_NONEXISTANT_TOKEN.selector,
            tokenId
          )
        );
        testContract.tokenURI(tokenId);
      }
      function test_unit_erc721Batch_token_uri_is_accurate() public {
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
    }
  // *******************
// **************************************
