// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC2981 } from "../../../contracts/interfaces/IERC2981.sol";
import { IERC165 } from "../../../contracts/interfaces/IERC165.sol";
import { ERC2981 } from "../../../contracts/utils/ERC2981.sol";

/* solhint-disable */
contract Mock_ERC2981 is ERC2981, IERC165 {
	constructor(address royaltyRecipient_, uint96 royaltyRate_) ERC2981(royaltyRecipient_, royaltyRate_) {}

  function setRoyaltyInfo(address newRoyaltyRecipient_, uint96 newRoyaltyRate_) public {
    _setRoyaltyInfo(newRoyaltyRecipient_, newRoyaltyRate_);
  }

  function payRoyalties(uint256 tokenId_) public payable {
    (address _recipient_, uint256 _royaltyAmount_) = royaltyInfo(tokenId_, msg.value);
    (bool _success_,) = payable(_recipient_).call{ value: _royaltyAmount_ }("");
    require (_success_, "ETH Transfer fail");
  }

  function supportsInterface(bytes4 interfaceId_) public pure override returns (bool) {
    return 
      interfaceId_ == type(IERC2981).interfaceId ||
      interfaceId_ == type(IERC165).interfaceId;
  }
}
/* solhint-enable */
