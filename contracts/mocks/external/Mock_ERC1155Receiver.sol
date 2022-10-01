// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts/interfaces/IERC1155Receiver.sol";

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

    constructor( bytes4 retval, Error error ) {
        _retval = retval;
        _error = error;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override returns ( bytes4 ) {
        if ( _error == Error.RevertWithError ) {
            revert ERC1155ReceiverError();
        }
        else if ( _error == Error.RevertWithMessage ) {
            revert( "Mock_ERC1155Receiver: reverting" );
        }
        else if ( _error == Error.RevertWithoutMessage ) {
            revert();
        }
        else if ( _error == Error.Panic ) {
            uint256( 0 ) / uint256( 0 );
        }
        return _retval;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override returns ( bytes4 ) {
        if ( _error == Error.RevertWithError ) {
            revert ERC1155ReceiverError();
        }
        else if ( _error == Error.RevertWithMessage ) {
            revert( "Mock_ERC1155Receiver: reverting" );
        }
        else if ( _error == Error.RevertWithoutMessage ) {
            revert();
        }
        else if ( _error == Error.Panic ) {
            uint256( 0 ) / uint256( 0 );
        }
        return _retval;
    }

    function supportsInterface( bytes4 interfaceId_ ) external view override returns ( bool ) {
        return interfaceId_ == type( IERC165 ).interfaceId ||
               interfaceId_ == type( IERC1155Receiver ).interfaceId;
    }
}
