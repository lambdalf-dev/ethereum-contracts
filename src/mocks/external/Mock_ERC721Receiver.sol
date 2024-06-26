// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { IERC721Receiver } from "../../../src/interfaces/IERC721Receiver.sol";

/* solhint-disable */
contract Mock_ERC721Receiver is IERC721Receiver {
  enum Error {
    None,
    RevertWithError,
    RevertWithMessage,
    RevertWithoutMessage,
    Panic
  }

  bytes4 private immutable _retval;
  Error private immutable _error;

  error ERC721ReceiverError();
  event Received(address operator, address from, uint256 tokenId, bytes data, uint256 gas);

  constructor(bytes4 retval, Error error) {
    _retval = retval;
    _error = error;
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes memory data
  ) public override returns (bytes4) {
    if (_error == Error.RevertWithError) {
      revert ERC721ReceiverError();
    }
    else if (_error == Error.RevertWithMessage) {
      revert("Mock_ERC721Receiver: reverting");
    }
    else if (_error == Error.RevertWithoutMessage) {
      revert();
    }
    else if (_error == Error.Panic) {
      uint256(0) / uint256(0);
    }
    emit Received(operator, from, tokenId, data, gasleft());
    return _retval;
  }
}
/* solhint-enable */
