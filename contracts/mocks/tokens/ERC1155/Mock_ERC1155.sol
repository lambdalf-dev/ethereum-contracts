// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../tokens/ERC1155/ERC1155.sol";
import "../../../interfaces/IERC165.sol";

contract Mock_ERC1155 is ERC1155, IERC165 {
  constructor() {
    _validSeries[ DEFAULT_SERIES ] = true;
  }

  function mint(address toAddress_, uint256 id_, uint256 qty_) public {
    _mint(toAddress_, id_, qty_);
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
        interfaceId_ == type(IERC165).interfaceId;
    }
  // ***********
}
