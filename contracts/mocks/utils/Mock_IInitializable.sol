// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../../utils/IInitializable.sol";

contract Mock_IInitializable is IInitializable {
	constructor() {
		initialize();
	}

	function initialize() public initializer {}
}
