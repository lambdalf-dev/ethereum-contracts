// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../interfaces/IArrayErrors.sol';
import '../interfaces/IEtherErrors.sol';
import '../interfaces/INFTSupplyErrors.sol';
import '../interfaces/IERC721Receiver.sol';
import '../tokens/ERC721/ERC721Batch.sol';
import '../tokens/ERC721/extensions/ERC721BatchEnumerable.sol';
import '../tokens/ERC721/extensions/ERC721BatchMetadata.sol';
import '../utils/ERC173.sol';
import '../utils/ERC2981.sol';
import '../utils/ContractState.sol';
import '../utils/Whitelist_ECDSA.sol';
import 'operator-filter-registry/src/UpdatableOperatorFilterer.sol';

abstract contract Template721 is 
  IArrayErrors, IEtherErrors, INFTSupplyErrors,
  ERC721Batch, ERC721BatchEnumerable, ERC721BatchMetadata,
  ERC173, ERC2981, ContractState, Whitelist_ECDSA, UpdatableOperatorFilterer {
  // **************************************
  // *****    BYTECODE  VARIABLES     *****
  // **************************************
    address public constant DEFAULT_SUBSCRIPTION = address( 0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6 );
    address public constant DEFAULT_OPERATOR_FILTER_REGISTRY = address( 0x000000000000AAeB6D7670E522A718067333cd4E );
    uint8 public constant PRIVATE_SALE = 1;
    uint8 public constant PUBLIC_SALE = 2;
  // **************************************

  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    uint256 public maxBatch;
    uint256 public maxSupply;
    address public treasury;
    uint256 private _reserve;

    // Mapping from phase to sale price
    mapping( uint8 => uint256 ) private _salePrice;
  // **************************************

  function __init_Template721(
    uint256 maxBatch_,
    uint256 maxSupply_,
    uint256 reserve_,
    uint256 privateSalePrice_,
    uint256 publicSalePrice_,
    uint256 royaltyRate_,
    address royaltyRecipient_,
    address treasury_,
    string memory collectionName_,
    string memory collectionSymbol_
  ) internal {
    maxBatch = maxBatch_;
    maxSupply = maxSupply_;
    _reserve = reserve_;
    _salePrice[ PRIVATE_SALE ] = privateSalePrice_;
    _salePrice[ PUBLIC_SALE ] = publicSalePrice_;
    treasury = treasury_;
    _setOwner( msg.sender );
    __init_ERC721Metadata( collectionName_, collectionSymbol_ );
    _setRoyaltyInfo( royaltyRecipient_, royaltyRate_ );
  }

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    /**
    * @notice Mints `qty_` tokens and transfers them to the caller.
    * 
    * @param qty_ : the amount of tokens to be minted
    * @param alloted_ : the maximum alloted for that user
    * @param proof_ : the signature to verify whitelist allocation
    * 
    * Requirements:
    * 
    * - Sale state must be {PRIVATE_SALE}.
    * - Caller must send enough ether to pay for `qty_` tokens at private sale price.
    */
    function mintPrivate( uint256 qty_, uint256 alloted_, Proof calldata proof_ ) public virtual payable
    isState( PRIVATE_SALE ) isWhitelisted( msg.sender, PRIVATE_SALE, alloted_, proof_, qty_ )  {
      if ( qty_ == 0 ) {
        revert NFT_INVALID_QTY();
      }
      uint256 _remainingSupply_ = maxSupply - _reserve - supplyMinted();
      if ( qty_ > _remainingSupply_ ) {
        revert NFT_MAX_SUPPLY( qty_, _remainingSupply_ );
      }
      uint256 _expected_ = qty_ * _salePrice[ PRIVATE_SALE ];
      if ( _expected_ != msg.value ) {
        revert ETHER_INCORRECT_PRICE( msg.value, _expected_ );
      }
      _mint( msg.sender, qty_ );
      _consumeWhitelist( msg.sender, PRIVATE_SALE, qty_ );
    }
    /**
    * @notice Mints `qty_` tokens and transfers them to the caller.
    * 
    * @param qty_ : the amount of tokens to be minted
    * 
    * Requirements:
    * 
    * - Sale state must be {PUBLIC_SALE}.
    * - There must be enough tokens left to mint outside of the reserve.
    * - Caller must send enough ether to pay for `qty_` tokens at public sale price.
    */
    function mintPublic( uint256 qty_ ) public virtual payable isState( PUBLIC_SALE ) {
      if ( qty_ == 0 ) {
        revert NFT_INVALID_QTY();
      }
      if ( qty_ > maxBatch ) {
        revert NFT_MAX_BATCH( qty_, maxBatch );
      }
      uint256 _remainingSupply_ = maxSupply - _reserve - supplyMinted();
      if ( qty_ > _remainingSupply_ ) {
        revert NFT_MAX_SUPPLY( qty_, _remainingSupply_ );
      }
      uint256 _expected_ = qty_ * _salePrice[ PUBLIC_SALE ];
      if ( _expected_ != msg.value ) {
        revert ETHER_INCORRECT_PRICE( msg.value, _expected_ );
      }
      _mint( msg.sender, qty_ );
    }
  // **************************************

  // **************************************
  // *****       CONTRACT_OWNER       *****
  // **************************************
    /**
    * @notice Mints `amounts_` tokens and transfers them to `accounts_`.
    * 
    * @param accounts_ : the list of accounts that will receive airdropped tokens
    * @param amounts_  : the amount of tokens each account will receive
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `accounts_` and `amounts_` must have the same length.
    * - There must be enough tokens left in the reserve.
    */
    function airdrop( address[] memory accounts_, uint256[] memory amounts_ ) public onlyOwner {
      uint256 _count_ = accounts_.length;
      if ( _count_ != amounts_.length ) {
        revert ARRAY_LENGTH_MISMATCH();
      }

      uint256 _totalQty_;
      while ( _count_ > 0 ) {
        unchecked {
          --_count_;
        }
        _totalQty_ += amounts_[ _count_ ];
        _mint( accounts_[ _count_ ], amounts_[ _count_ ] );
      }
      if ( _totalQty_ > _reserve ) {
        revert NFT_MAX_RESERVE( _totalQty_, _reserve );
      }
      unchecked {
        _reserve -= _totalQty_;
      }
    }
    /**
    * @notice Reduces the max supply.
    * 
    * @param newMaxSupply_ : the new max supply
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `newMaxSupply_` must be lower than `maxSupply`.
    * - `newMaxSupply_` must be higher than `_nextId`.
    */
    function reduceSupply( uint256 newMaxSupply_ ) public onlyOwner {
      if ( newMaxSupply_ > maxSupply || newMaxSupply_ < supplyMinted() + _reserve ) {
        revert NFT_INVALID_SUPPLY();
      }
      maxSupply = newMaxSupply_;
    }
    /**
    * @notice Updates the baseUri for the tokens.
    * 
    * @param newBaseUri_ : the new baseUri for the tokens
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setBaseUri( string memory newBaseUri_ ) public onlyOwner {
      _baseUri = newBaseUri_;
    }
    /**
    * @notice Updates the contract state.
    * 
    * @param newState_ : the new sale state
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `newState_` must be a valid state.
    */
    function setContractState( uint8 newState_ ) external onlyOwner {
      if ( newState_ > PUBLIC_SALE ) {
        revert ContractState_INVALID_STATE( newState_ );
      }
      _setContractState( newState_ );
    }
    /**
    * @notice Updates the max batch size.
    * 
    * @param newMaxBatch_ : the new max batch size.
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setMaxBatch( uint256 newMaxBatch_ ) external onlyOwner {
      maxBatch = newMaxBatch_;
    }
    /**
    * @notice Updates the royalty recipient and rate.
    * 
    * @param newRoyaltyRecipient_ : the new recipient of the royalties
    * @param newRoyaltyRate_ : the new royalty rate
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `newRoyaltyRate_` cannot be higher than 10,000.
    */
    function setRoyaltyInfo( address newRoyaltyRecipient_, uint256 newRoyaltyRate_ ) external onlyOwner {
      _setRoyaltyInfo( newRoyaltyRecipient_, newRoyaltyRate_ );
    }
    /**
    * @notice Updates the royalty recipient and rate.
    * 
    * @param newPrivatePrice_ : the new private price
    * @param newPublicPrice_ : the new public price
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setPrices( uint256 newPrivatePrice_, uint256 newPublicPrice_ ) external onlyOwner {
      _salePrice[ PRIVATE_SALE ] = newPrivatePrice_;
      _salePrice[ PUBLIC_SALE ] = newPublicPrice_;
    }
    /**
    * @notice Updates the contract treasury.
    * 
    * @param newTreasury_ : the new trasury
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setTreasury( address newTreasury_ ) external onlyOwner {
      treasury = newTreasury_;
    }
    /**
    * @notice Updates the whitelist signer.
    * 
    * @param newAdminSigner_ : the new whitelist signer
    *  
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setWhitelist( address newAdminSigner_ ) external onlyOwner {
      _setWhitelist( newAdminSigner_ );
    }
    /**
    * @notice Withdraws all the money stored in the contract and sends it to the treasury.
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `treasury` must be able to receive the funds.
    * - Contract must have a positive balance.
    */
    function withdraw() public onlyOwner {
      uint256 _balance_ = address( this ).balance;
      if ( _balance_ == 0 ) {
        revert ETHER_NO_BALANCE();
      }

      address _recipient_ = payable( treasury );
      ( bool _success_, ) = _recipient_.call{ value: _balance_ }( "" );
      if ( ! _success_ ) {
        revert ETHER_TRANSFER_FAIL( _recipient_, _balance_ );
      }
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /**
    * @notice Returns the sale price during the specified state.
    * 
    * @param contractState_ : the state of the contract to check the price at
    * 
    * @return price : uint256 => the sale price at the specified state
    */
    function salePrice( uint8 contractState_ ) public virtual view returns ( uint256 price ) {
      return _salePrice[ contractState_ ];
    }

    // ***********
    // * IERC173 *
    // ***********
      /**
      * @dev Returns the address of the current contract owner.
      * 
      * @return address : the current contract owner
      */
      function owner() public view override(ERC173, UpdatableOperatorFilterer) returns ( address ) {
        return ERC173.owner();
      }
    // ***********
  // **************************************
}
