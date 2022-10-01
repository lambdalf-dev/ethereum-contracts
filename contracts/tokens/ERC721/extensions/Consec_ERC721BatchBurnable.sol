// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../Consec_ERC721Batch.sol";

abstract contract Consec_ERC721BatchBurnable is Consec_ERC721Batch {
  // List of burned tokens
  mapping( uint256 => bool ) private _burned;

	/**
	* @dev Burns `tokenId_`.
	*
	* Requirements:
	*
	* - `tokenId_` must exist
	* - The caller must own `tokenId_` or be an approved operator
	*/
	function burn( uint256 tokenId_ ) public exists( tokenId_ ) {
    address _operator_ = _msgSender();
    address _tokenOwner_ = _ownerOf( tokenId_ );
    bool _isApproved_ = _isApprovedOrOwner( _tokenOwner_, _operator_, tokenId_ );

    if ( ! _isApproved_ ) {
      revert IERC721_CALLER_NOT_APPROVED( _tokenOwner_, _operator_, tokenId_ );
    }

    _burned[ tokenId_ ] = true;
		_transfer( _tokenOwner_, address( 0 ), tokenId_ );
	}

  /**
  * @dev See {IERC721Enumerable-totalSupply}.
  */
  function _totalSupply() internal view virtual override returns ( uint256 ) {
    uint256 _supplyMinted_ = supplyMinted();
    uint256 _count_ = _supplyMinted_;
    uint256 i = _supplyMinted_;

    while ( i > 0 ) {
      if ( ! _exists( i ) ) {
        _count_ --;
      }
      i --;
    }
    return _count_;
  }

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
}
