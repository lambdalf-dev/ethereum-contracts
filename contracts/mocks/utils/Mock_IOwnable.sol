// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "../../utils/IOwnable.sol";

contract Mock_IOwnable is IOwnable {
	constructor() {
		_initIOwnable( _msgSender() );
	}
}
