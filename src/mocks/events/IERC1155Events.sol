// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

interface IERC1155Events {
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
  event URI(string value, uint256 indexed id);
  event TransferBatch(
    address indexed operator,
    address indexed from,
    address indexed to,
    uint256[] ids,
    uint256[] values
  );
  event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
}
