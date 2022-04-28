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
abstract contract ERC1155Base is Context, IERC1155 {
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
	* @dev Ensures `operator_` is allowed to handle tokens on behalf of `account_`
	* 
	* @param operator_ address that tries to handle the tokens
	* @param account_ address that owns the tokens
	*/
	modifier isApprovedOrOwner( address account_, address operator_ ) {
		if ( ! _isApprovedOrOwner( operator_, account_ ) ) {
			revert IERC1155_CALLER_NOT_APPROVED();
		}
		_;
	}

	/**
	* @dev See {IERC1155-safeBatchTransferFrom}.
	*/
	function safeBatchTransferFrom( address from_, address to_, uint256[] calldata ids_, uint256[] calldata amounts_, bytes calldata data_ ) external virtual {
		if ( to_ == address( 0 ) ) {
			revert IERC1155_NULL_ADDRESS_TRANSFER();
		}

		uint256 _len_ = amounts_.length;
		if ( _len_ != ids_.length ) {
			revert IERC1155_ARRAY_LENGTH_MISMATCH();
		}

		address _operator_ = _msgSender();
		if ( _operator_ != from_ && ! isApprovedForAll( from_, _operator_ ) ) {
			revert IERC1155_CALLER_NOT_APPROVED();
		}

		for ( uint256 i; i < _len_; i ++ ) {
			if ( _balances[ ids_[ i ] ][ from_ ] < amounts_[ i ] ) {
				revert IERC1155_INSUFFICIENT_BALANCE();
			}

			unchecked {
				_balances[ ids_[ i ] ][ from_ ] -= amounts_[ i ];
			}

			_balances[ ids_[ i ] ][ to_ ] += amounts_[ i ];
		}

		if ( ! _checkOnERC1155BatchReceived( from_, to_, ids_, amounts_, data_ ) ) {
			revert IERC1155_NON_ERC1155_RECEIVER();
		}

		emit TransferBatch( _operator_, from_, to_, ids_, amounts_ );
	}

	/**
	* @dev See {IERC1155-safeTransferFrom}.
	*/
	function safeTransferFrom( address from_, address to_, uint256 id_, uint256 amount_, bytes calldata data_ ) external virtual {
		if ( to_ == address( 0 ) ) {
			revert IERC1155_NULL_ADDRESS_TRANSFER();
		}

		address _operator_ = _msgSender();
		if ( _operator_ != from_ && ! isApprovedForAll( from_, _operator_ ) ) {
			revert IERC1155_CALLER_NOT_APPROVED();
		}

		if ( _balances[ id_ ][ from_ ] < amount_ ) {
			revert IERC1155_INSUFFICIENT_BALANCE();
		}

		unchecked {
			_balances[ id_ ][ from_ ] -= amount_;
		}

		_balances[ id_ ][ to_ ] += amount_;

		if ( ! _checkOnERC1155Received( from_, to_, id_, amount_, data_ ) ) {
			revert IERC1155_NON_ERC1155_RECEIVER();
		}

		emit TransferSingle( _operator_, from_, to_, id_, amount_ );
	}

	/**
	* @dev See {IERC1155-setApprovalForAll}.
	*/
	function setApprovalForAll( address operator_, bool approved_ ) external virtual {
		if ( _msgSender() == operator_ ) {
			revert IERC1155_APPROVE_CALLER();
		}
		_operatorApprovals[ _msgSender() ][ operator_ ] = approved_;
		emit ApprovalForAll( _msgSender(), operator_, approved_ );
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
		// This method relies on extcodesize, which returns 0 for contracts in
		// construction, since the code is only stored at the end of the
		// constructor execution.
		// 
		// IMPORTANT
		// It is unsafe to assume that an address not flagged by this method
		// is an externally-owned account (EOA) and not a contract.
		//
		// Among others, the following types of addresses will not be flagged:
		//
		//  - an externally-owned account
		//  - a contract in construction
		//  - an address where a contract will be created
		//  - an address where a contract lived, but was destroyed
		uint256 _size_;
		assembly {
			_size_ := extcodesize( to_ )
		}

		// If address is a contract, check that it is aware of how to handle ERC721 tokens
		if ( _size_ > 0 ) {
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
		// This method relies on extcodesize, which returns 0 for contracts in
		// construction, since the code is only stored at the end of the
		// constructor execution.
		// 
		// IMPORTANT
		// It is unsafe to assume that an address not flagged by this method
		// is an externally-owned account (EOA) and not a contract.
		//
		// Among others, the following types of addresses will not be flagged:
		//
		//  - an externally-owned account
		//  - a contract in construction
		//  - an address where a contract will be created
		//  - an address where a contract lived, but was destroyed
		uint256 _size_;
		assembly {
			_size_ := extcodesize( to_ )
		}

		// If address is a contract, check that it is aware of how to handle ERC721 tokens
		if ( _size_ > 0 ) {
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
	* @dev Internal function returning whether `operator_` is allowed to handle tokens on behalf of `owner_`
	* 
	* @param operator_ address that tries to handle the tokens
	* @param account_ address that owns the tokens
	* 
	* @return bool whether `operator_` is allowed to handle the tokens
	*/
	function _isApprovedOrOwner( address account_, address operator_ ) internal virtual view returns ( bool ) {
		bool _isApproved_ = operator_ == account_ || 
												isApprovedForAll( account_, operator_ );
 		return _isApproved_;
	}

	/**
	* @dev See {IERC1155-balanceOf}.
	*/
	function balanceOf( address account_, uint256 id_ ) public view virtual returns ( uint256 ) {
	}

	/**
	* @dev See {IERC1155-balanceOfBatch}.
	*/
	function balanceOfBatch( address[] calldata accounts_, uint256[] calldata ids_ ) public view virtual returns ( uint256[] memory ) {
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
}
