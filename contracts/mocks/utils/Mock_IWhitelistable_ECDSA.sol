// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IWhitelistable_ECDSA.sol";

contract Mock_IWhitelistable_ECDSA is IWhitelistable_ECDSA {
	uint8 public constant WHITELIST_TYPE_2 = 2;

	constructor() {}

	function consumeWhitelist( uint8 whitelistType_, uint256 alloted_, Proof memory proof_, uint256 qty_ ) public isWhitelisted( msg.sender, whitelistType_, alloted_, proof_, qty_ ) {
		_consumeWhitelist( msg.sender, whitelistType_, qty_ );
	}

	function setWhitelist( address adminSigner_ ) public {
		_setWhitelist( adminSigner_ );
	}
}
