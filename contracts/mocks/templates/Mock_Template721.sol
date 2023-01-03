// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../templates/Template721.sol";
import "../../interfaces/IERC165.sol";

contract Mock_Template721 is Template721, IERC165 {
  constructor(
    uint256 maxBatch_,
    uint256 maxSupply_,
    uint256 reserve_,
    uint256 privateSalePrice_,
    uint256 publicSalePrice_,
    uint256 royaltyRate_,
    address royaltyRecipient_,
    address treasury_,
    string memory collectionName_,
    string memory collectionSymbol_
  )
  UpdatableOperatorFilterer(
    DEFAULT_OPERATOR_FILTER_REGISTRY,
    DEFAULT_SUBSCRIPTION,
    true
  ) {
    __init_Template721(
      maxBatch_,
      maxSupply_,
      reserve_,
      privateSalePrice_,
      publicSalePrice_,
      royaltyRate_,
      royaltyRecipient_,
      treasury_,
      collectionName_,
      collectionSymbol_
    );
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
    function supportsInterface(bytes4 interfaceId_) public pure override returns (bool) {
      return 
        interfaceId_ == type(IERC721).interfaceId ||
        interfaceId_ == type(IERC721Enumerable).interfaceId ||
        interfaceId_ == type(IERC721Metadata).interfaceId ||
        interfaceId_ == type(IERC173).interfaceId ||
        interfaceId_ == type(IERC165).interfaceId ||
        interfaceId_ == type(IERC2981).interfaceId;
    }
  // ***********
}
