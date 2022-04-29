// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IMerkleWhitelistable.sol";

contract Mock_IMerkleWhitelistable is IMerkleWhitelistable {
	constructor() {}

	function checkWhitelistAllowance( address account_, bytes32[] memory proof_ ) public view returns ( uint256 ) {
		return _checkWhitelistAllowance( account_, proof_/*, 1*/ );
	}

	function consumeWhitelist( bytes32[] memory proof_ ) public {
		_consumeWhitelist( msg.sender/*, 1*/ );
	}

	function setWhitelist( bytes32 root_ ) public {
		_setWhitelist( root_ );
	}

	function isAccountWhitelisted( address account_, bytes32[] memory proof_ ) public view isWhitelisted( account_, proof_, 1, 1 ) returns ( bool ) {
		return true;
	}
}
