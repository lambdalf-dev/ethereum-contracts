// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.17;

import "../../../interfaces/IERC721Enumerable.sol";
import "../../../tokens/ERC721/ERC721Batch.sol";

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
    * @dev Internal functions that counts the NFTs tracked by this contract.
    * 
    * @return the number of NFTs in existence
    */
    function _totalSupply() internal view virtual returns (uint256) {
      uint256 _supplyMinted_ = supplyMinted();
      uint256 _count_ = _supplyMinted_;
      uint256 _index_ = _supplyMinted_;

      while (_index_ > 0) {
        if (! _exists(_index_)) {
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
      * @notice Enumerate valid NFTs
      * @dev Throws if `index_` >= {totalSupply()}.
      * 
      * @param index_ the index requested
      * 
      * @return the identifier of the token at the specified index
      */
      function tokenByIndex(uint256 index_) public view virtual override returns (uint256) {
        if (index_ >= supplyMinted()) {
          revert IERC721Enumerable_INDEX_OUT_OF_BOUNDS(index_);
        }
        return index_ + 1;
      }
      /**
      * @notice Enumerate NFTs assigned to an owner
      * @dev Throws if `index_` >= {balanceOf(owner_)} or if `owner_` is the zero address, representing invalid NFTs.
      * 
      * @param tokenOwner_ the address requested
      * @param index_ the index requested
      * 
      * @return the identifier of the token at the specified index
      */
      function tokenOfOwnerByIndex(address tokenOwner_, uint256 index_) public view virtual override returns (uint256) {
        if (index_ >= _balanceOf(tokenOwner_)) {
          revert IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS(tokenOwner_, index_);
        }

        uint256 _count_ = 0;
        uint256 _nextId_ = supplyMinted();
        for (uint256 i = 1; i < _nextId_; i++) {
          if (_exists(i) && tokenOwner_ == _ownerOf(i)) {
            if (index_ == _count_) {
              return i;
            }
            _count_++;
          }
        }
      }
      /**
      * @notice Count NFTs tracked by this contract
      * 
      * @return the number of NFTs in existence
      */
      function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply();
      }
    // *********************
  // **************************************
}
