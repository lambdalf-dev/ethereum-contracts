// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../utils/IWhitelistable_ECDSA.sol";

contract Mock_IWhitelistable_ECDSA is IWhitelistable_ECDSA {
	constructor() {}

	function checkWhitelistAllowance( address account_, uint256 alloted_, Proof memory proof_ ) public view returns ( uint256 ) {
		return _checkWhitelistAllowance( account_, alloted_, proof_ );
	}

	function consumeWhitelist( uint256 qty_, uint256 alloted_, Proof memory proof_ ) public isWhitelisted( msg.sender, qty_, alloted_, proof_ ) {
		_consumeWhitelist( msg.sender, qty_ );
	}

	function setWhitelist( address adminSigner_ ) public {
		_setWhitelist( adminSigner_ );
	}
}
