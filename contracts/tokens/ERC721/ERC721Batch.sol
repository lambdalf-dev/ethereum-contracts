// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../interfaces/IERC721Errors.sol';
import '../../interfaces/IERC2309.sol';
import '../../interfaces/IERC165.sol';
import '../../interfaces/IERC721.sol';
import '../../interfaces/IERC721Receiver.sol';

/**
* @dev Required interface of an ERC721 compliant contract.
* This contract features:
* ~ Ultra Cheap batch minting
* ~ Implementation of EIP2309 https://eips.ethereum.org/EIPS/eip-2309
* 
* Note: This implementation imposes a very expensive `balanceOf()` and `ownerOf()`.
* It is not recommended to interract with those from another contract.
*/
abstract contract ERC721Batch is IERC721Errors, IERC165, IERC721, IERC2309 {
  uint256 private _nextId = 1;

  // Mapping from token ID to approved address
  mapping( uint256 => address ) private _approvals;

  // Mapping from owner to operator approvals
  mapping( address => mapping( address => bool ) ) private _operatorApprovals;

  // List of owner addresses
  mapping( uint256 => address ) private _owners;

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
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Internal function returning the number of tokens in `userAddress_`'s account.
    * 
    * @param userAddress_ : address that may own tokens
    * 
    * @return uint256 : the number of tokens owned by `userAddress_`
    */
    function _balanceOf( address userAddress_ ) internal view virtual returns ( uint256 ) {
      if ( userAddress_ == address( 0 ) ) {
        return 0;
      }

      uint256 _count_;
      address _currentTokenOwner_;
      uint256 _index_ = 1;
      while ( _index_ < _nextId ) {
        if ( _exists( _index_ ) ) {
          if ( _owners[ _index_ ] != address( 0 ) ) {
            _currentTokenOwner_ = _owners[ _index_ ];
          }
          if ( userAddress_ == _currentTokenOwner_ ) {
            unchecked {
              ++_count_;
            }
          }
        }
        unchecked {
          ++_index_;
        }
      }
      return _count_;
    }

    /**
    * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
    * The call is not executed if the target address is not a contract.
    *
    * @param fromAddress_ : previous owner of the NFT
    * @param toAddress_   : new owner of the NFT
    * @param tokenId_     : identifier of the NFT being transferred
    * @param data_        : optional data to send along with the call

    * @return bool : whether the call correctly returned the expected value (IERC721Receiver.onERC721Received.selector)
    */
    function _checkOnERC721Received( address fromAddress_, address toAddress_, uint256 tokenId_, bytes memory data_ ) internal virtual returns ( bool ) {
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
        _size_ := extcodesize( toAddress_ )
      }

      // If address is a contract, check that it is aware of how to handle ERC721 tokens
      if ( _size_ > 0 ) {
        try IERC721Receiver( toAddress_ ).onERC721Received( msg.sender, fromAddress_, tokenId_, data_ ) returns ( bytes4 retval ) {
          return retval == IERC721Receiver.onERC721Received.selector;
        }
        catch ( bytes memory reason ) {
          if ( reason.length == 0 ) {
            revert IERC721_NON_ERC721_RECEIVER( toAddress_ );
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
    * @param tokenId_ : identifier of the NFT to verify
    * 
    * @return bool : whether the NFT exists
    */
    function _exists( uint256 tokenId_ ) internal view virtual returns ( bool ) {
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
    * @return bool : whether `operator_` is allowed to handle the token
    */
    function _isApprovedForAll( address tokenOwner_, address operator_ ) internal view virtual returns ( bool ) {
      return _operatorApprovals[ tokenOwner_ ][ operator_ ];
    }

    /**
    * @dev Internal function returning whether `operator_` is allowed to handle `tokenId_`
    * 
    * Note: To avoid multiple checks for the same data, it is assumed that existence of `tokenId_` 
    * has been verified prior via {_exists}
    * If it hasn't been verified, this function might panic
    * 
    * @param tokenOwner_ : address that owns tokens
    * @param operator_   : address that tries to handle the token
    * @param tokenId_    : identifier of the NFT
    * 
    * @return bool whether `operator_` is allowed to handle the token
    */
    function _isApprovedOrOwner( address tokenOwner_, address operator_, uint256 tokenId_ ) internal view virtual returns ( bool ) {
      bool _isApproved_ = operator_ == tokenOwner_ ||
                          operator_ == _approvals[ tokenId_ ] ||
                          _isApprovedForAll( tokenOwner_, operator_ );
      return _isApproved_;
    }

    /**
    * @dev Mints `qty_` tokens and transfers them to `toAddress_`.
    * 
    * This internal function can be used to perform token minting.
    * 
    * Emits one or more {Transfer} event.
    * 
    * @param toAddress_ : address receiving the NFTs
    * @param qty_       : number of NFTs being minted
    */
    function _mint2309( address toAddress_, uint256 qty_ ) internal virtual {
      if ( toAddress_ == address( 0 ) ) {
        revert IERC721_INVALID_TRANSFER();
      }

      uint256 _firstToken_ = _nextId;
      uint256 _nextStart_ = _firstToken_ + qty_;
      uint256 _lastToken_ = _nextStart_ - 1;

      _owners[ _firstToken_ ] = toAddress_;
      if ( _lastToken_ > _firstToken_ ) {
        _owners[ _lastToken_ ] = toAddress_;
      }
      _nextId = _nextStart_;

      if ( ! _checkOnERC721Received( address( 0 ), toAddress_, _firstToken_, "" ) ) {
        revert IERC721_NON_ERC721_RECEIVER( toAddress_ );
      }

      emit ConsecutiveTransfer( _firstToken_, _lastToken_, address( 0 ), toAddress_ );
    }

    /**
    * @dev Mints `qty_` tokens and transfers them to `toAddress_`.
    * 
    * This internal function can be used to perform token minting.
    * 
    * Emits one or more {Transfer} event.
    * 
    * @param toAddress_ : address receiving the NFTs
    * @param qty_       : number of NFTs being minted
    */
    function _mint( address toAddress_, uint256 qty_ ) internal virtual {
      if ( toAddress_ == address( 0 ) ) {
        revert IERC721_INVALID_TRANSFER();
      }

      uint256 _firstToken_ = _nextId;
      uint256 _nextStart_ = _firstToken_ + qty_;
      uint256 _lastToken_ = _nextStart_ - 1;

      _owners[ _firstToken_ ] = toAddress_;
      if ( _lastToken_ > _firstToken_ ) {
        _owners[ _lastToken_ ] = toAddress_;
      }
      _nextId = _nextStart_;

      if ( ! _checkOnERC721Received( address( 0 ), toAddress_, _firstToken_, "" ) ) {
        revert IERC721_NON_ERC721_RECEIVER( toAddress_ );
      }

      while ( _firstToken_ < _nextStart_ ) {
        emit Transfer( address( 0 ), toAddress_, _firstToken_ );
        unchecked {
          _firstToken_ ++;
        }
      }
    }

    /**
    * @dev Internal function returning the owner of the `tokenId_` token.
    * 
    * @param tokenId_ : identifier of the NFT
    * 
    * @return : address that owns the NFT
    */
    function _ownerOf( uint256 tokenId_ ) internal view virtual returns ( address ) {
      uint256 _tokenId_ = tokenId_;
      address _tokenOwner_ = _owners[ _tokenId_ ];
      while ( _tokenOwner_ == address( 0 ) ) {
        _tokenId_ --;
        _tokenOwner_ = _owners[ _tokenId_ ];
      }

      return _tokenOwner_;
    }

    /**
    * @dev Transfers `tokenId_` from `fromAddress_` to `toAddress_`.
    *
    * This internal function can be used to implement alternative mechanisms to perform 
    * token transfer, such as signature-based, or token burning.
    * 
    * @param fromAddress_ : previous owner of the NFT
    * @param toAddress_   : new owner of the NFT
    * @param tokenId_     : identifier of the NFT being transferred
    * 
    * Emits a {Transfer} event.
    */
    function _transfer( address fromAddress_, address toAddress_, uint256 tokenId_ ) internal virtual {
      _approvals[ tokenId_ ] = address( 0 );
      uint256 _previousId_ = tokenId_ > 1 ? tokenId_ - 1 : 1;
      uint256 _nextId_     = tokenId_ + 1;
      bool _previousShouldUpdate_ = _previousId_ < tokenId_ &&
                                    _exists( _previousId_ ) &&
                                    _owners[ _previousId_ ] == address( 0 );
      bool _nextShouldUpdate_ = _exists( _nextId_ ) &&
                                _owners[ _nextId_ ] == address( 0 );

      if ( _previousShouldUpdate_ ) {
        _owners[ _previousId_ ] = fromAddress_;
      }

      if ( _nextShouldUpdate_ ) {
        _owners[ _nextId_ ] = fromAddress_;
      }

      _owners[ tokenId_ ] = toAddress_;

      emit Transfer( fromAddress_, toAddress_, tokenId_ );
    }
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /**
      * @dev See {IERC721-approve}.
      */
      function approve( address to_, uint256 tokenId_ ) public virtual exists( tokenId_ ) {
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
      * @dev See {IERC721-safeTransferFrom}.
      * 
      * Note: We can ignore `from_` as we can compare everything to the actual token owner, 
      * but we cannot remove this parameter to stay in conformity with IERC721
      */
      function safeTransferFrom( address from_, address to_, uint256 tokenId_ ) public virtual override {
        safeTransferFrom( from_, to_, tokenId_, "" );
      }

      /**
      * @dev See {IERC721-safeTransferFrom}.
      * 
      * Note: We can ignore `from_` as we can compare everything to the actual token owner, 
      * but we cannot remove this parameter to stay in conformity with IERC721
      */
      function safeTransferFrom( address from_, address to_, uint256 tokenId_, bytes memory data_ ) public virtual override {
        transferFrom( from_, to_, tokenId_ );
        if ( ! _checkOnERC721Received( from_, to_, tokenId_, data_ ) ) {
          revert IERC721_NON_ERC721_RECEIVER( to_ );
        }
      }

      /**
      * @dev See {IERC721-setApprovalForAll}.
      */
      function setApprovalForAll( address operator_, bool approved_ ) public virtual override {
        address _account_ = msg.sender;
        if ( operator_ == _account_ ) {
          revert IERC721_INVALID_APPROVAL( operator_ );
        }

        _operatorApprovals[ _account_ ][ operator_ ] = approved_;
        emit ApprovalForAll( _account_, operator_, approved_ );
      }

      /**
      * @dev See {IERC721-transferFrom}.
      */
      function transferFrom( address from_, address to_, uint256 tokenId_ ) public virtual exists( tokenId_ ) {
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
    // ***********
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    /**
    * @notice Returns the total number of tokens minted
    * 
    * @return uint256 : the number of tokens that have been minted so far
    */
    function supplyMinted() public view virtual returns ( uint256 ) {
      return _nextId - 1;
    }

    // ***********
    // * IERC721 *
    // ***********
      /**
      * @dev See {IERC721-balanceOf}.
      */
      function balanceOf( address tokenOwner_ ) public view virtual returns ( uint256 ) {
        return _balanceOf( tokenOwner_ );
      }

      /**
      * @dev See {IERC721-getApproved}.
      */
      function getApproved( uint256 tokenId_ ) public view virtual exists( tokenId_ ) returns ( address ) {
        return _approvals[ tokenId_ ];
      }

      /**
      * @dev See {IERC721-isApprovedForAll}.
      */
      function isApprovedForAll( address tokenOwner_, address operator_ ) public view virtual returns ( bool ) {
        return _isApprovedForAll( tokenOwner_, operator_ );
      }

      /**
      * @dev See {IERC721-ownerOf}.
      */
      function ownerOf( uint256 tokenId_ ) public view virtual exists( tokenId_ ) returns ( address ) {
        return _ownerOf( tokenId_ );
      }
    // ***********

    // ***********
    // * IERC165 *
    // ***********
      /**
      * @dev See {IERC165-supportsInterface}.
      */
      function supportsInterface( bytes4 interfaceId_ ) public pure virtual override returns ( bool ) {
        return interfaceId_ == type( IERC721 ).interfaceId ||
               interfaceId_ == type( IERC165 ).interfaceId;
      }
    // ***********
  // **************************************
}
