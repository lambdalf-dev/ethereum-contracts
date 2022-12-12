// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import '../../../interfaces/IERC721Metadata.sol';
import '../../../tokens/ERC721/Reg_ERC721Batch.sol';

abstract contract Reg_ERC721BatchMetadata is Reg_ERC721Batch, IERC721Metadata {
  string  public  name;
  string  public  symbol;
  string  private _baseUri;

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
