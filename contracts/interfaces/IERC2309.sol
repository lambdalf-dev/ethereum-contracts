// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

abstract contract IERC2309 {
  /// @dev Emitted instead of {ERC721.Transfer} when several consecutive tokens are being transferred.
  /// @dev See EIP2309 https://eips.ethereum.org/EIPS/eip-2309
  /// 
  /// @param fromTokenId identifier of the first token being transferred
  /// @param toTokenId identifier of the last token being transferred
  /// @param fromAddress address tokens are being transferred from
  /// @param toAddress address tokens are being transferred to
  event ConsecutiveTransfer(
    uint256 indexed fromTokenId,
    uint256 toTokenId,
    address indexed fromAddress,
    address indexed toAddress
  );
}