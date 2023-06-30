// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TestHelper} from "./TestHelper.sol";
import {IWhitelist} from "../../../contracts/interfaces/IWhitelist.sol";

contract Behavior_Whitelist is TestHelper {
	function createProof(uint8 whitelistId, uint256 allotted, address account, Wallet memory signer) internal pure returns(IWhitelist.Proof memory proof) {
		(uint8 v, bytes32 r, bytes32 s) = vm.sign(
			uint256(signer.privateKey),
			keccak256(abi.encode(whitelistId, allotted, account))
		);
		return IWhitelist.Proof(r, s, v);
	}
  // REVERTS
  function revertWhenWhitelistNotSet(address callee, bytes memory signature) internal {
    vm.expectRevert(IWhitelist.WHITELIST_NOT_SET.selector);
    (bool success,) = callee.call(signature);
  }
  function revertWhenWhitelistNotSet(address callee, bytes memory signature, uint256 valueSent) internal {
    vm.expectRevert(IWhitelist.WHITELIST_NOT_SET.selector);
    (bool success,) = callee.call{value:valueSent}(signature);
  }
  function revertWhenNotWhitelisted(address callee, bytes memory signature, address account) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IWhitelist.WHITELIST_FORBIDDEN.selector,
        account
      )
    );
    (bool success,) = callee.call(signature);
  }
  function revertWhenNotWhitelisted(address callee, bytes memory signature, address account, uint256 valueSent) internal {
    vm.expectRevert(
      abi.encodeWithSelector(
        IWhitelist.WHITELIST_FORBIDDEN.selector,
        account
      )
    );
    (bool success,) = callee.call{value:valueSent}(signature);
  }
}
