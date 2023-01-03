// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC721/extensions/ERC721BatchMetadata.sol";
import "../../../interfaces/IERC165.sol";

contract Mock_ERC721BatchMetadata is ERC721BatchMetadata, IERC165 {
  constructor() {
    __init_ERC721Metadata("NFT Collection", "NFT");
    _baseUri = "https://api.exemple.com/";
  }

  function mint(address to_, uint256 qty_) public {
    _mint(to_, qty_);
  }

  function mint2309(address to_, uint256 qty_) public {
    _mint2309(to_, qty_);
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
        interfaceId_ == type(IERC721Metadata).interfaceId ||
        interfaceId_ == type(IERC721).interfaceId ||
        interfaceId_ == type(IERC165).interfaceId;
    }
  // ***********
}
