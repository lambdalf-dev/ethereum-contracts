// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../../utils/IOwnable.sol";

contract Mock_IOwnable is IOwnable {
	constructor() {
		_initIOwnable( msg.sender );
	}
}
