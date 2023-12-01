// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC721 } from "../../../contracts/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../contracts/interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../../contracts/interfaces/IERC721Metadata.sol";
import { IERC165 } from "../../../contracts/interfaces/IERC165.sol";
import { ERC721Batch } from "../../../contracts/tokens/ERC721/ERC721Batch.sol";
import { ERC721BatchBurnable } from "../../../contracts/tokens/ERC721/extensions/ERC721BatchBurnable.sol";

/* solhint-disable */
contract Mock_ERC721BatchBurnable is ERC721BatchBurnable, IERC165 {
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

  // ***********
  // * IERC165 *
  // ***********
    /**
    * @notice Query if a contract implements an interface.
    * @dev see https://eips.ethereum.org/EIPS/eip-165
    * 
    * @param interfaceId_ : the interface identifier, as specified in ERC-165
    * 
    * @return bool : true if the contract implements the specified interface, false otherwise
    * 
    * Requirements:
    * 
    * - This function must use less than 30,000 gas.
    */
    function supportsInterface(bytes4 interfaceId_) public pure virtual override returns (bool) {
      return 
      interfaceId_ == type(IERC721).interfaceId ||
      interfaceId_ == type(IERC721Enumerable).interfaceId ||
      interfaceId_ == type(IERC721Metadata).interfaceId ||
      interfaceId_ == type(IERC165).interfaceId;
    }
  // ***********
}
