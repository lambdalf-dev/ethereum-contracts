// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../ERC1155.sol';
import '../../../interfaces/IERC1155MetadataURI.sol';

abstract contract ERC1155MetadataURI is IERC1155MetadataURI, ERC1155 {
  string  private _baseUri;

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Sets the token URI.
    * 
    * @param baseUri_ the new URI
    * 
    * Emits a {IERC1155.URI} event
    */
    function _setUri( string memory baseUri_ ) internal {
      _baseUri = baseUri_;
      emit URI( _baseUri, DEFAULT_SERIES );
    }

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
    // ***********************
    // * IERC1155MetadataURI *
    // ***********************
      /**
      * @dev See {IERC1155MetadataURI-uri}.
      */
      function uri( uint256 tokenId_ ) public view virtual override isValidSeries( tokenId_ ) returns ( string memory ) {
        return bytes( _baseUri ).length > 0 ? string( abi.encodePacked( _baseUri, _toString( tokenId_ ) ) ) : _toString( tokenId_ );
      }
    // *******************
  // **************************************
}
