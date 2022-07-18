// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../NFT/NFTFree.sol";

contract Mock_NFTFree is NFTFree {
	constructor (
		uint256 reserve_,
		uint256 maxBatch_,
		uint256 maxSupply_,
		uint256 royaltyRate_,
		string memory name_,
		string memory symbol_,
		string memory baseURI_
	) {
		_initNFTFree (
			reserve_,
			maxBatch_,
			maxSupply_,
			royaltyRate_,
			name_,
			symbol_,
			baseURI_
		);
	}
}
