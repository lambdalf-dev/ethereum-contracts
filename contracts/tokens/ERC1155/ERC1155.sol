// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../interfaces/IArrayErrors.sol';
import '../../interfaces/IERC1155Errors.sol';
import '../../interfaces/IERC1155.sol';
import '../../interfaces/IERC1155Receiver.sol';

/**
* @dev Implementation of https://eips.ethereum.org/EIPS/eip-1155[ERC1155] Semi-Fungible Token Standard.
*/
abstract contract ERC1155 is IERC1155Errors, IArrayErrors, IERC1155 {
	uint256 public constant DEFAULT_SERIES = 1;
	// List of valid series ID
	mapping( uint256 => bool ) internal _validSeries;
	// Mapping from series ID to valid
	mapping( uint256 => mapping( address => uint256 ) ) private _balances;
	// Mapping from owner to operator approvals
	mapping( address => mapping( address => bool ) ) private _operatorApprovals;

	// **************************************
	// *****          MODIFIER          *****
	// **************************************
		/**
		* @dev Ensures that `id_` is a valid series
		* 
		* @param id_ : the series id to validate 
		*/
		modifier isValidSeries( uint256 id_ ) {
			if ( ! _isValidSeries( id_ ) ) {
				revert IERC1155_NON_EXISTANT_TOKEN( id_ );
			}
			_;
		}
	// **************************************

	// **************************************
	// *****          INTERNAL          *****
	// **************************************
		/**
		* @dev Internal function that checks if the receiver address is a smart contract able to handle batches of IERC1155 tokens.
		*/
		function _doSafeBatchTransferAcceptanceCheck( address operator_, address from_, address to_, uint256[] memory ids_, uint256[] memory amounts_, bytes memory data_ ) private {
			uint256 _size_;
			assembly {
				_size_ := extcodesize( to_ )
			}
			if ( _size_ > 0 ) {
				try IERC1155Receiver( to_ ).onERC1155BatchReceived( operator_, from_, ids_, amounts_, data_ ) returns ( bytes4 response ) {
					if ( response != IERC1155Receiver.onERC1155BatchReceived.selector ) {
						revert IERC1155_REJECTED_TRANSFER();
					}
				}
				catch ( bytes memory reason ) {
					if ( reason.length == 0 ) {
						revert IERC1155_REJECTED_TRANSFER();
					}
					else {
						assembly {
							revert( add( 32, reason ), mload( reason ) )
						}
					}
				}
			}
		}

		/**
		* @dev Internal function that checks if the receiver address is a smart contract able to handle IERC1155 tokens.
		*/
		function _doSafeTransferAcceptanceCheck( address operator_, address from_, address to_, uint256 id_, uint256 amount_, bytes memory data_ ) private {
			uint256 _size_;
			assembly {
				_size_ := extcodesize( to_ )
			}
			if ( _size_ > 0 ) {
				try IERC1155Receiver( to_ ).onERC1155Received( operator_, from_, id_, amount_, data_ ) returns ( bytes4 response ) {
					if ( response != IERC1155Receiver.onERC1155Received.selector ) {
						revert IERC1155_REJECTED_TRANSFER();
					}
				}
				catch ( bytes memory reason ) {
					if ( reason.length == 0 ) {
						revert IERC1155_REJECTED_TRANSFER();
					}
					else {
						assembly {
							revert( add( 32, reason ), mload( reason ) )
						}
					}
				}
			}
		}

		/**
		* @dev Internal function that checks if `operator_` is allowed to handle tokens on behalf of `owner_`
		*/
		function _isApprovedOrOwner( address owner_, address operator_ ) internal view returns ( bool ) {
			return owner_ == operator_ ||
						 isApprovedForAll( owner_, operator_ );
		}

		/**
		* @dev Internal function that checks whether `id_` is an existing series.
		*/
		function _isValidSeries( uint256 id_ ) internal view returns ( bool ) {
			if ( _validSeries[ id_ ] ) {
				return true;
			}
			return false;
		}

		/**
		* @dev Internal function that mints `amount_` tokens from series `id_` into `account_`.
		*/
		function _mint( address account_, uint256 id_, uint256 amount_ ) internal isValidSeries( id_ ) {
			if ( account_ == address( 0 ) ) {
				revert IERC1155_INVALID_TRANSFER();
			}
			unchecked {
				_balances[ id_ ][ account_ ] += amount_;
			}
			emit TransferSingle( account_, address( 0 ), account_, id_, amount_ );
		}
	// **************************************

	// **************************************
	// *****           PUBLIC           *****
	// **************************************
		// ************
		// * IERC1155 *
		// ************
			/**
			* @notice Transfers `amounts_` amount(s) of `ids_` from the `from_` address to the `to_` address specified (with safety call).
			* 
			* @param from_     Source address
			* @param to_       Target address
			* @param ids_      IDs of each token type (order and length must match `amounts_` array)
			* @param amounts_  Transfer amounts per token type (order and length must match `ids_` array)
			* @param data_     Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `to_`
			* 
			* Requirements:
			* 
			* - Caller must be approved to manage the tokens being transferred out of the `from_` account (see "Approval" section of the standard).
			* - MUST revert if `to_` is the zero address.
			* - MUST revert if length of `ids_` is not the same as length of `amounts_`.
			* - MUST revert if any of the balance(s) of the holder(s) for token(s) in `ids_` is lower than the respective amount(s) in `amounts_` sent to the recipient.
			* - MUST revert on any other error.        
			* - MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
			* - Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_amounts[0] before ids_[1]/_amounts[1], etc).
			* - After the above conditions for the transfer(s) in the batch are met, this function MUST check if `to_` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `to_` and act appropriately (see "Safe Transfer Rules" section of the standard).                      
			*/
			function safeBatchTransferFrom( address from_, address to_, uint256[] calldata ids_, uint256[] calldata amounts_, bytes calldata data_ ) external override {
				if ( to_ == address( 0 ) ) {
					revert IERC1155_INVALID_TRANSFER();
				}

				uint256 _len_ = ids_.length;
				if ( amounts_.length != _len_ ) {
					revert ARRAY_LENGTH_MISMATCH();
				}

				address _operator_ = msg.sender;
				if ( ! _isApprovedOrOwner( from_, _operator_ ) ) {
					revert IERC1155_CALLER_NOT_APPROVED( from_, _operator_ );
				}

				for ( uint256 i; i < _len_; ) {
					if ( ! _isValidSeries( ids_[ i ] ) ) {
						revert IERC1155_NON_EXISTANT_TOKEN( ids_[ i ] );
					}
					uint256 _balance_ = _balances[ ids_[ i ] ][ from_ ];
					if ( _balance_ < amounts_[ i ] ) {
						revert IERC1155_INSUFFICIENT_BALANCE( from_, ids_[ i ], _balance_);
					}
					unchecked {
						_balances[ ids_[ i ] ][ from_ ] = _balance_ - amounts_[ i ];
					}
					_balances[ ids_[ i ] ][ to_ ] += amounts_[ i ];
					unchecked {
						++i;
					}
				}
				emit TransferBatch( _operator_, from_, to_, ids_, amounts_ );

				_doSafeBatchTransferAcceptanceCheck( _operator_, from_, to_, ids_, amounts_, data_ );
			}

			/**
			* @notice Transfers `amount_` amount of an `id_` from the `from_` address to the `to_` address specified (with safety call).
			* 
			* @param from_    Source address
			* @param to_      Target address
			* @param id_      ID of the token type
			* @param amount_  Transfer amount
			* @param data_    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `to_`
			* 
			* Requirements:
			* 
			* - Caller must be approved to manage the tokens being transferred out of the `from_` account (see "Approval" section of the standard).
			* - MUST revert if `to_` is the zero address.
			* - MUST revert if balance of holder for token type `id_` is lower than the `amount_` sent.
			* - MUST revert on any other error.
			* - MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
			* - After the above conditions are met, this function MUST check if `to_` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `to_` and act appropriately (see "Safe Transfer Rules" section of the standard).        
			*/
			function safeTransferFrom( address from_, address to_, uint256 id_, uint256 amount_, bytes calldata data_ ) external override isValidSeries( id_ ) {
				if ( to_ == address( 0 ) ) {
					revert IERC1155_INVALID_TRANSFER();
				}

				address _operator_ = msg.sender;
				if ( ! _isApprovedOrOwner( from_, _operator_ ) ) {
					revert IERC1155_CALLER_NOT_APPROVED( from_, _operator_ );
				}

				uint256 _balance_ = _balances[ id_ ][ from_ ];
				if ( _balance_ < amount_ ) {
					revert IERC1155_INSUFFICIENT_BALANCE( from_, id_, _balance_ );
				}
				unchecked {
					_balances[ id_ ][ from_ ] = _balance_ - amount_;
				}
				_balances[ id_ ][ to_ ] += amount_;
				emit TransferSingle( _operator_, from_, to_, id_, amount_ );

				_doSafeTransferAcceptanceCheck( _operator_, from_, to_, id_, amount_, data_ );
			}

			/**
			* @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
			* 
			* @param operator_  Address to add to the set of authorized operators
			* @param approved_  True if the operator is approved, false to revoke approval
			* 
			* Requirements:
			* 
			* - MUST emit the ApprovalForAll event on success.
			*/
			function setApprovalForAll( address operator_, bool approved_ ) external override {
				address _tokenOwner_ = msg.sender;
				if ( _tokenOwner_ == operator_ ) {
					revert IERC1155_INVALID_CALLER_APPROVAL();
				}

				_operatorApprovals[ _tokenOwner_ ][ operator_ ] = approved_;
				emit ApprovalForAll( _tokenOwner_, operator_, approved_ );
			}
		// ************
	// **************************************

	// **************************************
	// *****            VIEW            *****
	// **************************************
		// ************
		// * IERC1155 *
		// ************
			/**
			* @notice Get the balance of an account's tokens.
			* 
			* @param owner_  The address of the token holder
			* @param id_     ID of the token type
			* 
			* @return        The owner_'s balance of the token type requested
			*/
			function balanceOf( address owner_, uint256 id_ ) public view override isValidSeries( id_ ) returns ( uint256 ) {
				return _balances[ id_ ][ owner_ ];
			}

			/**
			* @notice Get the balance of multiple account/token pairs
			* 
			* @param owners_  The addresses of the token holders
			* @param ids_     ID of the token types
			* 
			* @return         The owners_' balance of the token types requested (i.e. balance for each (owner, id) pair)
			*/
			function balanceOfBatch( address[] calldata owners_, uint256[] calldata ids_ ) public view override returns ( uint256[] memory ) {
				uint256 _len_ = owners_.length;
				if ( _len_ != ids_.length ) {
					revert ARRAY_LENGTH_MISMATCH();
				}

				uint256[] memory _balances_ = new uint256[]( _len_ );
				while ( _len_ > 0 ) {
					unchecked {
						--_len_;
					}
					if ( ! _isValidSeries( ids_[ _len_ ] ) ) {
						revert IERC1155_NON_EXISTANT_TOKEN( ids_[ _len_ ] );
					}

					_balances_[ _len_ ] = _balances[ ids_[ _len_ ] ][ owners_[ _len_ ] ];
				}

				return _balances_;
			}

			/**
			* @notice Queries the approval status of an operator for a given owner.
			* 
			* @param owner_     The owner of the tokens
			* @param operator_  Address of authorized operator
			* 
			* @return           True if the operator is approved, false if not
			*/
			function isApprovedForAll( address owner_, address operator_ ) public view override returns ( bool ) {
				return _operatorApprovals[ owner_ ][ operator_ ];
			}
		// ************
	// **************************************
}
