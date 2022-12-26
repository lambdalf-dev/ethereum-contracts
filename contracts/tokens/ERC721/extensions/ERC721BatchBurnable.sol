// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../ERC721Batch.sol";

abstract contract ERC721BatchBurnable is ERC721Batch {
  // List of burned tokens
  mapping( uint256 => bool ) private _burned;

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    /**
    * @dev Internal function returning whether a token exists. 
    * A token exists if it has been minted and is not owned by the null address.
    * 
    * @param tokenId_ uint256 ID of the token to verify
    * 
    * @return bool whether the token exists
    */
    function _exists( uint256 tokenId_ ) internal override view returns ( bool ) {
      bool _exists_ = ! _burned[ tokenId_ ] &&
                      super._exists( tokenId_ );
      return _exists_;
    }
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
  	/**
  	* @dev Burns `tokenId_`.
  	*
  	* Requirements:
  	*
  	* - `tokenId_` must exist
  	* - The caller must own `tokenId_` or be an approved operator
  	*/
  	function burn( uint256 tokenId_ ) public exists( tokenId_ ) {
      address _operator_ = msg.sender;
      address _tokenOwner_ = _ownerOf( tokenId_ );
      bool _isApproved_ = _isApprovedOrOwner( _tokenOwner_, _operator_, tokenId_ );

      if ( ! _isApproved_ ) {
        revert IERC721_CALLER_NOT_APPROVED( _tokenOwner_, _operator_, tokenId_ );
      }

      _burned[ tokenId_ ] = true;
  		_transfer( _tokenOwner_, address( 0 ), tokenId_ );
  	}
  // **************************************
}
