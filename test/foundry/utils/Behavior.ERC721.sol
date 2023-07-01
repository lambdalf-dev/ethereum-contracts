// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IERC721} from "../../../contracts/interfaces/IERC721.sol";
import {IERC721Enumerable} from "../../../contracts/interfaces/IERC721Enumerable.sol";
import {IERC721Metadata} from "../../../contracts/interfaces/IERC721Metadata.sol";
import {IERC721Receiver} from "../../../contracts/interfaces/IERC721Receiver.sol";
import {Mock_ERC721Receiver} from "../../../contracts/mocks/external/Mock_ERC721Receiver.sol";

contract Behavior_ERC721 is TestHelper {
  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event ConsecutiveTransfer(uint256 indexed fromTokenId, uint256 toTokenId, address indexed fromAddress, address indexed toAddress);
  // EVENTS
  function emitTransferEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address sender,
    address recipient,
    uint256 tokenId
  ) internal {
    vm.expectEmit(emitter);
    emit Transfer(sender, recipient, tokenId);
    (bool success,) = callee.call(signature);
  }
  function emitTransferEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address sender,
    address recipient,
    uint256 tokenId,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit Transfer(sender, recipient, tokenId);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function emitMintEvent(
    address callee,
    bytes memory signature,
    address emitter,
    uint256 firstToken,
    uint256 amount,
    address recipient
  ) internal {
    for (uint256 i = firstToken; i < firstToken + amount; ++i) {
      vm.expectEmit(emitter);
      emit Transfer(address(0), recipient, i);
    }
    (bool success,) = callee.call(signature);
  }
  function emitMintEvent(
    address callee,
    bytes memory signature,
    address emitter,
    uint256 firstToken,
    uint256 amount,
    address recipient,
    uint256 valueSent
  ) internal {
    for (uint256 i = firstToken; i < firstToken + amount; ++i) {
      vm.expectEmit(emitter);
      emit Transfer(address(0), recipient, i);
    }
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function emitConsecutiveMintEvent(
    address callee,
    bytes memory signature,
    address emitter,
    uint256 firstToken,
    uint256 amount,
    address recipient
  ) internal {
    vm.expectEmit(emitter);
    emit ConsecutiveTransfer(firstToken, firstToken + amount - 1, address(0), recipient);
    (bool success,) = callee.call(signature);
  }
  function emitConsecutiveMintEvent(
    address callee,
    bytes memory signature,
    address emitter,
    uint256 firstToken,
    uint256 amount,
    address recipient,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit ConsecutiveTransfer(firstToken, firstToken + amount - 1, address(0), recipient);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function emitApprovalEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address tokenOwner,
    address operator,
    uint256 tokenId
  ) internal {
    vm.expectEmit(emitter);
    emit Approval(tokenOwner, operator, tokenId);
    (bool success,) = callee.call(signature);
  }
  function emitApprovalEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address tokenOwner,
    address operator,
    uint256 tokenId,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit Approval(tokenOwner, operator, tokenId);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function emitApprovalForAllEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address tokenOwner,
    address operator,
    bool isApproved
  ) internal {
    vm.expectEmit(emitter);
    emit ApprovalForAll(tokenOwner, operator, isApproved);
    (bool success,) = callee.call(signature);
  }
  function emitApprovalForAllEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address tokenOwner,
    address operator,
    bool isApproved,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit ApprovalForAll(tokenOwner, operator, isApproved);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  // REVERTS
  function revertWhenTokenDontExist(address callee, bytes memory signature, uint256 tokenId) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_NONEXISTANT_TOKEN.selector,
        tokenId
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenTokenDontExist(address callee, bytes memory signature, uint256 tokenId, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_NONEXISTANT_TOKEN.selector,
        tokenId
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidTokenOwner(address callee, bytes memory signature) internal {
    vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidTokenOwner(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(IERC721.IERC721_INVALID_TOKEN_OWNER.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidApproval(address callee, bytes memory signature) internal {
    vm.expectRevert(IERC721.IERC721_INVALID_APPROVAL.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidApproval(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(IERC721.IERC721_INVALID_APPROVAL.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenCallerNotApproved(address callee, bytes memory signature, address operator, uint256 tokenId) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_CALLER_NOT_APPROVED.selector,
        operator,
        tokenId
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenCallerNotApproved(address callee, bytes memory signature, address operator, uint256 tokenId, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_CALLER_NOT_APPROVED.selector,
        operator,
        tokenId
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidReceiver(address callee, bytes memory signature, address receiver) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_INVALID_RECEIVER.selector,
        receiver
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidReceiver(address callee, bytes memory signature, address receiver, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721.IERC721_INVALID_RECEIVER.selector,
        receiver
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenReceiverReverts(address callee, bytes memory signature, Mock_ERC721Receiver.Error err) internal {
    if (err == Mock_ERC721Receiver.Error.RevertWithError) {
      vm.expectRevert(Mock_ERC721Receiver.ERC721ReceiverError.selector);
    }
    else if (err == Mock_ERC721Receiver.Error.RevertWithMessage) {
      vm.expectRevert("Mock_ERC721Receiver: reverting");
    }
    else if (err == Mock_ERC721Receiver.Error.RevertWithoutMessage) {
      vm.expectRevert();
    }
    else if (err == Mock_ERC721Receiver.Error.Panic) {
      vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
    }
    (bool success,) = callee.call(signature);
  }
  function revertWhenReceiverReverts(address callee, bytes memory signature, Mock_ERC721Receiver.Error err, uint256 valueSent) internal {
    if (err == Mock_ERC721Receiver.Error.RevertWithError) {
      vm.expectRevert(Mock_ERC721Receiver.ERC721ReceiverError.selector);
    }
    else if (err == Mock_ERC721Receiver.Error.RevertWithMessage) {
      vm.expectRevert("Mock_ERC721Receiver: reverting");
    }
    else if (err == Mock_ERC721Receiver.Error.RevertWithoutMessage) {
      vm.expectRevert();
    }
    else if (err == Mock_ERC721Receiver.Error.Panic) {
      vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
    }
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}

contract Behavior_ERC721Enumerable is TestHelper {
  // REVERTS
  function revertWhenIndexOutOfBounds(address callee, bytes memory signature, uint256 index) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721Enumerable.IERC721Enumerable_INDEX_OUT_OF_BOUNDS.selector,
        index
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenIndexOutOfBounds(address callee, bytes memory signature, uint256 index, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721Enumerable.IERC721Enumerable_INDEX_OUT_OF_BOUNDS.selector,
        index
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenOwnerIndexOutOfBounds(address callee, bytes memory signature, uint256 index) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721Enumerable.IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS.selector,
        index
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenOwnerIndexOutOfBounds(address callee, bytes memory signature, uint256 index, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC721Enumerable.IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS.selector,
        index
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}
