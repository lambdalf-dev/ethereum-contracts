// SPDX-License-Identifier: MIT

/**
* Team: Asteria Labs
* Author: Lambdalf the White
*/

pragma solidity >=0.8.4 <0.9.0;

interface ITemplate {
  // **************************************
  // *****           ERRORS           *****
  // **************************************
    /// @dev Thrown when a function is called with the wrong contract state.
    error CONTRACT_STATE_INCORRECT();
    /// @dev Thrown when trying to set the contract state to an invalid value.
    error CONTRACT_STATE_INVALID();
    /// @dev Thrown when an incorrect amount of eth is being sent for a payable operation.
    error ETHER_INCORRECT_PRICE();
    /// @dev Thrown when trying to withdraw from the contract with no balance.
    error ETHER_NO_BALANCE();
    /// @dev Thrown when contract fails to send ether to recipient.
    error ETHER_TRANSFER_FAIL();
    /// @dev Thrown when trying to mint 0 token.
    error NFT_INVALID_QTY();
    /// @dev Thrown when trying to set reserve to an invalid amount.
    error NFT_INVALID_RESERVE();
    /// @dev Thrown when trying to set max supply to an invalid amount.
    error NFT_INVALID_SUPPLY();
    /// @dev Thrown when trying to mint more tokens than the max allowed per transaction.
    error NFT_MAX_BATCH();
    /// @dev Thrown when trying to mint more tokens from the reserve than the amount left.
    error NFT_MAX_RESERVE();
    /// @dev Thrown when trying to mint more tokens than the amount left to be minted (except reserve).
    error NFT_MINTED_OUT();
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
