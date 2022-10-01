// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/ContractMetadata.sol";

contract Mock_ContractMetadata is ContractMetadata {
	constructor( string memory contractURI_ ) {
		_setContractURI( contractURI_ );
	}

	function setContractURI( string memory url_ ) public {
		_setContractURI( url_ );
	}
}
