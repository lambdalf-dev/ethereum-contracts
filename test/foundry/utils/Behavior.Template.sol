// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {ITemplate} from "../../../contracts/interfaces/ITemplate.sol";

contract Behavior_Template is TestHelper {
  event ContractStateChanged(uint8 indexed previousState, uint8 indexed newState);
  // EVENTS
  function emitContractStateChangedEvent(address callee, bytes memory signature, address emitter, uint8 previousState, uint8 newState) internal {
    vm.expectEmit(emitter);
    emit ContractStateChanged(previousState, newState);
    (bool success,) = callee.call(signature);
  }
  // REVERTS
  function revertWhenContractStateIsIncorrect(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenContractStateIsIncorrect(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenContractStateIsInvalid(address callee, bytes memory signature) internal {
    vm.expectRevert();
    (bool success,) = callee.call(signature);
  }
  function revertWhenContractStateIsInvalid(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert();
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenIncorrectEtherAmountSent(address callee, bytes memory signature, uint256 amountReceived, uint256 amountExpected) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.ETHER_INCORRECT_PRICE.selector,
        amountReceived,
        amountExpected
      )
    );
    callee.call{value:amountReceived}(signature);
  }
  function revertWhenNoEtherBalance(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.ETHER_NO_BALANCE.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenNoEtherBalance(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.ETHER_NO_BALANCE.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenEtherTransferFail(address callee, bytes memory signature, address to, uint256 amount) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.ETHER_TRANSFER_FAIL.selector,
        to,
        amount
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenEtherTransferFail(address callee, bytes memory signature, address to, uint256 amount, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.ETHER_TRANSFER_FAIL.selector,
        to,
        amount
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidQuantityRequested(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_QTY.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidQuantityRequested(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_QTY.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidReserve(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_RESERVE.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidReserve(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_RESERVE.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenInvalidSupply(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_SUPPLY.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenInvalidSupply(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.NFT_INVALID_SUPPLY.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenQtyOverMaxBatch(address callee, bytes memory signature, uint256 qtyRequested, uint256 maxBatch) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MAX_BATCH.selector,
        qtyRequested,
        maxBatch
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenQtyOverMaxBatch(address callee, bytes memory signature, uint256 qtyRequested, uint256 maxBatch, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MAX_BATCH.selector,
        qtyRequested,
        maxBatch
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenReserveDepleted(address callee, bytes memory signature, uint256 qtyRequested, uint256 reserveLeft) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MAX_RESERVE.selector,
        qtyRequested,
        reserveLeft
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenReserveDepleted(address callee, bytes memory signature, uint256 qtyRequested, uint256 reserveLeft, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MAX_RESERVE.selector,
        qtyRequested,
        reserveLeft
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenMintedOut(address callee, bytes memory signature, uint256 qtyRequested, uint256 remainingSupply) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MINTED_OUT.selector,
        qtyRequested,
        remainingSupply
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenMintedOut(address callee, bytes memory signature, uint256 qtyRequested, uint256 remainingSupply, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        ITemplate.NFT_MINTED_OUT.selector,
        qtyRequested,
        remainingSupply
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenCallingUnknownFunction(address callee, bytes memory signature) internal {
    vm.expectRevert(ITemplate.UNKNOWN.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenCallingUnknownFunction(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(ITemplate.UNKNOWN.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}
