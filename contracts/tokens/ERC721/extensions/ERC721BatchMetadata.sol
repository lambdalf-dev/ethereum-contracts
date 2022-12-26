// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../../interfaces/IERC721Metadata.sol';
import '../../../tokens/ERC721/ERC721Batch.sol';

abstract contract ERC721BatchMetadata is ERC721Batch, IERC721Metadata {
  string  public  name;
  string  public  symbol;
  string  internal _baseUri;

  /**
  * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
  */
  function __init_ERC721Metadata( string memory name_, string memory symbol_, string memory baseUri_ ) internal {
    name     = name_;
    symbol   = symbol_;
    _baseUri = baseUri_;
  }

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Converts a `uint256` to its ASCII `string` decimal representation.
    */
    function _toString( uint256 value_ ) internal pure virtual returns ( string memory str ) {
      assembly {
        // The maximum value of a uint256 contains 78 digits (1 byte per digit), but
        // we allocate 0xa0 bytes to keep the free memory pointer 32-byte word aligned.
        // We will need 1 word for the trailing zeros padding, 1 word for the length,
        // and 3 words for a maximum of 78 digits. Total: 5 * 0x20 = 0xa0.
        let m := add( mload( 0x40 ), 0xa0 )
        // Update the free memory pointer to allocate.
        mstore( 0x40, m )
        // Assign the `str` to the end.
        str := sub( m, 0x20 )
        // Zeroize the slot after the string.
        mstore( str, 0 )

        // Cache the end of the memory to calculate the length later.
        let end := str

        // We write the string from rightmost digit to leftmost digit.
        // The following is essentially a do-while loop that also handles the zero case.
        // prettier-ignore
        for { let temp := value_ } 1 {} {
          str := sub( str, 1 )
          // Write the character to the pointer.
          // The ASCII index of the '0' character is 48.
          mstore8( str, add( 48, mod( temp, 10 ) ) )
          // Keep dividing `temp` until zero.
          temp := div( temp, 10 )
          // prettier-ignore
          if iszero( temp ) { break }
        }

        let length := sub( end, str )
        // Move the pointer 32 bytes leftwards to make room for the length.
        str := sub( str, 0x20 )
        // Store the length.
        mstore( str, length )
      }
    }
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    // *******************
    // * IERC721Metadata *
    // *******************
      /**
      * @dev See {IERC721Metadata-tokenURI}.
      */
      function tokenURI( uint256 tokenId_ ) public view virtual override exists( tokenId_ ) returns ( string memory ) {
        return bytes( _baseUri ).length > 0 ? string( abi.encodePacked( _baseUri, _toString( tokenId_ ) ) ) : _toString( tokenId_ );
      }
    // *******************

    // ***********
    // * IERC165 *
    // ***********
      /**
      * @dev See {IERC165-supportsInterface}.
      */
      function supportsInterface( bytes4 interfaceId_ ) public pure virtual override returns ( bool ) {
        return interfaceId_ == type( IERC721Metadata ).interfaceId ||
               super.supportsInterface( interfaceId_ );
      }
    // ***********
  // **************************************
}