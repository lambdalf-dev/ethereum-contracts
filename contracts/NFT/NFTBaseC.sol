// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../tokens/ERC721/Consec_ERC721Batch.sol';
import '../utils/IOwnable.sol';
import '../utils/IPausable.sol';
import '../utils/ITradable.sol';
import '../utils/ERC2981Base.sol';

abstract contract NFTBaseC is Consec_ERC721Batch, IOwnable, IPausable, ITradable, ERC2981Base {
	// Errors 
	error NFT_ARRAY_LENGTH_MISMATCH( uint256 len1, uint256 len2 );
	error NFT_INCORRECT_PRICE( uint256 amountReceived, uint256 amountExpected );
	error NFT_INVALID_QTY();
	error NFT_INVALID_SHARE();
	error NFT_INVALID_TEAM_MEMBER( address account );
	error NFT_MAX_BATCH( uint256 qtyRequested, uint256 maxBatch );
	error NFT_MAX_RESERVE( uint256 qtyRequested, uint256 reserveLeft );
	error NFT_MAX_SUPPLY( uint256 qtyRequested, uint256 remainingSupply );
	error NFT_MISSING_SHARES( uint256 missingShares );
	error NFT_NO_ETHER_BALANCE();
	error NFT_ETHER_TRANSFER_FAIL( address to, uint256 amount );

	// Events
	event PaymentReleased( address to, uint256 amount );

	uint8 public constant PUBLIC_SALE = 1;
	uint256 private constant SHARE_BASE = 10000;
	uint256 public MAX_SUPPLY;
	uint256 public MAX_BATCH;
	uint256 public SALE_PRICE;
	uint256 internal _reserve;
	uint256[] private _teamShares;
	address[] private _teamAddresses;

	/**
	* @dev Ensures that `qty_` is higher than 0
	* 
	* @param qty_ : the amount to validate 
	*/
	modifier validateAmount( uint256 qty_ ) {
		if ( qty_ == 0 ) {
			revert NFT_INVALID_QTY();
		}

		_;
	}

	// **************************************
	// *****          INTERNAL          *****
	// **************************************
		/**
		* @dev Internal function to initialize the NFT contract.
		* 
		* @param reserve_       : total amount of reserved tokens for airdrops
		* @param maxBatch_      : maximum quantity of token that can be minted in one transaction
		* @param maxSupply_     : maximum number of tokens that can exist
		* @param salePrice_     : sale price of the tokens
		* @param royaltyRate_   : portion of the secondary sale that will be paid out to the collection, out of 10,000 total shares
		* @param name_          : name of the token
		* @param symbol_        : symbol representing the token
		* @param baseURI_       : baseURI for the tokens
		* @param teamShares_    : how the proceeds of mint will be shared
		* @param teamAddresses_ : addresses between which the proceeds of mint will be shared
		* 
		* Requirements:
		* 
		* - `teamShares_` and `teamAddresses_` must have the same length
		* - no element of `teamShares_` can be 0
		* - no element of `teamAddresses_` can be a contract address
		* - the sum of `teamShares_` must be 1,000
		*/
		function _initNFTBaseC (
			uint256 reserve_,
			uint256 maxBatch_,
			uint256 maxSupply_,
			uint256 salePrice_,
			uint256 royaltyRate_,
			string memory name_,
			string memory symbol_,
			string memory baseURI_,
			uint256[] memory teamShares_,
			address[] memory teamAddresses_
		) internal {
			uint256 _sharesLen_    = teamShares_.length;
			uint256 _addressesLen_ = teamAddresses_.length;
			if ( _sharesLen_ != _addressesLen_ ) {
				revert NFT_ARRAY_LENGTH_MISMATCH( _sharesLen_, _addressesLen_ );
			}

			uint256 _totalShares_ = SHARE_BASE;
			for ( uint256 i = _sharesLen_; i > 0; i -- ) {
				if ( teamShares_[ i - 1 ] == 0 ) {
					revert NFT_INVALID_SHARE();
				}
				if ( _isContract( teamAddresses_[ i - 1 ] ) ) {
					revert NFT_INVALID_TEAM_MEMBER( teamAddresses_[ i - 1 ] );
				}
				unchecked {
					_totalShares_ -= teamShares_[ i - 1 ];
				}
			}
			if ( _totalShares_ != 0 ) {
				revert NFT_MISSING_SHARES( _totalShares_ );
			}

			_initERC721Metadata( name_, symbol_, baseURI_ );
			_initIOwnable( _msgSender() );
			_setRoyaltyInfo( _msgSender(), royaltyRate_ );
			MAX_SUPPLY     = maxSupply_;
			MAX_BATCH      = maxBatch_;
			SALE_PRICE     = salePrice_;
			_reserve       = reserve_;
			_teamShares    = teamShares_;
			_teamAddresses = teamAddresses_;
		}

		/**
		* @dev Internal function returning whether `operator_` is allowed to manage tokens on behalf of `tokenOwner_`.
		* 
		* @param tokenOwner_ : address that owns tokens
		* @param operator_   : address that tries to manage tokens
		* 
		* @return bool whether `operator_` is allowed to manage the token
		*/
		function _isApprovedForAll( address tokenOwner_, address operator_ ) internal view virtual override(Consec_ERC721Batch) returns ( bool ) {
			return _isRegisteredProxy( tokenOwner_, operator_ ) ||
						 super._isApprovedForAll( tokenOwner_, operator_ );
		}

		/**
		* @dev Internal function returning whether `addr_` is a contract.
		* Note this function will be inacurate if `addr_` is a contract in deployment.
		* 
		* @param addr_ : address to be verified
		* 
		* @return bool whether `addr_` is a fully deployed contract
		*/
		function _isContract( address addr_ ) internal view returns ( bool ) {
			uint size;
			assembly {
				size := extcodesize( addr_ )
			}
			return size > 0;
		}
	// **************************************

	// **************************************
	// *****           PUBLIC           *****
	// **************************************
		/**
		* @dev Mints `qty_` tokens and transfers them to the caller.
		* 
		* Requirements:
		* 
		* - Sale state must be {SaleState.SALE}.
		* - There must be enough tokens left to mint outside of the reserve.
		* - Caller must send enough ether to pay for `qty_` tokens at public sale price.
		* 
		* @param qty_ : the amount of tokens to be minted
		*/
		function mintPublic( uint256 qty_ ) public payable validateAmount( qty_ ) isState( PUBLIC_SALE ) {
			if ( qty_ > MAX_BATCH ) {
				revert NFT_MAX_BATCH( qty_, MAX_BATCH );
			}

			uint256 _remainingSupply_ = MAX_SUPPLY - _reserve - supplyMinted();
			if ( qty_ > _remainingSupply_ ) {
				revert NFT_MAX_SUPPLY( qty_, _remainingSupply_ );
			}

			uint256 _expected_ = qty_ * SALE_PRICE;
			if ( _expected_ != msg.value ) {
				revert NFT_INCORRECT_PRICE( msg.value, _expected_ );
			}

			_mint( _msgSender(), qty_ );
		}
	// **************************************

	// **************************************
	// *****       CONTRACT_OWNER       *****
	// **************************************
		/**
		* @dev See {ITradable-addProxyRegistry}.
		* 
		* @param proxyRegistryAddress_ : the address of the proxy registry to be added
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		*/
		function addProxyRegistry( address proxyRegistryAddress_ ) external onlyOwner {
			_addProxyRegistry( proxyRegistryAddress_ );
		}

		/**
		* @dev See {ITradable-removeProxyRegistry}.
		* 
		* @param proxyRegistryAddress_ : the address of the proxy registry to be removed
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		*/
		function removeProxyRegistry( address proxyRegistryAddress_ ) external onlyOwner {
			_removeProxyRegistry( proxyRegistryAddress_ );
		}

		/**
		* @dev Mints `amounts_` tokens and transfers them to `accounts_`.
		* 
		* @param accounts_ : the list of accounts that will receive airdropped tokens
		* @param amounts_  : the amount of tokens each account in `accounts_` will receive
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		* - `accounts_` and `amounts_` must have the same length.
		* - There must be enough tokens left in the reserve.
		*/
		function airdrop( address[] memory accounts_, uint256[] memory amounts_ ) public onlyOwner {
			uint256 _accountsLen_ = accounts_.length;
			uint256 _amountsLen_  = amounts_.length;
			if ( _accountsLen_ != _amountsLen_ ) {
				revert NFT_ARRAY_LENGTH_MISMATCH( _accountsLen_, _amountsLen_ );
			}

			uint256 _totalQty_;
			for ( uint256 i = _amountsLen_; i > 0; i -- ) {
				_totalQty_ += amounts_[ i - 1 ];
			}
			if ( _totalQty_ > _reserve ) {
				revert NFT_MAX_RESERVE( _totalQty_, _reserve );
			}
			unchecked {
				_reserve -= _totalQty_;
			}

			for ( uint256 i; i < _accountsLen_; i ++ ) {
				_mint( accounts_[ i ], amounts_[ i ] );
			}
		}

		/**
		* @dev Updates the baseURI for the tokens.
		* 
		* @param baseURI_ : the new baseURI for the tokens
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		*/
		function setBaseURI( string memory baseURI_ ) public onlyOwner {
			_setBaseURI( baseURI_ );
		}

		/**
		* @dev Updates the royalty recipient and rate.
		* 
		* @param royaltyRecipient_ : the new recipient of the royalties
		* @param royaltyRate_      : the new royalty rate
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner
		* - `royaltyRate_` cannot be higher than 10,000
		*/
		function setRoyaltyInfo( address royaltyRecipient_, uint256 royaltyRate_ ) external onlyOwner {
			_setRoyaltyInfo( royaltyRecipient_, royaltyRate_ );
		}

		/**
		* @dev See {IPausable-setPauseState}.
		* 
		* @param newState_ : the new sale state
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		*/
		function setPauseState( uint8 newState_ ) external onlyOwner {
			_setPauseState( newState_ );
		}

		/**
		* @dev Withdraws all the money stored in the contract and splits it amongst the set wallets.
		* 
		* Requirements:
		* 
		* - Caller must be the contract owner.
		* - Contract must have a positive balance.
		*/
		function withdraw() public onlyOwner {
			uint256 _balance_ = address( this ).balance;
			if ( _balance_ == 0 ) {
				revert NFT_NO_ETHER_BALANCE();
			}

			uint256 _len_ = _teamAddresses.length;
			for ( uint256 i = 0; i < _len_; i ++ ) {
				address _recipient_ = payable( _teamAddresses[ i ] );
				uint256 _amount_ = _balance_ * _teamShares[ i ] / SHARE_BASE;
				( bool _success_, ) = _recipient_.call{ value: _amount_ }( "" );
				if ( ! _success_ ) {
					revert NFT_ETHER_TRANSFER_FAIL( _recipient_, _amount_ );
				}
				emit PaymentReleased( _recipient_, _amount_ );
			}
		}
	// **************************************

	// **************************************
	// *****            VIEW            *****
	// **************************************
		function supportsInterface( bytes4 interfaceId_ ) public view virtual override returns ( bool ) {
			return interfaceId_ == type( IERC2981 ).interfaceId ||
						 super.supportsInterface( interfaceId_ );
		}
	// **************************************
}
