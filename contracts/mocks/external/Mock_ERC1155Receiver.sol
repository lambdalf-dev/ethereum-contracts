// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { IERC1155Receiver } from "../../interfaces/IERC1155Receiver.sol";

/* solhint-disable */
contract Mock_ERC1155Receiver is IERC1155Receiver {
  enum Error {
    None,
    RevertWithError,
    RevertWithMessage,
    RevertWithoutMessage,
    Panic
  }

  bytes4 private immutable _retval;
  Error private immutable _error;
  error ERC1155ReceiverError();

  constructor(bytes4 retval, Error error) {
    _retval = retval;
    _error = error;
  }

  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) public override returns (bytes4) {
    if (_error == Error.RevertWithError) {
      revert ERC1155ReceiverError();
    }
    else if (_error == Error.RevertWithMessage) {
      revert("Mock_ERC1155Receiver: reverting");
    }
    else if (_error == Error.RevertWithoutMessage) {
      revert();
    }
    else if (_error == Error.Panic) {
      uint256(0) / uint256(0);
    }
    return _retval;
  }

  function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes memory
  ) public override returns (bytes4) {
    if (_error == Error.RevertWithError) {
      revert ERC1155ReceiverError();
    }
    else if (_error == Error.RevertWithMessage) {
      revert("Mock_ERC1155Receiver: reverting");
    }
    else if (_error == Error.RevertWithoutMessage) {
      revert();
    }
    else if (_error == Error.Panic) {
      uint256(0) / uint256(0);
    }
    return _retval;
  }
}
/* solhint-enable */
