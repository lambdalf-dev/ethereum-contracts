// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../../interfaces/IERC20.sol";

abstract contract ERC20Base is IERC20 {
	// Errors
	error IERC20_NULL_ADDRESS_TRANSFER();
	error IERC20_NULL_ADDRESS_OWNER();
	error IERC20_NULL_ADDRESS_MINT();
	error IERC20_INSUFFICIENT_BALANCE();
	error IERC20_CALLER_NOT_ALLOWED();
	error IERC20_ARRAY_LENGTH_MISMATCH();
	error IERC20_APPROVE_OWNER();

	uint256 private _totalSupply;
	mapping(address => uint256) private _balances;
	mapping(address => mapping(address => uint256)) private _allowances;

	/**
	* @dev See {IERC20-totalSupply}.
	*/
	function totalSupply() public view virtual override returns ( uint256 ) {
		return _totalSupply;
	}

	/**
	* @dev See {IERC20-balanceOf}.
	*/
	function balanceOf( address account_ ) public view virtual override returns ( uint256 ) {
		return _balances[ account_ ];
	}

	/**
	* @dev See {IERC20-transfer}.
	* 
	* Requirements:
	* 
	* - `recipient_` cannot be the null address.
	*/
	function transfer( address recipient_, uint256 amount_ ) public virtual override returns ( bool ) {
		if ( recipient_ == address( 0 ) ) {
			revert IERC20_NULL_ADDRESS_TRANSFER();
		}
		_transferFrom( msg.sender, recipient_, amount_ );
		return true;
	}

	/**
	* @dev See {IERC20-allowance}.
	*/
	function allowance( address owner_, address spender_ ) public view virtual override returns ( uint256 ) {
		if ( owner_ == address( 0 ) ) {
			revert IERC20_NULL_ADDRESS_OWNER();
		}

		return _allowances[ owner_ ][ spender_ ];
	}

	/**
	* @dev See {IERC20-approve}.
	*/
	function approve( address spender_, uint256 amount_ ) public virtual override returns ( bool ) {
		_approve( msg.sender, spender_, amount_ );
		return true;
	}

	/**
	* @dev See {IERC20-transferFrom}.
	* 
	* Requirements:
	* 
	* - `recipient_` cannot be the null address.
	* - Sender must be allowed to spend at least `amount_` on behalf of `owner_`.
	*/
	function transferFrom( address owner_, address recipient_, uint256 amount_ ) public virtual override returns ( bool ) {
		if ( allowance( owner_, msg.sender ) < amount_ ) {
			revert IERC20_CALLER_NOT_ALLOWED();
		}
		if ( recipient_ == address( 0 ) ) {
			revert IERC20_NULL_ADDRESS_TRANSFER();
		}

		unchecked {
			_allowances[ owner_ ][ msg.sender ] -= amount_;
		}
		_transferFrom( owner_, recipient_, amount_ );
		return true;
	}

	/**
	* @dev Approves `spender_` to spend `amount_` on the behalf of `owner_`.
	* 
	* See {IERC20-approve}.
	*/
	function _approve( address owner_, address spender_, uint256 amount_ ) internal virtual {
		if ( owner_ == spender_ ) {
			revert IERC20_APPROVE_OWNER();
		}
		_allowances[ owner_ ][ spender_ ] = amount_;
		emit Approval( owner_, spender_, amount_ );
	}

	/**
	* @dev Transfers `amount_` to `recipient_`.
	* 
	* See {IERC20-transfer}
	*/
	function _transfer( address recipient_, uint256 amount_ ) internal virtual {
		_balances[ recipient_ ] += amount_;
	}

	/**
	* @dev Transfers `amount_` from `owner_` to `recipient_`.
	* 
	* Emits a {Transfer} event with `from` set to `owner_` and `to` set to `recipient_`.
	* 
	* Requirements:
	* 
	* - `owner_` must have at least `amount_` tokens.
	*/
	function _transferFrom( address owner_, address recipient_, uint256 amount_ ) internal virtual {
		if ( _balances[ owner_ ] < amount_ ) {
			revert IERC20_INSUFFICIENT_BALANCE();
		}
		unchecked {
			_balances[ owner_ ] -= amount_;
		}
		if ( recipient_ != address( 0 ) ) {
			_transfer( recipient_, amount_ );
		}
		else {
			unchecked {
				_totalSupply -= amount_;
			}
		}
		emit Transfer( owner_, recipient_, amount_ );
	}

	/**
	* @dev Mints `amount_` tokens for the benefit of `account_`.
	* 
	* Emits a {Transfer} event with `from` set to the zero address.
	* 
	* NOTE : This function should not be used without updating the total supply. For this 
	* purpose, the functions {ERC20Base-_mint} and {ERC20Base-_mintBatch} are provided.
	* 
	* Requirements:
	* 
	* - `account_` cannot be the zero address.
	*/
	function _airdrop( address account_, uint256 amount_ ) private {
		if ( account_ == address( 0 ) ) {
			revert IERC20_NULL_ADDRESS_MINT();
		}
		_transfer( account_, amount_ );

		emit Transfer( address( 0 ), account_, amount_ );
	}

	/**
	* @dev Mints `amount_` tokens for the benefit of `account_`, increasing the total supply.
	* 
	* See {ERC20Base-_airdrop}.
	*/
	function _mint( address account_, uint256 amount_ ) internal virtual {
		_airdrop( account_, amount_ );
		_totalSupply += amount_;
	}

	/**
	* @dev Mints the same `amount_` of tokens for multiple `accounts_`, increasing the total supply.
	* 
	* See {ERC20Base-_airdrop}.
	*/
	function _mintBatch( address[] memory accounts_, uint256 amount_ ) internal virtual {
		uint256 _len_ = accounts_.length;
		for ( uint256 i; i < _len_; i++ ) {
			_airdrop( accounts_[ i ], amount_ );
		}
		_totalSupply += _len_ * amount_;
	}

	/**
	* @dev Mints different `amounts_` of tokens for multiple `accounts_`, increasing the total supply.
	* 
	* See {ERC20Base-_airdrop}.
	* 
	* Requirements:
	* 
	* - `accounts_` and `amounts_` must have the same length.
	*/
	function _mintBatch( address[] memory accounts_, uint256[] memory amounts_ ) internal virtual {
		uint256 _len_ = accounts_.length;
		uint256 _newSupply_;
		if ( _len_ != amounts_.length ) {
			revert IERC20_ARRAY_LENGTH_MISMATCH();
		}

		for ( uint256 i; i < _len_; i ++ ) {
			_airdrop( accounts_[ i ], amounts_[ i ] );
			_newSupply_ += amounts_[ i ];
		}

		_totalSupply += _newSupply_;
	}
}
