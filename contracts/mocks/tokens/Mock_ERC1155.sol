// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.20;

import { IERC1155 } from "../../interfaces/IERC1155.sol";
import { IERC1155MetadataURI } from "../../interfaces/IERC1155MetadataURI.sol";
import { IERC165 } from "../../interfaces/IERC165.sol";
import { ERC1155 } from "../../tokens/ERC1155/ERC1155.sol";

/* solhint-disable */
contract Mock_ERC1155 is ERC1155, IERC165 {
  constructor() {
    _setBaseUri("https://api.exemple.com/");
  }

  function mint(uint256 id_, uint256 qty_) public {
    _mint(msg.sender, id_, qty_);
  }

  function createSeries(uint256 id_) public {
    _createSeries(id_);
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
        interfaceId_ == type(IERC1155).interfaceId ||
        interfaceId_ == type(IERC1155MetadataURI).interfaceId ||
        interfaceId_ == type(IERC165).interfaceId;
    }
  // ***********
}
/* solhint-enable */
