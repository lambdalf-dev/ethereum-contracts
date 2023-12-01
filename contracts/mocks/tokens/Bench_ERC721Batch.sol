// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC721 } from "../../../contracts/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../contracts/interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../../contracts/interfaces/IERC721Metadata.sol";
import { IERC165 } from "../../../contracts/interfaces/IERC165.sol";
import { ERC721Batch } from "../../../contracts/tokens/ERC721/ERC721Batch.sol";

/* solhint-disable */
contract Bench_ERC721Batch is ERC721Batch, IERC165 {
  constructor() ERC721Batch("NFT Collection", "NFT") {}

  function mint1() external {
    _mint(msg.sender, 1);
  }

  function mint2() external {
    _mint(msg.sender, 2);
  }

  function mint3() external {
    _mint(msg.sender, 3);
  }

  function mint5() external {
    _mint(msg.sender, 5);
  }

  function mint10() external {
    _mint(msg.sender, 10);
  }

  function mint20() external {
    _mint(msg.sender, 20);
  }

  function mint50() external {
    _mint(msg.sender, 50);
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
