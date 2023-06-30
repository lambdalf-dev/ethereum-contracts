// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_ERC721, Behavior_ERC721Enumerable} from "./utils/Behavior.ERC721.sol";
import {Mock_NonERC721Receiver} from "../../contracts/mocks/external/Mock_NonERC721Receiver.sol";
import {Mock_ERC721Receiver} from "../../contracts/mocks/external/Mock_ERC721Receiver.sol";
import {Mock_ERC721BatchBurnable} from "../../contracts/mocks/tokens/Mock_ERC721BatchBurnable.sol";
import {IERC721} from "../../contracts/interfaces/IERC721.sol";
import {IERC721Enumerable} from "../../contracts/interfaces/IERC721Enumerable.sol";
import {IERC721Metadata} from "../../contracts/interfaces/IERC721Metadata.sol";
import {IERC721Receiver} from "../../contracts/interfaces/IERC721Receiver.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Constants is Behavior_ERC721, Behavior_ERC721Enumerable {
  string NAME = "NFT Collection";
  string SYMBOL = "NFT";
  string BASE_URI = "https://api.exemple.com/";
  uint256 FIRST_TOKEN = 1;
  uint256 TARGET_TOKEN = 4;
  uint256 OTHER_OWNER_TOKEN = 7;
  address TOKEN_OWNER = user19.publicKey;
  address OTHER_OWNER = user18.publicKey;
  uint256 TOKEN_OWNER_INIT_SUPPLY = 6;
  uint256 TOKEN_OWNER_MORE_SUPPLY = 3;
  uint256 TOKEN_OWNER_SUPPLY = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY;
  uint256 OTHER_OWNER_SUPPLY = 1;
  uint256 MINTED_SUPPLY = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY;
  uint256 BURNED_SUPPLY = 1;
}

contract Deployed is Constants {
  Mock_ERC721BatchBurnable testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Mock_ERC721BatchBurnable();
  }
  function mintFixture() internal {
    vm.prank(TOKEN_OWNER);
    testContract.mint(TOKEN_OWNER_INIT_SUPPLY);
    vm.prank(OTHER_OWNER);
    testContract.mint(OTHER_OWNER_SUPPLY);
    vm.prank(TOKEN_OWNER);
    testContract.mint(TOKEN_OWNER_MORE_SUPPLY);
  }
  function burnFixture() internal {
    mintFixture();
    vm.prank(TOKEN_OWNER);
    testContract.burn(TARGET_TOKEN);
  }
}

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ********************
  // * Mock_ERC721Batch *
  // ********************
    contract Mint is Deployed {
      function test_emit_Transfer_event_when_minting_via_mint(uint256 amount) public {
        amount = bound(amount, 1, 4147);
        vm.prank(TOKEN_OWNER);
        emitMintEvent(
          address(testContract),
          abi.encodeWithSignature(
            "mint(uint256)",
            amount
          ),
          address(testContract),
          1,
          amount,
          TOKEN_OWNER
        );
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          amount,
          "invalid balance"
        );
      }
    }
    contract Mint2309 is Deployed {
      function test_emit_ConsecutiveTransfer_event_when_minting_via_mint2309(uint256 amount) public {
        amount = bound(amount, 1, 11515);
        // uint256 amount = 11514;
        vm.prank(TOKEN_OWNER);
        emitConsecutiveMintEvent(
          address(testContract),
          abi.encodeWithSignature(
            "mint2309(uint256)",
            amount
          ),
          address(testContract),
          1,
          amount,
          TOKEN_OWNER
        );
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          amount,
          "invalid balance"
        );
      }
    }
    contract SetBaseUri is Deployed {
      function test_set_base_uri(uint256 tokenId, string memory newBaseUri) public {
        mintFixture();
        testContract.setBaseUri(newBaseUri);
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
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
    contract Approve is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(TOKEN_OWNER);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_operator_not_approved(address operator) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_approving_token_owner() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidApproval(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            TOKEN_OWNER,
            TARGET_TOKEN
          )
        );
      }
      function test_emit_Approval_event_when_caller_is_token_owner(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          operator,
          "invalid approval"
        );
      }
      function test_emit_Approval_event_when_caller_is_individually_approved(address operator, address secondOperator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(secondOperator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, TARGET_TOKEN);
        vm.prank(operator);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            secondOperator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          secondOperator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          secondOperator,
          "invalid approval"
        );
      }
      function test_emit_Approval_event_when_caller_is_approved_for_all(address operator, address secondOperator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(secondOperator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            secondOperator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          secondOperator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          secondOperator,
          "invalid approval"
        );
      }
    }
    contract SafeTransferFrom is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            operator,
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            from,
            to,
            TARGET_TOKEN
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_receiver_is_non_receiver_contract() public {
        mintFixture();
        Mock_NonERC721Receiver nonReceiver = new Mock_NonERC721Receiver();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(nonReceiver),
            TARGET_TOKEN
          ),
          address(nonReceiver)
        );
      }
      function test_revert_when_receiver_contract_returns_unexpected_value(bytes4 retval) public {
        mintFixture();
        vm.assume(retval != type(IERC721Receiver).interfaceId);
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.None);
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          address(receiver)
        );
      }
      function test_revert_when_receiver_contract_reverts_with_custom_error() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithError);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithError
        );
      }
      function test_revert_when_receiver_contract_reverts_with_message() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithMessage
        );
      }
      function test_revert_when_receiver_contract_reverts_without_message() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithoutMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithoutMessage
        );
      }
      function test_revert_when_receiver_contract_panics() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.Panic);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.Panic
        );
      }
      function test_emit_Transfer_event_when_caller_is_token_owner(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_revert_when_trying_to_transfer_burned_token(address operator) public {
        burnFixture();
        vm.assume(operator != address(0));
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            operator,
            operator,
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
    contract SafeTransferFromWithData is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            operator,
            operator,
            tokenId,
            data
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero(bytes memory data) public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN,
            data
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to, bytes memory data) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            from,
            to,
            TARGET_TOKEN,
            data
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN,
            data
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_receiver_is_non_receiver_contract(bytes memory data) public {
        mintFixture();
        Mock_NonERC721Receiver nonReceiver = new Mock_NonERC721Receiver();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(nonReceiver),
            TARGET_TOKEN,
            data
          ),
          address(nonReceiver)
        );
      }
      function test_revert_when_receiver_contract_returns_unexpected_value(bytes4 retval, bytes memory data) public {
        mintFixture();
        vm.assume(retval != type(IERC721Receiver).interfaceId);
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.None);
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          address(receiver)
        );
      }
      function test_revert_when_receiver_contract_reverts_with_custom_error(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithError);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithError
        );
      }
      function test_revert_when_receiver_contract_reverts_with_message(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithMessage
        );
      }
      function test_revert_when_receiver_contract_reverts_without_message(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithoutMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithoutMessage
        );
      }
      function test_revert_when_receiver_contract_panics(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.Panic);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.Panic
        );
      }
      function test_emit_Transfer_event_when_caller_is_token_owner(uint256 tokenId, bytes memory data) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_revert_when_trying_to_transfer_burned_token(address operator, bytes memory data) public {
        burnFixture();
        vm.assume(operator != address(0));
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            operator,
            operator,
            TARGET_TOKEN,
            data
          ),
          TARGET_TOKEN
        );
      }
    }
    contract SetApprovalForAll is Deployed {
      function test_revert_when_approving_self() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidApproval(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            TOKEN_OWNER,
            true
          )
        );
        assertFalse(testContract.isApprovedForAll(TOKEN_OWNER, TOKEN_OWNER), "invalid approval");
      }
      function test_emit_ApprovalForAll_when_approving_other(address operator) public {
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
      function test_emit_ApprovalForAll_when_disproving_other(address operator) public {
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
    contract TransferFrom is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            operator,
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            from,
            to,
            TARGET_TOKEN
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_emit_Transfer_event_when_caller_is_token_owner(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_revert_when_trying_to_transfer_burned_token(address operator) public {
        burnFixture();
        vm.assume(operator != address(0));
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            operator,
            operator,
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
  // ***********

  // ***********************
  // * ERC721BatchBurnable *
  // ***********************
    contract Burn is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > 10);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_operator_not_approved(address operator) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            operator,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_emit_Transfer_event_when_caller_is_token_owner(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          address(0),
          tokenId
        );
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          TOKEN_OWNER_SUPPLY - BURNED_SUPPLY,
          "invalid balance after burn"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          address(0),
          tokenId
        );
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          TOKEN_OWNER_SUPPLY - BURNED_SUPPLY,
          "invalid balance after burn"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          address(0),
          tokenId
        );
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          TOKEN_OWNER_SUPPLY - BURNED_SUPPLY,
          "invalid balance after burn"
        );
      }
      function test_revert_when_trying_to_burn_burned_token(address operator) public {
        burnFixture();
        vm.assume(operator != address(0));
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "burn(uint256)",
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
  // ***********************
// **************************************

// **************************************
// *****            VIEW            *****
// **************************************
  // ***********
  // * IERC721 *
  // ***********
    contract BalanceOf is Deployed {
      function test_revert_when_checking_balance_of_zero_address() public {
        mintFixture();
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "balanceOf(address)",
            address(0)
          )
        );
      }
      function test_balance_of_non_token_owner_is_zero(address nonOwner) public {
        mintFixture();
        vm.assume(nonOwner != address(0));
        vm.assume(nonOwner != TOKEN_OWNER);
        vm.assume(nonOwner != OTHER_OWNER);
        assertEq(
          testContract.balanceOf(nonOwner),
          0,
          "invalide balance"
        );
      }
      function test_balance_of_token_owners_is_accurate() public {
        mintFixture();
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          TOKEN_OWNER_SUPPLY,
          "invalid TOKEN_OWNER balance"
        );
        assertEq(
          testContract.balanceOf(OTHER_OWNER),
          OTHER_OWNER_SUPPLY,
          "invalid OTHER_OWNER balance"
        );
      }
    }
    contract GetApproved is Deployed {
      function test_revert_when_requesting_approval_status_of_token_zero() public {
        mintFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "getApproved(uint256)", 0
          ),
          0
        );
      }
      function test_revert_when_requesting_approval_status_of_non_existant_token(uint256 tokenId) public {
        mintFixture();
        vm.assume(tokenId > MINTED_SUPPLY);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "getApproved(uint256)", tokenId
          ),
          tokenId
        );
      }
      function test_individual_approval_status_of_freshly_minted_token_is_address_zero(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          testContract.getApproved(tokenId),
          address(0),
          "invalid approval"
        );
      }
      function test_revert_when_requesting_individual_approval_status_of_burned_token() public {
        burnFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "getApproved(uint256)",
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
      function test_revert_when_trying_to_approve_burned_token(address operator) public {
        burnFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
    contract IsApprovedForAll is Deployed {
      function test_approval_for_all_status_is_false_by_default(address tokenOwner, address operator) public {
        mintFixture();
        assertFalse(
          testContract.isApprovedForAll(tokenOwner, operator),
          "invalid approval"
        );
      }
    }
    contract OwnerOf is Deployed {
      function test_revert_when_requesting_ownership_of_token_zero() public {
        mintFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "ownerOf(uint256)", 0
          ),
          0
        );
      }
      function test_revert_when_requesting_ownership_of_non_existant_token(uint256 tokenId) public {
        mintFixture();
        vm.assume(tokenId > MINTED_SUPPLY);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "ownerOf(uint256)", tokenId
          ),
          tokenId
        );
      }
      function test_ownership_of_existing_tokens_is_accurate(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        if (tokenId == 7) {
          assertEq(
            testContract.ownerOf(tokenId),
            OTHER_OWNER,
            "invalid owner"
          );
        }
        else {
          assertEq(
            testContract.ownerOf(tokenId),
            TOKEN_OWNER,
            "invalid owner"
          );
        }
      }
      function test_revert_when_requesting_ownership_of_burned_token() public {
        burnFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "ownerOf(uint256)",
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
  // ***********

  // *********************
  // * IERC721Enumerable *
  // *********************
    contract TokenByIndex is Deployed {
      function test_revert_when_requesting_token_at_non_existant_index(uint256 index) public {
        mintFixture();
        vm.assume(index > MINTED_SUPPLY - FIRST_TOKEN);
        revertWhenIndexOutOfBounds(
          address(testContract),
          abi.encodeWithSignature(
            "tokenByIndex(uint256)",
            index
          ),
          index
        );
      }
      function test_token_by_index_is_accurate(uint256 index) public {
        mintFixture();
        vm.assume(index < MINTED_SUPPLY);
        assertEq(
          testContract.tokenByIndex(index),
          index + FIRST_TOKEN,
          "invalid index"
        );
      }
    }
    contract TokenOfOwnerByIndex is Deployed {
      function test_revert_when_requesting_index_of_token_owned_by_address_zero(uint256 index) public {
        mintFixture();
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "tokenOfOwnerByIndex(address,uint256)",
            address(0),
            index
          )
        );
      }
      function test_revert_when_requesting_index_of_non_owned_token(uint256 index, address tokenOwner) public {
        mintFixture();
        vm.assume(index > 9);
        vm.assume(tokenOwner != address(0));
        revertWhenOwnerIndexOutOfBounds(
          address(testContract),
          abi.encodeWithSignature(
            "tokenOfOwnerByIndex(address,uint256)",
            tokenOwner,
            index
          ),
          index
        );
      }
      function test_token_of_owner_by_index_is_accurate(uint256 index) public {
        mintFixture();
        assertEq(
          testContract.tokenOfOwnerByIndex(OTHER_OWNER, 0),
          OTHER_OWNER_TOKEN,
          "invalid token id"
        );
        vm.assume(index < MINTED_SUPPLY - FIRST_TOKEN);
        if (index < TOKEN_OWNER_INIT_SUPPLY) {
          assertEq(
            testContract.tokenOfOwnerByIndex(TOKEN_OWNER, index),
            index + FIRST_TOKEN,
            "invalid token id"
          );
        }
        else {
          assertEq(
            testContract.tokenOfOwnerByIndex(TOKEN_OWNER, index),
            index + FIRST_TOKEN + OTHER_OWNER_SUPPLY,
            "invalid token id"
          );
        }
      }
    }
    contract TotalSupply is Deployed {
      function test_initial_total_supply_is_accurate() public {
        assertEq(
          testContract.totalSupply(),
          0,
          "invalid total supply"
        );
      }
      function test_total_supply_is_accurate_after_minting_some_tokens() public {
        mintFixture();
        assertEq(
          testContract.totalSupply(),
          MINTED_SUPPLY,
          "invalid total supply"
        );
      }
      function test_total_supply_is_accurately_reduced_after_burning() public {
        burnFixture();
        assertEq(
          testContract.totalSupply(),
          MINTED_SUPPLY - BURNED_SUPPLY,
          "invalid total supply"
        );
      }
    }
  // *********************

  // *******************
  // * IERC721Metadata *
  // *******************
    contract Name is Deployed {
      function test_name_is_accurate() public {
        assertEq(
          testContract.name(),
          NAME,
          "invalid name"
        );
      }
    }
    contract Symbol is Deployed {
      function test_symbol_is_accurate() public {
        assertEq(
          testContract.symbol(),
          SYMBOL,
          "invalid ticker"
        );
      }
    }
    contract TokenURI is Deployed {
      function test_revert_when_requesting_uri_of_token_zero() public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "tokenURI(uint256)",
            0
          ),
          0
        );
      }
      function test_revert_when_requesting_uri_of_non_existant_token(uint256 tokenId) public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "tokenURI(uint256)",
            tokenId
          ),
          tokenId
        );
      }
      function test_token_uri_is_accurate(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
      function test_revert_when_requesting_uri_of_burned_token() public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "tokenURI(uint256)",
            TARGET_TOKEN
          ),
          TARGET_TOKEN
        );
      }
    }
  // *******************
// **************************************
