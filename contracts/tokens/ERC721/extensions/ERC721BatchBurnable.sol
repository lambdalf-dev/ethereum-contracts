// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity ^0.8.17;

import { ERC721Batch } from "../ERC721Batch.sol";
import { BitMaps } from "@openzeppelin/contracts/utils/structs/BitMaps.sol";

abstract contract ERC721BatchBurnable is ERC721Batch {
  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    // List of burned tokens
    BitMaps.BitMap private _burned;
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    // ***********************
    // * ERC721BatchBurnable *
    // ***********************
      /// @dev Burns `tokenId_`.
      ///
      /// Requirements:
      ///
      /// - `tokenId_` must exist
      /// - The caller must own `tokenId_` or be an approved operator
      function burn(uint256 tokenId_) public {
        address _tokenOwner_ = ownerOf(tokenId_);
        if (! _isApprovedOrOwner(_tokenOwner_, msg.sender, tokenId_)) {
          revert IERC721_CALLER_NOT_APPROVED(msg.sender, tokenId_);
        }
        BitMaps.set(_burned, tokenId_);
        _transfer(_tokenOwner_, address(0), tokenId_);
      }
    // ***********************

    // *********************
    // * IERC721Enumerable *
    // *********************
      /// @dev Enumerate valid NFTs
      /// 
      /// @param index_ the index requested
      /// 
      /// @return tokenId the identifier of the token at the specified index
      ///
      /// Requirements:
      /// 
      /// - `index_` must be less than {totalSupply()}
      function tokenByIndex(uint256 index_) public view virtual override returns (uint256 tokenId) {
        if (index_ >= _nextId - 1) {
          revert IERC721Enumerable_INDEX_OUT_OF_BOUNDS(index_);
        }
        uint256 _index_ = 1;
        tokenId = 1;
        while (tokenId < _nextId) {
          if (_exists(tokenId)) {
            if (_index_ - 1 == index_) {
              return tokenId;
            }
            unchecked {
              ++ _index_;
            }
          }
          unchecked {
            ++ tokenId;
          }
        }
      }

      /// @notice Count NFTs tracked by this contract
      /// 
      /// @return supply the number of NFTs in existence
      function totalSupply() public view override returns (uint256 supply) {
        uint256 _supplyMinted_ = super.totalSupply();
        uint256 _index_ = _supplyMinted_;
        supply = _supplyMinted_;
        while (_index_ > 0) {
          if (! _exists(_index_)) {
            unchecked {
              --supply;
            }
          }
          unchecked {
            --_index_;
          }
        }
      }
    // *********************
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Internal function returning whether a token exists. 
      /// A token exists if it has been minted and is not owned by the null address.
      /// 
      /// @param tokenId_ uint256 ID of the token to verify
      /// 
      /// @return tokenExist bool whether the token exists
      function _exists(uint256 tokenId_) internal override view returns (bool tokenExist) {
        return ! BitMaps.get(_burned, tokenId_) && super._exists(tokenId_);
      }
    // ***********
  // **************************************
}
