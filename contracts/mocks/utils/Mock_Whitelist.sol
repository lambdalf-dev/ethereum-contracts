// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { Whitelist } from "../../utils/Whitelist.sol";

/* solhint-disable */
contract Mock_Whitelist is Whitelist {
	constructor() {}

  function setWhitelist(address newAdminSigner_) public {
    _setWhitelist(newAdminSigner_);
  }

  function consumeWhitelist(address account_, uint8 whitelistId_, uint256 qty_, uint256 alloted_, Proof calldata proof_) public {
    uint256 _allocation_ = checkWhitelistAllowance(account_, whitelistId_, alloted_, proof_);
    if (_allocation_ < qty_) {
      revert WHITELIST_FORBIDDEN(account_);
    }
    _consumeWhitelist(account_, whitelistId_, qty_);
  }
}
/* solhint-enable */
