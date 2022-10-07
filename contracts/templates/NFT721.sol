// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../interfaces/IArrayErrors.sol';
import '../interfaces/IEtherErrors.sol';
import '../interfaces/IERC721Errors.sol';
import '../interfaces/INFTSupplyErrors.sol';
import '../interfaces/IERC165.sol';
import '../interfaces/IERC721.sol';
import '../interfaces/IERC721Metadata.sol';
import '../interfaces/IERC721Enumerable.sol';
import '../interfaces/IERC721Receiver.sol';
import '../interfaces/IERC2981.sol';
import '../utils/ERC173.sol';
import '../utils/ContractState.sol';
import '../utils/Whitelist_ECDSA.sol';
import '../utils/ERC2981.sol';

abstract contract NFT721 is 
  IArrayErrors, IEtherErrors, IERC721Errors, INFTSupplyErrors,
  IERC165, IERC721, IERC721Metadata, IERC721Enumerable,
  ERC2981, ERC173, ContractState, Whitelist_ECDSA {
  /**
  * @dev A structure representing the deployment configuration of the contract.
  * It contains several pieces of information:
  * - maxBatch         : The maximum amount of tokens that can be minted in one transaction (for public sale)
  * - publicSalePrice  : The price of the tokens during public sale
  * - privateSalePrice : The price of the tokens during private sale
  * - name             : The name of the tokens, for token trackers (i.e. 'Cool Cats')
  * - symbol           : The symbol of the tokens, for token trackers (i.e. 'COOL')
  */
  struct Config {
    uint256 maxBatch;
    uint256 publicSalePrice;
    uint256 privateSalePrice;
    string  name;
    string  symbol;
  }

  // Constants
  uint8   public constant PUBLIC_SALE   = 1;
  uint8   public constant PRIVATE_SALE  = 2;

  uint256 private _nextId = 1;
  uint256 private _maxSupply;
  uint256 private _reserve;
  string  private _baseURI;
  Config  private _config;
  address private _treasury;

  // Mapping from token ID to approved address
  mapping( uint256 => address ) private _approvals;

  // Mapping from owner to operator approvals
  mapping( address => mapping( address => bool ) ) private _operatorApprovals;

  // List of owner addresses
  mapping( uint256 => address ) private _owners;

  function __init_NFT721(
    address treasury_,
    uint256 maxSupply_,
    uint256 reserve_,
    uint256 royaltyRate_,
    Config  config_
  ) internal {
    _treasury = treasury_;
    _maxSupply = maxSupply_;
    _reserve = reserve_;
    _config = config_;
    _setRoyaltyInfo( treasury_, royaltyRate_ );
  }

  // **************************************
  // *****          MODIFIER          *****
  // **************************************
    /**
    * @dev Ensures the token exist. 
    * A token exists if it has been minted and is not owned by the null address.
    * 
    * @param tokenId_ : identifier of the NFT being referenced
    */
    modifier exists( uint256 tokenId_ ) {
      if ( ! _exists( tokenId_ ) ) {
        revert IERC721_NONEXISTANT_TOKEN( tokenId_ );
      }
      _;
    }

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

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
    * The call is not executed if the target address is not a contract.
    *
    * @param from_    : address owning the token being transferred
    * @param to_      : address the token is being transferred to
    * @param tokenId_ : identifier of the NFT being referenced
    * @param data_    : optional data to send along with the call
    * 
    * @return bool : whether the call correctly returned the expected magic value
    */
    function _checkOnERC721Received( address from_, address to_, uint256 tokenId_, bytes memory data_ ) internal returns ( bool ) {
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
        try IERC721Receiver( to_ ).onERC721Received( msg.sender, from_, tokenId_, data_ ) returns ( bytes4 retval ) {
          return retval == IERC721Receiver.onERC721Received.selector;
        }
        catch ( bytes memory reason ) {
          if ( reason.length == 0 ) {
            revert IERC721_NON_ERC721_RECEIVER( to_ );
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
    * @dev Internal function returning whether a token exists. 
    * A token exists if it has been minted and is not owned by the null address.
    * 
    * Note: this function must be overriden if tokens are burnable.
    * 
    * @param tokenId_ : identifier of the NFT being referenced
    * 
    * @return bool : whether the token exists
    */
    function _exists( uint256 tokenId_ ) internal view returns ( bool ) {
      if ( tokenId_ == 0 ) {
        return false;
      }
      return tokenId_ < _nextId;
    }

    /**
    * @dev Internal function returning whether `operator_` is allowed 
    * to manage tokens on behalf of `tokenOwner_`.
    * 
    * @param tokenOwner_ : address that owns tokens
    * @param operator_   : address that tries to manage tokens
    * 
    * @return bool : whether `operator_` is allowed to manage the tokens
    */
    function _isApprovedForAll( address tokenOwner_, address operator_ ) internal view returns ( bool ) {
      return _operatorApprovals[ tokenOwner_ ][ operator_ ];
    }

    /**
    * @dev Internal function returning whether `operator_` is allowed to handle `tokenId_`
    * 
    * Note: To avoid multiple checks for the same data, it is assumed 
    * that existence of `tokenId_` has been verified prior via {_exists}
    * If it hasn't been verified, this function might panic
    * 
    * @param operator_ : address that tries to handle the token
    * @param tokenId_  : identifier of the NFT being referenced
    * 
    * @return bool : whether `operator_` is allowed to manage the token
    */
    function _isApprovedOrOwner( address tokenOwner_, address operator_, uint256 tokenId_ ) internal view returns ( bool ) {
      bool _isApproved_ = operator_ == tokenOwner_ ||
                          operator_ == getApproved( tokenId_ ) ||
                          isApprovedForAll( tokenOwner_, operator_ );
      return _isApproved_;
    }

    /**
    * @dev Mints `qty_` tokens and transfers them to `to_`.
    * 
    * This internal function can be used to perform token minting.
    * 
    * @param to_  : address receiving the tokens
    * @param qty_ : the amount of tokens to be minted
    * 
    * Emits one or more {Transfer} event.
    */
    function _mint( address to_, uint256 qty_ ) internal {
      uint256 _firstToken_ = _nextId;
      uint256 _nextStart_ = _firstToken_ + qty_;
      uint256 _lastToken_ = _nextStart_ - 1;

      _owners[ _firstToken_ ] = to_;
      if ( _lastToken_ > _firstToken_ ) {
        _owners[ _lastToken_ ] = to_;
      }
      _nextId = _nextStart_;

      for ( uint256 i = _firstToken_; i < _nextStart_; ++i ) {
        emit Transfer( address( 0 ), to_, i );
      }
    }

    /**
    * @dev Internal function returning the owner of the `tokenId_` token.
    * 
    * @param tokenId_ : identifier of the NFT being referenced
    * 
    * @return address the address of the token owner
    */
    function _ownerOf( uint256 tokenId_ ) internal view returns ( address ) {
      uint256 _index_ = tokenId_;
      address _tokenOwner_ = _owners[ _index_ ];
      while ( _tokenOwner_ == address( 0 ) ) {
        _index_ --;
        _tokenOwner_ = _owners[ _index_ ];
      }

      return _tokenOwner_;
    }

    /**
    * @dev Internal function returning the total supply.
    * 
    * Note: this function must be overriden if tokens are burnable.
    */
    function _totalSupply() internal view returns ( uint256 ) {
      return supplyMinted();
    }

    /**
    * @dev Converts a `uint256` to its ASCII `string` decimal representation.
    */
    function _toString( uint256 value ) internal pure returns ( string memory ) {
      // Inspired by OraclizeAPI's implementation - MIT licence
      // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
      if ( value == 0 ) {
        return "0";
      }
      uint256 temp = value;
      uint256 digits;
      while ( temp != 0 ) {
        digits ++;
        temp /= 10;
      }
      bytes memory buffer = new bytes( digits );
      while ( value != 0 ) {
        digits -= 1;
        buffer[ digits ] = bytes1( uint8( 48 + uint256( value % 10 ) ) );
        value /= 10;
      }
      return string( buffer );
    }

    /**
    * @dev Transfers `tokenId_` from `from_` to `to_`.
    *
    * This internal function can be used to implement alternative mechanisms to perform 
    * token transfer, such as signature-based, or token burning.
    * 
    * @param from_    : the current owner of the NFT
    * @param to_      : the new owner
    * @param tokenId_ : identifier of the NFT being referenced
    * 
    * Emits a {Transfer} event.
    */
    function _transfer( address from_, address to_, uint256 tokenId_ ) internal {
      _approvals[ tokenId_ ] = address( 0 );
      uint256 _previousId_ = tokenId_ > 1 ? tokenId_ - 1 : 1;
      uint256 _nextId_     = tokenId_ + 1;
      bool _previousShouldUpdate_ = _previousId_ < tokenId_ &&
                                    _exists( _previousId_ ) &&
                                    _owners[ _previousId_ ] == address( 0 );
      bool _nextShouldUpdate_ = _exists( _nextId_ ) &&
                                _owners[ _nextId_ ] == address( 0 );

      if ( _previousShouldUpdate_ ) {
        _owners[ _previousId_ ] = from_;
      }

      if ( _nextShouldUpdate_ ) {
        _owners[ _nextId_ ] = from_;
      }

      _owners[ tokenId_ ] = to_;

      emit Transfer( from_, to_, tokenId_ );
    }
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    /**
    * @notice Mints `qty_` tokens and transfers them to the caller.
    * 
    * @param qty_           : the amount of tokens to be minted
    * @param alloted_       : the maximum alloted for that user
    * @param proof_         : the signature to verify whitelist allocation
    * 
    * Requirements:
    * 
    * - Sale state must be {PRIVATE_SALE}.
    * - Caller must send enough ether to pay for `qty_` tokens at private sale price.
    */
    function mintPrivate( uint256 qty_, uint256 alloted_, Proof memory proof_ ) public payable validateAmount( qty_ ) isState( PRIVATE_SALE ) isWhitelisted( msg.sender, PRIVATE_SALE, alloted_, proof_, qty_ ) {
      uint256 _remainingSupply_ = _maxSupply - _config.reserve - supplyMinted();
      if ( qty_ > _remainingSupply_ ) {
        revert NFT_MAX_SUPPLY( qty_, _remainingSupply_ );
      }

      uint256 _expected_ = qty_ * _config.privateSalePrice;
      if ( _expected_ != msg.value ) {
        revert ETHER_INCORRECT_PRICE( msg.value, _expected_ );
      }

      _consumeWhitelist( msg.sender, PRIVATE_SALE, qty_ );
      _mint( msg.sender, qty_ );
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
    function mintPublic( uint256 qty_ ) public payable validateAmount( qty_ ) isState( PUBLIC_SALE ) {
      if ( qty_ > _config.maxBatch ) {
        revert NFT_MAX_BATCH( qty_, _config.maxBatch );
      }

      uint256 _remainingSupply_ = _maxSupply - _config.reserve - supplyMinted();
      if ( qty_ > _remainingSupply_ ) {
        revert NFT_MAX_SUPPLY( qty_, _remainingSupply_ );
      }

      uint256 _expected_ = qty_ * _config.publicSalePrice;
      if ( _expected_ != msg.value ) {
        revert ETHER_INCORRECT_PRICE( msg.value, _expected_ );
      }

      _mint( msg.sender, qty_ );
    }

    // +---------+
    // | IERC721 |
    // +---------+
      /**
      * @notice Gives permission to `to_` to transfer the token number `tokenId_` on behalf of its owner.
      * The approval is cleared when the token is transferred.
      * 
      * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
      * 
      * @param to_      : The new approved NFT controller
      * @param tokenId_ : The NFT to approve
      * 
      * Requirements:
      * 
      * - The token number `tokenId_` must exist.
      * - The caller must own the token or be an approved operator.
      * - Must emit an {Approval} event.
      */
      function approve( address to_, uint256 tokenId_ ) public override exists( tokenId_ ) {
        address _operator_ = msg.sender;
        address _tokenOwner_ = _ownerOf( tokenId_ );
        if ( to_ == _tokenOwner_ ) {
          revert IERC721_INVALID_APPROVAL( to_ );
        }

        bool _isApproved_ = _isApprovedOrOwner( _tokenOwner_, _operator_, tokenId_ );
        if ( ! _isApproved_ ) {
          revert IERC721_CALLER_NOT_APPROVED( _tokenOwner_, _operator_, tokenId_ );
        }

        _approvals[ tokenId_ ] = to_;
        emit Approval( _tokenOwner_, to_, tokenId_ );
      }

      /**
      * @notice Transfers the token number `tokenId_` from `from_` to `to_`.
      * 
      * @param from_    : The current owner of the NFT
      * @param to_      : The new owner
      * @param tokenId_ : identifier of the NFT being referenced
      * 
      * Requirements:
      * 
      * - The token number `tokenId_` must exist.
      * - `from_` must be the token owner.
      * - The caller must own the token or be an approved operator.
      * - `to_` must not be the zero address.
      * - If `to_` is a contract, it must implement {IERC721Receiver-onERC721Received} with a return value of `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`,
      * - Must emit a {Transfer} event.
      */
      function safeTransferFrom( address from_, address to_, uint256 tokenId_ ) public override {
        safeTransferFrom( from_, to_, tokenId_, "" );
      }

      /**
      * @notice Transfers the token number `tokenId_` from `from_` to `to_`.
      * 
      * @param from_    : The current owner of the NFT
      * @param to_      : The new owner
      * @param tokenId_ : identifier of the NFT being referenced
      * @param data_    : Additional data with no specified format, sent in call to `to_`
      * 
      * Requirements:
      * 
      * - The token number `tokenId_` must exist.
      * - `from_` must be the token owner.
      * - The caller must own the token or be an approved operator.
      * - `to_` must not be the zero address.
      * - If `to_` is a contract, it must implement {IERC721Receiver-onERC721Received} with a return value of `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`,
      * - Must emit a {Transfer} event.
      */
      function safeTransferFrom( address from_, address to_, uint256 tokenId_, bytes memory data_ ) public override {
        transferFrom( from_, to_, tokenId_ );
        if ( ! _checkOnERC721Received( from_, to_, tokenId_, data_ ) ) {
          revert IERC721_NON_ERC721_RECEIVER( to_ );
        }
      }

      /**
      * @notice Allows or disallows `operator_` to manage the caller's tokens on their behalf.
      * 
      * @param operator_ : Address to add to the set of authorized operators
      * @param approved_ : True if the operator is approved, false to revoke approval
      * 
      * Requirements:
      * 
      * - Must emit an {ApprovalForAll} event.
      */
      function setApprovalForAll( address operator_, bool approved_ ) public override {
        address _account_ = msg.sender;
        if ( operator_ == _account_ ) {
          revert IERC721_INVALID_APPROVAL( operator_ );
        }

        _operatorApprovals[ _account_ ][ operator_ ] = approved_;
        emit ApprovalForAll( _account_, operator_, approved_ );
      }

      /**
      * @notice Transfers the token number `tokenId_` from `from_` to `to_`.
      * 
      * @param from_    : the current owner of the NFT
      * @param to_      : the new owner
      * @param tokenId_ : identifier of the NFT being referenced
      * 
      * Requirements:
      * 
      * - The token number `tokenId_` must exist.
      * - `from_` must be the token owner.
      * - The caller must own the token or be an approved operator.
      * - `to_` must not be the zero address.
      * - Must emit a {Transfer} event.
      */
      function transferFrom( address from_, address to_, uint256 tokenId_ ) public override exists( tokenId_ ) {
        if ( to_ == address( 0 ) ) {
          revert IERC721_INVALID_TRANSFER();
        }

        address _operator_ = msg.sender;
        address _tokenOwner_ = _ownerOf( tokenId_ );
        if ( from_ != _tokenOwner_ ) {
          revert IERC721_INVALID_TRANSFER_FROM( _tokenOwner_, from_, tokenId_ );
        }

        bool _isApproved_ = _isApprovedOrOwner( _tokenOwner_, _operator_, tokenId_ );
        if ( ! _isApproved_ ) {
          revert IERC721_CALLER_NOT_APPROVED( _tokenOwner_, _operator_, tokenId_ );
        }

        _transfer( _tokenOwner_, to_, tokenId_ );
      }
    // +---------+
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
      uint256 _amountsLen_ = amounts_.length;
      if ( accounts_.length != _amountsLen_ ) {
        revert ARRAY_LENGTH_MISMATCH();
      }

      uint256 _totalQty_;
      for ( uint256 i = _amountsLen_; i > 0; i -- ) {
        _totalQty_ += amounts_[ i - 1 ];
      }
      if ( _totalQty_ > _config.reserve ) {
        revert NFT_MAX_RESERVE( _totalQty_, _config.reserve );
      }
      unchecked {
        _config.reserve -= _totalQty_;
      }

      uint256 _count_ = _amountsLen_;
      while ( _count_ > 0 ) {
        unchecked {
          _count_ --;
        }
        _mint( accounts_[ _count_ ], amounts_[ _count_ ] );
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
    * - `newMaxSupply_` must be lower than `_maxSupply`.
    * - `newMaxSupply_` must be higher than `_nextId`.
    */
    function reduceSupply( uint256 newMaxSupply_ ) public onlyOwner {
      if ( newMaxSupply_ > _maxSupply || newMaxSupply_ < _nextId ) {
        revert NFT_INVALID_SUPPLY();
      }
      _maxSupply = newMaxSupply_;
    }

    /**
    * @notice Updates the baseURI for the tokens.
    * 
    * @param baseURI_ : the new baseURI for the tokens
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setBaseURI( string memory baseURI_ ) public onlyOwner {
      _baseURI = baseURI_;
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
    function setPauseState( uint8 newState_ ) external onlyOwner {
      if ( newState_ > PUBLIC_SALE ) {
        revert ContractState_INVALID_STATE( newState_ );
      }
      _setPauseState( newState_ );
    }

    /**
    * @notice Updates the royalty recipient and rate.
    * 
    * @param royaltyRecipient_ : the new recipient of the royalties
    * @param royaltyRate_      : the new royalty rate
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - `royaltyRate_` cannot be higher than 10,000.
    */
    function setRoyaltyInfo( address royaltyRecipient_, uint256 royaltyRate_ ) external onlyOwner {
      _setRoyaltyInfo( royaltyRecipient_, royaltyRate_ );
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
      _treasury = newTreasury_;
    }

    /**
    * @notice Updates the whitelist signer.
    * 
    * @param adminSigner_ : the new whitelist signer
    *  
    * Requirements:
    * 
    * - Caller must be the contract owner.
    */
    function setWhitelist( address adminSigner_ ) external onlyOwner {
      _setWhitelist( adminSigner_ );
    }

    /**
    * @notice Withdraws all the money stored in the contract and sends it to the treasury.
    * 
    * Requirements:
    * 
    * - Caller must be the contract owner.
    * - Contract must have a positive balance.
    */
    function withdraw() public onlyOwner {
      uint256 _balance_ = address( this ).balance;
      if ( _balance_ == 0 ) {
        revert ETHER_NO_BALANCE();
      }

      address _recipient_ = payable( _treasury );
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
    * @notice Returns the total number of tokens minted
    * 
    * @return uint256 the number of tokens that have been minted so far
    */
    function supplyMinted() public view returns ( uint256 ) {
      return _nextId - 1;
    }

    // +---------+
    // | IERC721 |
    // +---------+
      /**
      * @notice Returns the number of tokens in `tokenOwner_`'s account.
      * 
      * @param tokenOwner_ : address that owns tokens
      * 
      * @return uint256 : the nomber of tokens owned by `tokenOwner_`
      */
      function balanceOf( address tokenOwner_ ) public view override returns ( uint256 ) {
        if ( tokenOwner_ == address( 0 ) ) {
          return 0;
        }

        uint256 _count_ = 0;
        address _currentTokenOwner_;
        for ( uint256 i = 1; i < _nextId; ++ i ) {
          if ( _exists( i ) ) {
            if ( _owners[ i ] != address( 0 ) ) {
              _currentTokenOwner_ = _owners[ i ];
            }
            if ( tokenOwner_ == _currentTokenOwner_ ) {
              _count_++;
            }
          }
        }
        return _count_;
      }

      /**
      * @notice Returns the address that has been specifically allowed to manage `tokenId_` on behalf of its owner.
      * 
      * @param tokenId_ : the NFT that has been approved
      * 
      * @return address : the address allowed to manage `tokenId_`
      * 
      * Requirements:
      * 
      * - `tokenId_` must exist.
      * 
      * Note: See {Approve}
      */
      function getApproved( uint256 tokenId_ ) public view override exists( tokenId_ ) returns ( address ) {
        return _approvals[ tokenId_ ];
      }

      /**
      * @notice Returns whether `operator_` is allowed to manage tokens on behalf of `tokenOwner_`.
      * 
      * @param tokenOwner_ : address that owns tokens
      * @param operator_   : address that tries to manage tokens
      * 
      * @return bool : whether `operator_` is allowed to handle `tokenOwner`'s tokens
      * 
      * Note: See {setApprovalForAll}
      */
      function isApprovedForAll( address tokenOwner_, address operator_ ) public view override returns ( bool ) {
        return _operatorApprovals[ tokenOwner_ ][ operator_ ];
      }

      /**
      * @notice Returns the owner of the token number `tokenId_`.
      * 
      * @param tokenId_ : the NFT to verify ownership of
      * 
      * @return address : the owner of token number `tokenId_`
      * 
      * Requirements:
      * 
      * - `tokenId_` must exist.
      */
      function ownerOf( uint256 tokenId_ ) public view override exists( tokenId_ ) returns ( address ) {
        return _ownerOf( tokenId_ );
      }
    // +---------+

    // +-----------------+
    // | IERC721Metadata |
    // +-----------------+
      /**
      * @notice A descriptive name for a collection of NFTs in this contract.
      * 
      * @return string : The name of the collection
      */
      function name() public view override returns ( string memory ) {
        return _config.name;
      }

      /**
      * @notice An abbreviated name for NFTs in this contract.
      * 
      * @return string : The abbreviated name of the collection
      */
      function symbol() public view override returns ( string memory ) {
        return _config.symbol;
      }

      /**
      * @notice A distinct Uniform Resource Identifier (URI) for a given asset.
      * 
      * @param tokenId_ : the NFT that has been approved
      * 
      * @return string : the URI of the token
      * 
      * Requirements:
      * 
      * - `tokenId_` must exist.
      */
      function tokenURI( uint256 tokenId_ ) public view override exists( tokenId_ ) returns ( string memory ) {
        return bytes( _baseURI ).length > 0 ? string( abi.encodePacked( _baseURI, _toString( tokenId_ ) ) ) : _toString( tokenId_ );
      }
    // +---------+

    // +-------------------+
    // | IERC721Enumerable |
    // +-------------------+
      /**
      * @notice Enumerate valid NFTs.
      * 
      * @param index_ : a counter less than `totalSupply()`
      * 
      * @return uint256 : the token identifier of the `index_`th NFT
      * 
      * Requirements:
      * 
      * - `index_` must be lower than `totalSupply()`.
      */
      function tokenByIndex( uint256 index_ ) public view override returns ( uint256 ) {
        if ( index_ >= supplyMinted() ) {
          revert IERC721Enumerable_INDEX_OUT_OF_BOUNDS( index_ );
        }
        return index_ + 1;
      }

      /**
      * @notice Enumerate NFTs assigned to an owner.
      * 
      * @param tokenOwner_ : the address for which we want to know the tokens owned
      * @param index_      : a counter less than `balanceOf(tokenOwner_)`
      * 
      * @return uint256 : the token identifier of the `index_`th NFT
      * 
      * Requirements:
      * 
      * - `index_` must be lower than `balanceOf(tokenOwner_)`.
      */
      function tokenOfOwnerByIndex( address tokenOwner_, uint256 index_ ) public view override returns ( uint256 ) {
        if ( index_ >= balanceOf( tokenOwner_ ) ) {
          revert IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS( tokenOwner_, index_ );
        }

        uint256 _count_ = 0;
        for ( uint256 i = 1; i < _nextId; ++i ) {
          if ( _exists( i ) && tokenOwner_ == _ownerOf( i ) ) {
            if ( index_ == _count_ ) {
              return i;
            }
            unchecked {
              _count_++;
            }
          }
        }
      }

      /**
      * @notice Count NFTs tracked by this contract.
      * 
      * @return the total number of existing NFTs tracked by the contract
      */
      function totalSupply() public view override returns ( uint256 ) {
        return _totalSupply();
      }
    // +---------+

    // +---------+
    // | IERC165 |
    // +---------+
      /**
      * @notice Query if a contract implements an interface.
      * @dev see https://eips.ethereum.org/EIPS/eip-165
      * 
      * @param interfaceId_ : the interface identifier, as specified in ERC-165
      * 
      * @return bool : true if the contract implements the specified interface, false otherwise
      * 
      * Requirements:
      * 
      * - This function must use less than 30,000 gas.
      */
      function supportsInterface( bytes4 interfaceId_ ) public view override returns ( bool ) {
        return 
          interfaceId_ == type( IERC721 ).interfaceId ||
          interfaceId_ == type( IERC721Enumerable ).interfaceId ||
          interfaceId_ == type( IERC721Metadata ).interfaceId ||
          interfaceId_ == type( IERC173 ).interfaceId ||
          interfaceId_ == type( IERC165 ).interfaceId ||
          interfaceId_ == type( IERC2981 ).interfaceId;
      }
    // +---------+
  // **************************************
}
