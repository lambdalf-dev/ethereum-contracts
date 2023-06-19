// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { IERC721 } from "../../interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../interfaces/IERC721Metadata.sol";
import { IERC165 } from "../../interfaces/IERC165.sol";
import { ERC721Batch } from "../../tokens/ERC721/ERC721Batch.sol";

/* solhint-disable */
contract Mock_ERC721Batch is ERC721Batch, IERC165 {
  constructor() ERC721Batch("NFT Collection", "NFT") {
    _setBaseUri("https://api.exemple.com/");
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

  function supportsInterface(bytes4 interfaceId_) public pure override returns (bool) {
    return 
      interfaceId_ == type(IERC721).interfaceId ||
      interfaceId_ == type(IERC721Enumerable).interfaceId ||
      interfaceId_ == type(IERC721Metadata).interfaceId ||
      interfaceId_ == type(IERC165).interfaceId;
  }
}
/* solhint-enable */
