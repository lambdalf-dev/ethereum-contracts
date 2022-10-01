// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

abstract contract IERC2309 {
  /**
  * @dev See EIP2309 https://eips.ethereum.org/EIPS/eip-2309
  */
  event ConsecutiveTransfer(uint256 indexed fromTokenId, uint256 toTokenId, address indexed fromAddress, address indexed toAddress);
}