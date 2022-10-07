// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../templates/NFT721.sol";

contract Mock_NFT721 is NFT721 {
  constructor(
    address treasury_,
    uint256 maxSupply_,
    uint256 reserve_,
    uint256 royaltyRate_,
    uint256 maxBatch_,
    uint256 publicSalePrice_,
    uint256 privateSalePrice_,
    string memory name_,
    string memory symbol_
  ) {
    _config = Config(
      maxBatch_,
      publicSalePrice_,
      privateSalePrice_,
      name_,
      symbol_
    );
  	__init_NFT721( treasury_, maxSupply_, reserve_, royaltyRate_, _config )
    _setOwner( msg.sender );
  }
}
