// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

/* solhint-disable */
abstract contract UnkownContract {
	function unknownFunction() external virtual;
}

contract Mock_UnknownCaller {
	UnkownContract internal _contract;

	constructor ( address contract_ ) {
		_contract = UnkownContract( contract_ );
	}

	function callUnknown() external {
		_contract.unknownFunction();
	}
}
/* solhint-enable */
