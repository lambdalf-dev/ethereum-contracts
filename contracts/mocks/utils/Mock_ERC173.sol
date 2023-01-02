// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import '../../utils/ERC173.sol';

contract Mock_ERC173 is ERC173 {
	constructor() {
		_setOwner( msg.sender );
	}
}
