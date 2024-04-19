// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC721 } from "../../../src/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../src/interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../../src/interfaces/IERC721Metadata.sol";
import { IERC165 } from "../../../src/interfaces/IERC165.sol";
import { ERC721Batch } from "../../../src/tokens/ERC721/ERC721Batch.sol";

/* solhint-disable */
contract Mock_ERC721Batch is ERC721Batch, IERC165 {
  constructor() ERC721Batch("NFT Collection", "NFT") {
    _setBaseUri("https://api.example.com/");
  }

  function mint(uint256 qty_) external {
    _mint(msg.sender, qty_);
  }

  function mint2309(uint256 qty_) external {
    _mint2309(msg.sender, qty_);
  }

  function setBaseUri(string memory newBaseUri_) public {
    _setBaseUri(newBaseUri_);
  }

  function exist(uint256 tokenId_) public returns (bool) {
    return _exists(tokenId_);
  }

  function supportsInterface(bytes4 interfaceId_) public pure override returns (bool) {
    return 
      interfaceId_ == type(IERC721).interfaceId ||
      interfaceId_ == type(IERC721Enumerable).interfaceId ||
      interfaceId_ == type(IERC721Metadata).interfaceId ||
      interfaceId_ == type(IERC165).interfaceId;
  }
}
/* solhint-enable */
