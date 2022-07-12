// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IWhitelistable_ECDSA.sol";

contract Mock_IWhitelistable_ECDSA is IWhitelistable_ECDSA {
	constructor() {}

	function checkWhitelistAllowance( address account_, uint256 alloted_, Proof memory proof_ ) public view returns ( uint256 ) {
		return _checkWhitelistAllowance( account_, DEFAULT_WHITELIST, alloted_, proof_ );
	}

	function consumeWhitelist( uint256 alloted_, Proof memory proof_, uint256 qty_ ) public isWhitelisted( msg.sender, DEFAULT_WHITELIST, alloted_, proof_, qty_ ) {
		_consumeWhitelist( msg.sender, DEFAULT_WHITELIST, qty_ );
	}

	function setWhitelist( address adminSigner_ ) public {
		_setWhitelist( adminSigner_ );
	}
}
