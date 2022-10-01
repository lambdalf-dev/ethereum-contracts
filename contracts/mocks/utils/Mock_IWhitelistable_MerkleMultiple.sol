// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../utils/IWhitelistable_MerkleMultiple.sol";

contract Mock_IWhitelistable_MerkleMultiple is IWhitelistable_MerkleMultiple {
	constructor() {}

	function checkWhitelistAllowance( address account_, bytes32[] memory proof_, uint256 whitelistId_ ) public view returns ( uint256 ) {
		return _checkWhitelistAllowance( account_, proof_, whitelistId_ );
	}

	function consumeWhitelist( bytes32[] memory proof_, uint256 qty_, uint256 whitelistId_ ) public isWhitelisted( msg.sender, proof_, qty_, whitelistId_ ) {
		_consumeWhitelist( msg.sender, qty_, whitelistId_ );
	}

	function setWhitelist( bytes32 root_, uint256 passMax_, uint256 whitelistId_ ) public {
		_setWhitelist( root_, passMax_, whitelistId_ );
	}
}
