// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC173 } from "../../../contracts/interfaces/IERC173.sol";
import { IERC165 } from "../../../contracts/interfaces/IERC165.sol";
import { ERC173 } from "../../../contracts/utils/ERC173.sol";

/* solhint-disable */
contract Mock_ERC173 is ERC173, IERC165 {
	constructor() ERC173(msg.sender) {}

  function supportsInterface(bytes4 interfaceId_) public pure override returns (bool) {
    return 
      interfaceId_ == type(IERC173).interfaceId ||
      interfaceId_ == type(IERC165).interfaceId;
  }
}
/* solhint-enable */
