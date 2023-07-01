// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IERC1155} from "../../../contracts/interfaces/IERC1155.sol";
import {Mock_ERC1155Receiver} from "../../../contracts/mocks/external/Mock_ERC1155Receiver.sol";

contract Behavior_ERC1155 is TestHelper {
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
  event URI(string value, uint256 indexed id);
  event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
  event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
  // EVENTS
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
  function emitURIEvent(
    address callee,
    bytes memory signature,
    address emitter,
    string memory strValue,
    uint256 id
  ) internal {
    vm.expectEmit(emitter);
    emit URI(strValue, id);
    (bool success,) = callee.call(signature);
  }
  function emitURIEvent(
    address callee,
    bytes memory signature,
    address emitter,
    string memory strValue,
    uint256 id,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit URI(strValue, id);
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function emitTransferBatchEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal {
    vm.expectEmit(emitter);
    emit TransferBatch(operator, from, to, ids, values);
    (bool success,) = callee.call(signature);
  }
  function emitTransferBatchEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit TransferBatch(operator, from, to, ids, values);
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function emitTransferSingleEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address operator,
    address from,
    address to,
    uint256 id,
    uint256 value
  ) internal {
    vm.expectEmit(emitter);
    emit TransferSingle(operator, from, to, id, value);
    (bool success,) = callee.call(signature);
  }
  function emitTransferSingleEvent(
    address callee,
    bytes memory signature,
    address emitter,
    address operator,
    address from,
    address to,
    uint256 id,
    uint256 value,
    uint256 valueSent
  ) internal {
    vm.expectEmit(emitter);
    emit TransferSingle(operator, from, to, id, value);
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  // REVERTS
  function revertWhenCallerNotApproved(address callee, bytes memory signature, address tokenOwner, address operator) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_CALLER_NOT_APPROVED.selector,
        tokenOwner,
        operator
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenCallerNotApproved(address callee, bytes memory signature, address tokenOwner, address operator, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_CALLER_NOT_APPROVED.selector,
        tokenOwner,
        operator
      )
    );
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenTokenExists(address callee, bytes memory signature, uint256 id) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_EXISTANT_TOKEN.selector,
        id
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenTokenExists(address callee, bytes memory signature, uint256 id, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_EXISTANT_TOKEN.selector,
        id
      )
    );
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenTokenOwnerDontOwnEnough(address callee, bytes memory signature, address tokenOwner, uint256 id) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_INSUFFICIENT_BALANCE.selector,
        tokenOwner,
        id
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenTokenOwnerDontOwnEnough(address callee, bytes memory signature, address tokenOwner, uint256 id, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_INSUFFICIENT_BALANCE.selector,
        tokenOwner,
        id
      )
    );
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenApprovingTokenOwner(address callee, bytes memory signature) internal {
    vm.expectRevert(IERC1155.IERC1155_INVALID_APPROVAL.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenApprovingTokenOwner(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(IERC1155.IERC1155_INVALID_APPROVAL.selector);
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenInvalidReceiver(address callee, bytes memory signature, address receiver) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_INVALID_RECEIVER.selector,
        receiver
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidReceiver(address callee, bytes memory signature, address receiver, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_INVALID_RECEIVER.selector,
        receiver
      )
    );
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenTokenDontExist(address callee, bytes memory signature, uint256 id) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
        id
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenTokenDontExist(address callee, bytes memory signature, uint256 id, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IERC1155.IERC1155_NON_EXISTANT_TOKEN.selector,
        id
      )
    );
    (bool success,) = callee.call{value: valueSent}(signature);
  }
  function revertWhenReceiverReverts(address callee, bytes memory signature, Mock_ERC1155Receiver.Error err) internal {
    if (err == Mock_ERC1155Receiver.Error.RevertWithError) {
      vm.expectRevert(Mock_ERC1155Receiver.ERC1155ReceiverError.selector);
    }
    else if (err == Mock_ERC1155Receiver.Error.RevertWithMessage) {
      vm.expectRevert("Mock_ERC1155Receiver: reverting");
    }
    else if (err == Mock_ERC1155Receiver.Error.RevertWithoutMessage) {
      vm.expectRevert();
    }
    else if (err == Mock_ERC1155Receiver.Error.Panic) {
      vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
    }
    (bool success,) = callee.call(signature);
  }
  function revertWhenReceiverReverts(address callee, bytes memory signature, Mock_ERC1155Receiver.Error err, uint256 valueSent) internal {
    if (err == Mock_ERC1155Receiver.Error.RevertWithError) {
      vm.expectRevert(Mock_ERC1155Receiver.ERC1155ReceiverError.selector);
    }
    else if (err == Mock_ERC1155Receiver.Error.RevertWithMessage) {
      vm.expectRevert("Mock_ERC1155Receiver: reverting");
    }
    else if (err == Mock_ERC1155Receiver.Error.RevertWithoutMessage) {
      vm.expectRevert();
    }
    else if (err == Mock_ERC1155Receiver.Error.Panic) {
      vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x12));
    }
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}

