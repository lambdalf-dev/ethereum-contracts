// SPDX-License-Identifier: MIT

/**
* Team: Asteria Labs
* Author: Lambdalf the White
*/

pragma solidity ^0.8.4;

interface ITemplate721 {
  // **************************************
  // *****           ERRORS           *****
  // **************************************
    /// @dev Thrown when two related arrays have different lengths.
    error ARRAY_LENGTH_MISMATCH();
    /// @dev Thrown when a function is called with the wrong contract state.
    error CONTRACT_STATE_INCORRECT();
    /// @dev Thrown when trying to set the contract state to an invalid value.
    error CONTRACT_STATE_INVALID();
    /// @dev Thrown when an incorrect amount of eth is being sent for a payable operation.
    /// 
    /// @param amountReceived the amount the contract received
    /// @param amountExpected the actual amount the contract expected to receive
    error ETHER_INCORRECT_PRICE(uint256 amountReceived, uint256 amountExpected);
    /// @dev Thrown when trying to withdraw from the contract with no balance.
    error ETHER_NO_BALANCE();
    /// @dev Thrown when contract fails to send ether to recipient.
    /// 
    /// @param to the recipient of the ether
    /// @param amount the amount of ether being sent
    error ETHER_TRANSFER_FAIL(address to, uint256 amount);
    /// @dev Thrown when trying to mint 0 token.
    error NFT_INVALID_QTY();
    /// @dev Thrown when trying to set reserve to an invalid amount.
    error NFT_INVALID_RESERVE();
    /// @dev Thrown when trying to set max supply to an invalid amount.
    error NFT_INVALID_SUPPLY();
    /// @dev Thrown when trying to mint more tokens than the max allowed per transaction.
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param maxBatch the maximum amount that can be minted per transaction
    error NFT_MAX_BATCH(uint256 qtyRequested, uint256 maxBatch);
    /// @dev Thrown when trying to mint more tokens from the reserve than the amount left.
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param reserveLeft the amount of tokens left in the reserve
    error NFT_MAX_RESERVE(uint256 qtyRequested, uint256 reserveLeft);
    /// @dev Thrown when trying to mint more tokens than the amount left to be minted (except reserve).
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param remainingSupply the amount of tokens left in the reserve
    error NFT_MINTED_OUT(uint256 qtyRequested, uint256 remainingSupply);
    /// @dev Thrown when trying to call a non existant function.
    error UNKNOWN();
  // **************************************

  // **************************************
  // *****           EVENTS           *****
  // **************************************
    /// @dev Emitted when the sale state changes
    /// 
    /// @param previousState the previous state of the contract
    /// @param newState the new state of the contract
    event ContractStateChanged(uint8 indexed previousState, uint8 indexed newState);
  // **************************************
}
