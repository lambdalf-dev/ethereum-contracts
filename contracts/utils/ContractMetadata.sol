// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

abstract contract ContractMetadata {
	// The URI of the contract metadata for Open Sea
	// See https://docs.opensea.io/docs/contract-level-metadata
	string public contractURI;

	/**
	* @dev Initializes the contract metadata.
	*/
	function _setContractURI( string memory url_ ) internal {
		contractURI = url_;
	}
}
