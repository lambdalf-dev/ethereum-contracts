// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../interfaces/IERC1155.sol";
import "../../interfaces/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
* @dev Required interface of an ERC1155 compliant contract, as defined in the
* https://eips.ethereum.org/EIPS/eip-1155[EIP].
*/
abstract contract ERC1155BaseV1 is Context, IERC1155 {
	// Errors
	error IERC1155_APPROVE_CALLER();
	error IERC1155_CALLER_NOT_APPROVED();
	error IERC1155_NULL_ADDRESS_BALANCE();
	error IERC1155_NULL_ADDRESS_TRANSFER();
	error IERC1155_NON_ERC1155_RECEIVER();
	error IERC1155_ARRAY_LENGTH_MISMATCH();
	error IERC1155_INSUFFICIENT_BALANCE();

	// Mapping from token ID to account balances
	mapping( uint256 => mapping( address => uint256 ) ) private _balances;

	// Mapping from owner to operator approvals
	mapping( address => mapping( address => bool ) ) private _operatorApprovals;

	/**
	* @dev See {IERC1155-safeBatchTransferFrom}.
	*/
	function safeBatchTransferFrom( address from_, address to_, uint256[] calldata ids_, uint256[] calldata amounts_, bytes calldata data_ ) external virtual {
		if ( to_ == address( 0 ) ) {
			revert IERC1155_NULL_ADDRESS_TRANSFER();
		}
		_batchTransfer( msg.sender, from_, to_, ids_, amounts_, data_ );
	}

	/**
	* @dev See {IERC1155-safeTransferFrom}.
	*/
	function safeTransferFrom( address from_, address to_, uint256 id_, uint256 amount_, bytes calldata data_ ) external virtual {
		if ( to_ == address( 0 ) ) {
			revert IERC1155_NULL_ADDRESS_TRANSFER();
		}
		_transfer( msg.sender, from_, to_, id_, amount_, data_ );
	}

	/**
	* @dev See {IERC1155-setApprovalForAll}.
	*/
	function setApprovalForAll( address operator_, bool approved_ ) external virtual {
		if ( msg.sender == operator_ ) {
			revert IERC1155_APPROVE_CALLER();
		}
		_operatorApprovals[ msg.sender ][ operator_ ] = approved_;
		emit ApprovalForAll( msg.sender, operator_, approved_ );
	}

	/**
	* @dev See {IERC1155-balanceOf}.
	*/
	function balanceOf( address account_, uint256 id_ ) public view virtual returns ( uint256 ) {
		if ( account_ == address( 0 ) ) {
			revert IERC1155_NULL_ADDRESS_BALANCE();
		}
		return _balances[ id_ ][ account_ ];
	}

	/**
	* @dev See {IERC1155-balanceOfBatch}.
	*/
	function balanceOfBatch( address[] calldata accounts_, uint256[] calldata ids_ ) public view virtual returns ( uint256[] memory ) {
		uint256 _len_ = accounts_.length;
		if ( _len_ != ids_.length ) {
			revert IERC1155_ARRAY_LENGTH_MISMATCH();
		}

		uint256[] memory _balances_ = new uint256[]( _len_ );
		for ( uint256 i; i < _len_; i ++ ) {
			_balances_[ i ] = balanceOf( accounts_[ i ], ids_[ i ] );
		}
		return _balances_;
	}

	/**
	* @dev See {IERC1155-isApprovedForAll}.
	*/
	function isApprovedForAll( address account_, address operator_ ) public view virtual returns ( bool ) {
		return _operatorApprovals[ account_ ][ operator_ ];
	}

	/**
	* @dev See {IERC165-supportsInterface}.
	*/
	function supportsInterface( bytes4 interfaceId_ ) external view virtual override returns ( bool ) {
		return 
			interfaceId_ == type( IERC1155 ).interfaceId ||
			interfaceId_ == type( IERC165 ).interfaceId;
	}

	/**
	* @dev Removes `amount_` tokens of series `id_` from ``account_``'s balance.
	* 
	* Requirements: 
	* 
	* `account_` must own at least `amount_` tokens from series `id_`.
	*/
	function _removeFrom( address account_, uint256 id_, uint256 amount_ ) private {
		if ( _balances[ id_ ][ account_ ] < amount_ ) {
			revert IERC1155_INSUFFICIENT_BALANCE();
		}

		unchecked {
			_balances[ id_ ][ account_ ] -= amount_;
		}
	}

	/**
	* @dev Adds `amount_` tokens of series `id_` to ``to_``'s balance.
	*/
	function _transferTo( address to_, uint256 id_, uint256 amount_ ) private {
		_balances[ id_ ][ to_ ] += amount_;
	}

	/**
	* @dev Transfers `amount_` tokens of token type `id_` from `from_` to `to_`.
	*
	* Emits a {TransferSingle} event.
	*
	* Requirements:
	*
	* - `to` cannot be the zero address.
	* - If the caller is not `from_`, it must have been approved to spend ``from_``'s tokens via {setApprovalForAll}.
	* - `from_` must have a balance of tokens of type `id_` of at least `amount_`.
	* - If `to_` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
	* acceptance magic value.
	*/
	function _transfer( address operator_, address from_, address to_, uint256 id_, uint256 amount_, bytes memory data_ ) internal virtual {
		if ( from_ != address( 0 ) ) {
			if ( operator_ != from_ && ! isApprovedForAll( from_, operator_ ) ) {
				revert IERC1155_CALLER_NOT_APPROVED();
			}

			_removeFrom( from_, id_, amount_ );
		}

		if ( to_ != address( 0 ) ) {
			_transferTo( to_, id_, amount_ );

			if ( ! _checkOnERC1155Received( from_, to_, id_, amount_, data_ ) ) {
				revert IERC1155_NON_ERC1155_RECEIVER();
			}
		}

		emit TransferSingle( operator_, from_, to_, id_, amount_ );
	}

	/**
	* @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.
	*
	* Emits a {TransferBatch} event.
	*
	* Requirements:
	*
	* - `ids` and `amounts` must have the same length.
	* - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
	* acceptance magic value.
	*/
	function _batchTransfer( address operator_, address from_, address to_, uint256[] memory ids_, uint256[] memory amounts_, bytes memory data_ ) internal virtual {
		uint256 _len_ = amounts_.length;
		if ( _len_ != ids_.length ) {
			revert IERC1155_ARRAY_LENGTH_MISMATCH();
		}

		if ( from_ != address( 0 ) ) {
			if ( operator_ != from_ && ! isApprovedForAll( from_, operator_ ) ) {
				revert IERC1155_CALLER_NOT_APPROVED();
			}
		}

		if ( to_ != address( 0 ) && from_ != address( 0 ) ) {
			for ( uint256 i; i < _len_; i ++ ) {
				_removeFrom( from_, ids_[ i ], amounts_[ i ] );
				_transferTo( to_, ids_[ i ], amounts_[ i ] );
			}
		}
		else if ( from_ != address( 0 ) ) {
			for ( uint256 i; i < _len_; i ++ ) {
				_removeFrom( from_, ids_[ i ], amounts_[ i ] );
			}
		}
		else if ( to_ != address( 0 ) ) {
			for ( uint256 i; i < _len_; i ++ ) {
				_transferTo( to_, ids_[ i ], amounts_[ i ] );
			}
		}

		if ( to_ != address( 0 ) ) {
			if ( ! _checkOnERC1155BatchReceived( from_, to_, ids_, amounts_, data_ ) ) {
				revert IERC1155_NON_ERC1155_RECEIVER();
			}
		}

		emit TransferBatch( operator_, from_, to_, ids_, amounts_ );
	}

	/**
	* @dev Internal function to invoke {IERC1155Receiver-onERC1155Received} on a target address.
	* The call is not executed if the target address is not a contract.
	*
	* @param from_ address representing the previous owner of the given token ID
	* @param to_ target address that will receive the tokens
	* @param id_ uint256 ID of the series of tokens to be transferred
	* @param amount_ uint256 amount of tokens to be transferred
	* @param data_ bytes optional data to send along with the call
	* @return bool whether the call correctly returned the expected magic value
	*/
	function _checkOnERC1155Received( address from_, address to_, uint256 id_, uint256 amount_, bytes memory data_ ) internal returns ( bool ) {
		if ( _isContract( to_ ) ) {
			try IERC1155Receiver( to_ ).onERC1155Received( msg.sender, from_, id_, amount_, data_ ) returns ( bytes4 retval ) {
				return retval == IERC1155Receiver.onERC1155Received.selector;
			}
			catch ( bytes memory reason ) {
				if ( reason.length == 0 ) {
					revert IERC1155_NON_ERC1155_RECEIVER();
				}
				else {
					assembly {
						revert( add( 32, reason ), mload( reason ) )
					}
				}
			}
		}
		else {
			return true;
		}
	}

	/**
	* @dev Internal function to invoke {IERC1155Receiver-onERC1155BatchReceived} on a target address.
	* The call is not executed if the target address is not a contract.
	*
	* @param from_ address representing the previous owner of the given token ID
	* @param to_ target address that will receive the tokens
	* @param ids_ uint256[] IDs of the series of tokens to be transferred
	* @param amounts_ uint256[] amount of tokens to be transferred for each series
	* @param data_ bytes optional data to send along with the call
	* @return bool whether the call correctly returned the expected magic value
	*/
	function _checkOnERC1155BatchReceived( address from_, address to_, uint256[] memory ids_, uint256[] memory amounts_, bytes memory data_ ) internal returns ( bool ) {
		if ( _isContract( to_ ) ) {
			try IERC1155Receiver( to_ ).onERC1155BatchReceived( msg.sender, from_, ids_, amounts_, data_ ) returns ( bytes4 retval ) {
				return retval == IERC1155Receiver.onERC1155BatchReceived.selector;
			}
			catch ( bytes memory reason ) {
				if ( reason.length == 0 ) {
					revert IERC1155_NON_ERC1155_RECEIVER();
				}
				else {
					assembly {
						revert( add( 32, reason ), mload( reason ) )
					}
				}
			}
		}
		else {
			return true;
		}
	}

	/**
	* @dev Returns true if `account_` is a contract.
	*
	* [IMPORTANT]
	* ====
	* It is unsafe to assume that an address for which this function returns
	* false is an externally-owned account (EOA) and not a contract.
	*
	* Among others, `_isContract` will return false for the following
	* types of addresses:
	*
	*  - an externally-owned account
	*  - a contract in construction
	*  - an address where a contract will be created
	*  - an address where a contract lived, but was destroyed
	* ====
	*/
	function _isContract( address account_ ) internal view returns ( bool ) {
		// This method relies on extcodesize, which returns 0 for contracts in
		// construction, since the code is only stored at the end of the
		// constructor execution.

		uint256 _size_;
		assembly {
			_size_ := extcodesize( account_ )
		}
		return _size_ > 0;
	}
}
