// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

interface IERC721Events {
  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
}
