// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/Whitelist_Merkle.sol";

contract Mock_Whitelist_Merkle is Whitelist_Merkle {
	constructor() {}

	function consumeWhitelist( bytes32[] memory proof_ ) public isWhitelisted( msg.sender, proof_, 1, 1 ) {
		_consumeWhitelist( msg.sender/*, 1*/ );
	}

	function setWhitelist( bytes32 root_ ) public {
		_setWhitelist( root_ );
	}
}
