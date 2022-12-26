// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../../interfaces/IERC721Enumerable.sol';
import '../../../tokens/ERC721/ERC721Batch.sol';

/**
* @dev Required interface of an ERC721 compliant contract.
* This contract features:
* ~ Ultra Cheap batch minting
* ~ Implementation of EIP2309 https://eips.ethereum.org/EIPS/eip-2309
* 
* Note: This implementation imposes a very expensive `balanceOf()` and `ownerOf()`.
* It is not recommended to interract with those from another contract.
*/
abstract contract ERC721BatchEnumerable is ERC721Batch, IERC721Enumerable {
  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev See {IERC721Enumerable-totalSupply}.
    */
    function _totalSupply() internal view virtual returns ( uint256 ) {
      uint256 _supplyMinted_ = supplyMinted();
      uint256 _count_ = _supplyMinted_;
      uint256 _index_ = _supplyMinted_;

      while ( _index_ > 0 ) {
        if ( ! _exists( _index_ ) ) {
          unchecked {
            _count_ --;
          }
        }
        unchecked {
          _index_ --;
        }
      }
      return _count_;
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    // *********************
    // * IERC721Enumerable *
    // *********************
      /**
      * @dev See {IERC721Enumerable-tokenByIndex}.
      */
      function tokenByIndex( uint256 index_ ) public view virtual override returns ( uint256 ) {
        if ( index_ >= supplyMinted() ) {
          revert IERC721Enumerable_INDEX_OUT_OF_BOUNDS( index_ );
        }
        return index_ + 1;
      }

      /**
      * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
      */
      function tokenOfOwnerByIndex( address tokenOwner_, uint256 index_ ) public view virtual override returns ( uint256 tokenId ) {
        if ( index_ >= _balanceOf( tokenOwner_ ) ) {
          revert IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS( tokenOwner_, index_ );
        }

        uint256 _count_ = 0;
        uint256 _nextId_ = supplyMinted();
        for ( uint256 i = 1; i < _nextId_; i++ ) {
          if ( _exists( i ) && tokenOwner_ == _ownerOf( i ) ) {
            if ( index_ == _count_ ) {
              return i;
            }
            _count_++;
          }
        }
      }

      /**
      * @dev See {IERC721Enumerable-totalSupply}.
      */
      function totalSupply() public view virtual override returns ( uint256 ) {
        return _totalSupply();
      }
    // *********************

    // ***********
    // * IERC165 *
    // ***********
      /**
      * @dev See {IERC165-supportsInterface}.
      */
      function supportsInterface( bytes4 interfaceId_ ) public pure virtual override returns ( bool ) {
        return interfaceId_ == type( IERC721Enumerable ).interfaceId ||
               super.supportsInterface( interfaceId_ );
      }
    // ***********
  // **************************************
}
