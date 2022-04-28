// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../interfaces/IERC1155Receiver.sol";

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

	event Received(
		address operator,
		address from,
		uint256 id,
		uint256 value,
		bytes data,
		uint256 gas
	);
	event BatchReceived(
		address operator,
		address from,
		uint256[] ids,
		uint256[] values,
		bytes data,
		uint256 gas
	);

	constructor( bytes4 retval, Error error ) {
		_retval = retval;
		_error = error;
	}

	function onERC1155Received(
		address operator,
		address from,
		uint256 id,
		uint256 value,
		bytes calldata data
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
		emit Received( operator, from, id, value, data, gasleft() );
		return _retval;
	}

	function onERC1155BatchReceived(
		address operator,
		address from,
		uint256[] calldata ids,
		uint256[] calldata values,
		bytes calldata data
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
		emit BatchReceived( operator, from, ids, values, data, gasleft() );
		return _retval;
	}
}
