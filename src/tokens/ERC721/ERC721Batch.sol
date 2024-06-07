// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity ^0.8.17;

import { IERC721 } from "../../interfaces/IERC721.sol";
import { IERC721Metadata } from "../../interfaces/IERC721Metadata.sol";
import { IERC721Enumerable } from "../../interfaces/IERC721Enumerable.sol";
import { IERC721Receiver } from "../../interfaces/IERC721Receiver.sol";
import { IERC2309 } from "../../interfaces/IERC2309.sol";

/// @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard.
/// @dev This contract does not implement ERC165, unlike the ERC721 specification recommends,
///   to simplify inheritance tree. Remember to implement it in the final contract.
///   Note: this implementation has a very inefficient {balanceOf} function.
abstract contract ERC721Batch is
IERC721, IERC721Metadata, IERC721Enumerable, IERC2309 {
  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Identifier of the next token to be minted
      uint256 internal _nextId = 1;
      /// @dev Token ID mapped to approved address
      mapping(uint256 => address) internal _approvals;
      /// @dev Token owner mapped to operator approvals
      mapping(address => mapping(address => bool)) internal _operatorApprovals;
      /// @dev List of owner addresses
      mapping(uint256 => address) internal _owners;
    // ***********

    // *******************
    // * IERC721Metadata *
    // *******************
      /// @dev The token's base URI.
      string internal _baseUri;
      /// @dev The name of the tokens, for token trackers.
      string internal _name;
      /// @dev The symbol of the tokens, for token trackers.
      string internal _symbol;
    // *******************
  // **************************************

  constructor(string memory name_, string memory symbol_) {
    _name = name_;
    _symbol = symbol_;
  }

  // **************************************
  // *****          MODIFIER          *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Throws if `tokenId_` doesn't exist. 
      /// A token exists if it has been minted and is not owned by the zero address.
      /// 
      /// @param tokenId_ identifier of the NFT being referenced
      modifier exists(uint256 tokenId_) {
        if (! _exists(tokenId_)) {
          revert IERC721_NONEXISTANT_TOKEN(tokenId_);
        }
        _;
      }
    // ***********
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Gives permission to `to_` to transfer the token number `tokenId_` on behalf of its owner.
      /// The approval is cleared when the token is transferred.
      /// 
      /// Only a single account can be approved at a time, so approving the zero address clears previous approvals.
      /// 
      /// @param to_ The new approved NFT controller
      /// @param tokenId_ The NFT to approve
      /// 
      /// Requirements:
      /// 
      /// - The token number `tokenId_` must exist.
      /// - The caller must own the token or be an approved operator.
      /// - Must emit an {Approval} event.
      function approve(address to_, uint256 tokenId_) public virtual override {
        address _tokenOwner_ = ownerOf(tokenId_);
        if (to_ == _tokenOwner_) {
          revert IERC721_INVALID_APPROVAL();
        }
        bool _isApproved_ = isApprovedForAll(_tokenOwner_, msg.sender);
        if (msg.sender != _tokenOwner_ && ! _isApproved_) {
          revert IERC721_CALLER_NOT_APPROVED(msg.sender, tokenId_);
        }
        _approvals[tokenId_] = to_;
        emit Approval(_tokenOwner_, to_, tokenId_);
      }
      /// @dev Transfers the token number `tokenId_` from `from_` to `to_`.
      /// 
      /// @param from_ The current owner of the NFT
      /// @param to_ The new owner
      /// @param tokenId_ identifier of the NFT being referenced
      /// 
      /// Requirements:
      /// 
      /// - The token number `tokenId_` must exist.
      /// - `from_` must be the token owner.
      /// - The caller must own the token or be an approved operator.
      /// - `to_` must not be the zero address.
      /// - If `to_` is a contract, it must implement {IERC721Receiver-onERC721Received} with a return value of `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`,
      /// - Must emit a {Transfer} event.
      function safeTransferFrom(address from_, address to_, uint256 tokenId_) public virtual override {
        safeTransferFrom(from_, to_, tokenId_, "");
      }
      /// @dev Transfers the token number `tokenId_` from `from_` to `to_`.
      /// 
      /// @param from_ The current owner of the NFT
      /// @param to_ The new owner
      /// @param tokenId_ identifier of the NFT being referenced
      /// @param data_ Additional data with no specified format, sent in call to `to_`
      /// 
      /// Requirements:
      /// 
      /// - The token number `tokenId_` must exist.
      /// - `from_` must be the token owner.
      /// - The caller must own the token or be an approved operator.
      /// - `to_` must not be the zero address.
      /// - If `to_` is a contract, it must implement {IERC721Receiver-onERC721Received} with a return value of `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`,
      /// - Must emit a {Transfer} event.
      function safeTransferFrom(address from_, address to_, uint256 tokenId_, bytes memory data_) public virtual override {
        transferFrom(from_, to_, tokenId_);
        if (! _checkOnERC721Received(from_, to_, tokenId_, data_)) {
          revert IERC721_INVALID_RECEIVER(to_);
        }
      }
      /// @dev Allows or disallows `operator_` to manage the caller's tokens on their behalf.
      /// 
      /// @param operator_ Address to add to the set of authorized operators
      /// @param approved_ True if the operator is approved, false to revoke approval
      /// 
      /// Requirements:
      /// 
      /// - Must emit an {ApprovalForAll} event.
      function setApprovalForAll(address operator_, bool approved_) public virtual override {
        if (operator_ == msg.sender) {
          revert IERC721_INVALID_APPROVAL();
        }
        _operatorApprovals[msg.sender][operator_] = approved_;
        emit ApprovalForAll(msg.sender, operator_, approved_);
      }
      /// @dev Transfers the token number `tokenId_` from `from_` to `to_`.
      /// 
      /// @param from_ the current owner of the NFT
      /// @param to_ the new owner
      /// @param tokenId_ identifier of the NFT being referenced
      /// 
      /// Requirements:
      /// 
      /// - The token number `tokenId_` must exist.
      /// - `from_` must be the token owner.
      /// - The caller must own the token or be an approved operator.
      /// - `to_` must not be the zero address.
      /// - Must emit a {Transfer} event.
      function transferFrom(address from_, address to_, uint256 tokenId_) public virtual override {
        if (to_ == address(0)) {
          revert IERC721_INVALID_RECEIVER(to_);
        }
        address _tokenOwner_ = ownerOf(tokenId_);
        if (from_ != _tokenOwner_) {
          revert IERC721_INVALID_TOKEN_OWNER();
        }
        if (! _isApprovedOrOwner(_tokenOwner_, msg.sender, tokenId_)) {
          revert IERC721_CALLER_NOT_APPROVED(msg.sender, tokenId_);
        }
        _transfer(from_, to_, tokenId_);
      }
    // ***********
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Returns the number of tokens in `tokenOwner_`'s account.
      /// 
      /// @param tokenOwner_ address that owns tokens
      /// 
      /// @return ownerBalance the nomber of tokens owned by `tokenOwner_`
      /// 
      /// Requirements:
      /// 
      /// - `tokenOwner_` must not be the zero address
      function balanceOf(address tokenOwner_) public view virtual override returns (uint256 ownerBalance) {
        if (tokenOwner_ == address(0)) {
          revert IERC721_INVALID_TOKEN_OWNER();
        }
        address _currentTokenOwner_;
        uint256 _index_ = 1;
        while (_index_ < _nextId) {
          if (_exists(_index_)) {
            if (_owners[_index_] != address(0)) {
              _currentTokenOwner_ = _owners[_index_];
            }
            if (tokenOwner_ == _currentTokenOwner_) {
              unchecked {
                ++ownerBalance;
              }
            }
          }
          unchecked {
            ++_index_;
          }
        }
      }
      /// @dev Returns the address that has been specifically allowed to manage `tokenId_` on behalf of its owner.
      /// 
      /// @param tokenId_ the NFT that has been approved
      /// 
      /// @return approved the address allowed to manage `tokenId_`
      /// 
      /// Requirements:
      /// 
      /// - `tokenId_` must exist.
      /// 
      /// Note: See {Approve}
      function getApproved(uint256 tokenId_) public view virtual override exists(tokenId_) returns (address approved) {
        return _approvals[tokenId_];
      }
      /// @dev Returns whether `operator_` is allowed to manage tokens on behalf of `tokenOwner_`.
      /// 
      /// @param tokenOwner_ address that owns tokens
      /// @param operator_ address that tries to manage tokens
      /// 
      /// @return isApproved whether `operator_` is allowed to handle `tokenOwner`'s tokens
      /// 
      /// Note: See {setApprovalForAll}
      function isApprovedForAll(address tokenOwner_, address operator_) public view virtual override returns (bool isApproved) {
        return _operatorApprovals[tokenOwner_][operator_];
      }
      /// @dev Returns the owner of the token number `tokenId_`.
      /// 
      /// @param tokenId_ the NFT to verify ownership of
      /// 
      /// @return tokenOwner the owner of token number `tokenId_`
      /// 
      /// Requirements:
      /// 
      /// - `tokenId_` must exist.
      function ownerOf(uint256 tokenId_) public view virtual override exists(tokenId_) returns (address tokenOwner) {
        uint256 _tokenId_ = tokenId_;
        tokenOwner = _owners[_tokenId_];
        while (tokenOwner == address(0)) {
          unchecked {
            --_tokenId_;
          }
          tokenOwner = _owners[_tokenId_];
        }
      }
    // ***********

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
      function tokenByIndex(uint256 index_) public view virtual override returns (uint256) {
        if (index_ >= _nextId - 1) {
          revert IERC721Enumerable_INDEX_OUT_OF_BOUNDS(index_);
        }
        return index_ + 1;
      }
      /// @dev Enumerate NFTs assigned to an owner
      /// 
      /// @param tokenOwner_ the address requested
      /// @param index_ the index requested
      /// 
      /// @return tokenId the identifier of the token at the specified index
      ///
      /// Requirements:
      /// 
      /// - `index_` must be less than {balanceOf(tokenOwner_)}
      /// - `tokenOwner_` must not be the zero address
      function tokenOfOwnerByIndex(address tokenOwner_, uint256 index_) public view virtual override returns (uint256) {
        if (tokenOwner_ == address(0)) {
          revert IERC721_INVALID_TOKEN_OWNER();
        }
        address _currentTokenOwner_;
        uint256 _index_ = 1;
        uint256 _ownerBalance_;
        while (_index_ < _nextId) {
          if (_exists(_index_)) {
            if (_owners[_index_] != address(0)) {
              _currentTokenOwner_ = _owners[_index_];
            }
            if (tokenOwner_ == _currentTokenOwner_) {
              if (index_ == _ownerBalance_) {
                return _index_;
              }
              unchecked {
                ++_ownerBalance_;
              }
            }
          }
          unchecked {
            ++_index_;
          }
        }
        revert IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS(index_);
      }
      /// @notice Count NFTs tracked by this contract
      /// 
      /// @return supply the number of NFTs in existence
      function totalSupply() public view virtual override returns (uint256 supply) {
        return _nextId - 1;
      }
    // *********************

    // *******************
    // * IERC721Metadata *
    // *******************
      /// @dev A descriptive name for a collection of NFTs in this contract
      /// 
      /// @return tokenName The descriptive name of the NFTs
      function name() public view virtual override returns (string memory tokenName) {
        return _name;
      }
      /// @dev An abbreviated name for NFTs in this contract
      /// 
      /// @return tokenSymbol The abbreviated name of the NFTs
      function symbol() public view virtual override returns (string memory tokenSymbol) {
        return _symbol;
      }
      /// @dev A distinct Uniform Resource Identifier (URI) for a given asset.
      /// 
      /// @param tokenId_ the NFT that has been approved
      /// 
      /// @return uri the URI of the token
      /// 
      /// Requirements:
      /// 
      /// - `tokenId_` must exist.
      function tokenURI(uint256 tokenId_) public view virtual override exists(tokenId_) returns (string memory uri) {
        return /*bytes(_baseUri).length > 0 ?*/ string(abi.encodePacked(_baseUri, _toString(tokenId_))) /*: _toString(tokenId_)*/;
      }
    // *******************
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    // ***********
    // * IERC721 *
    // ***********
      /// @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
      /// The call is not executed if the target address is not a contract.
      /// 
      /// @param from_ address owning the token being transferred
      /// @param to_ address the token is being transferred to
      /// @param tokenId_ identifier of the NFT being referenced
      /// @param data_ optional data to send along with the call
      /// 
      /// @return isValidReceiver whether the call correctly returned the expected value
      function _checkOnERC721Received(address from_, address to_, uint256 tokenId_, bytes memory data_) internal virtual returns (bool isValidReceiver) {
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
          _size_ := extcodesize(to_)
        }
        // If address is a contract, check that it is aware of how to handle ERC721 tokens
        if (_size_ > 0) {
          try IERC721Receiver(to_).onERC721Received(msg.sender, from_, tokenId_, data_) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
          }
          catch (bytes memory reason) {
            if (reason.length == 0) {
              revert IERC721_INVALID_RECEIVER(to_);
            }
            else {
              assembly {
                revert(add(32, reason), mload(reason))
              }
            }
          }
        }
        else {
          return true;
        }
      }
      /// @dev Internal function returning whether a token exists. 
      /// A token exists if it has been minted and is not owned by the zero address.
      /// 
      /// @param tokenId_ identifier of the NFT being referenced
      /// 
      /// @return tokenExist whether the token exists
      function _exists(uint256 tokenId_) internal view virtual returns (bool tokenExist) {
        if (tokenId_ == 0) {
          return false;
        }
        return tokenId_ < _nextId;
      }
      /// @dev Internal function returning whether `operator_` is allowed to handle `tokenId_`
      /// 
      /// Note: To avoid multiple checks for the same data, it is assumed 
      /// that existence of `tokenId_` has been verified prior via {_exists}
      /// If it hasn't been verified, this function might panic
      /// 
      /// @param operator_ address that tries to handle the token
      /// @param tokenId_ identifier of the NFT being referenced
      /// 
      /// @return isApproved whether `operator_` is allowed to manage the token
      function _isApprovedOrOwner(address tokenOwner_, address operator_, uint256 tokenId_) internal view virtual returns (bool isApproved) {
        return 
          operator_ == tokenOwner_ ||
          operator_ == getApproved(tokenId_) ||
          _operatorApprovals[tokenOwner_][operator_];
      }
      /// @dev Mints `qty_` tokens and transfers them to `toAddress_`.
      /// 
      /// Emits one or more {Transfer} event.
      /// 
      /// @param toAddress_ address receiving the NFTs
      /// @param qty_ number of NFTs being minted
      function _mint(address toAddress_, uint256 qty_) internal virtual {
        uint256 _firstToken_ = _nextId;
        uint256 _nextStart_ = _firstToken_ + qty_;
        uint256 _lastToken_ = _nextStart_ - 1;
        _owners[_firstToken_] = toAddress_;
        if (_lastToken_ > _firstToken_) {
          _owners[_lastToken_] = toAddress_;
        }
        _nextId = _nextStart_;
        while (_firstToken_ < _nextStart_) {
          emit Transfer(address(0), toAddress_, _firstToken_);
          unchecked {
            ++_firstToken_;
          }
        }
      }
      /// @dev Mints `qty_` tokens and transfers them to `toAddress_`.
      /// 
      /// Emits a {ConsecutiveTransfer} event.
      /// 
      /// @param toAddress_ address receiving the NFTs
      /// @param qty_ number of NFTs being minted
      function _mint2309(address toAddress_, uint256 qty_) internal virtual {
        uint256 _firstToken_ = _nextId;
        uint256 _nextStart_ = _firstToken_ + qty_;
        uint256 _lastToken_ = _nextStart_ - 1;
        _owners[_firstToken_] = toAddress_;
        if (_lastToken_ > _firstToken_) {
          _owners[_lastToken_] = toAddress_;
        }
        _nextId = _nextStart_;
        emit ConsecutiveTransfer(_firstToken_, _lastToken_, address(0), toAddress_);
      }
      /// @dev Transfers `tokenId_` from `fromAddress_` to `toAddress_`.
      ///
      /// Emits a {Transfer} event.
      /// 
      /// @param fromAddress_ the current owner of the NFT
      /// @param toAddress_ the new owner
      /// @param tokenId_ identifier of the NFT being referenced
      function _transfer(address fromAddress_, address toAddress_, uint256 tokenId_) internal virtual {
        _approvals[tokenId_] = address(0);
        uint256 _previousId_ = tokenId_ > 1 ? tokenId_ - 1 : 1;
        uint256 _nextId_ = tokenId_ + 1;
        bool _previousShouldUpdate_ =
          _previousId_ < tokenId_ &&
          _exists(_previousId_) &&
          _owners[_previousId_] == address(0);
        bool _nextShouldUpdate_ =
          _exists(_nextId_) &&
          _owners[_nextId_] == address(0);
        if (_previousShouldUpdate_) {
          _owners[_previousId_] = fromAddress_;
        }
        if (_nextShouldUpdate_) {
          _owners[_nextId_] = fromAddress_;
        }
        _owners[tokenId_] = toAddress_;
        emit Transfer(fromAddress_, toAddress_, tokenId_);
      }
    // ***********

    // *******************
    // * IERC721Metadata *
    // *******************
      /// @notice Updates the baseUri for the tokens.
      /// 
      /// @param newBaseUri_ the new baseUri for the tokens
      /// 
      /// Requirements:
      /// 
      /// - Caller must be the contract owner.
      function _setBaseUri(string memory newBaseUri_) internal virtual {
        _baseUri = newBaseUri_;
      }
      /// @dev Converts a `uint256` to its ASCII `string` decimal representation.
      /// 
      /// @param value_ the value to convert to string.
      /// 
      /// @return str the string representation of `value_`
      function _toString(uint256 value_) internal pure virtual returns (string memory str) {
        assembly {
          // The maximum value of a uint256 contains 78 digits (1 byte per digit), but
          // we allocate 0xa0 bytes to keep the free memory pointer 32-byte word aligned.
          // We will need 1 word for the trailing zeros padding, 1 word for the length,
          // and 3 words for a maximum of 78 digits. Total: 5 * 0x20 = 0xa0.
          let m := add(mload(0x40), 0xa0)
          // Update the free memory pointer to allocate.
          mstore(0x40, m)
          // Assign the `str` to the end.
          str := sub(m, 0x20)
          // Zeroize the slot after the string.
          mstore(str, 0)

          // Cache the end of the memory to calculate the length later.
          let end := str

          // We write the string from rightmost digit to leftmost digit.
          // The following is essentially a do-while loop that also handles the zero case.
          // prettier-ignore
          for { let temp := value_ } 1 {} { // solhint-disable-line
            str := sub(str, 1)
            // Write the character to the pointer.
            // The ASCII index of the '0' character is 48.
            mstore8(str, add(48, mod(temp, 10)))
            // Keep dividing `temp` until zero.
            temp := div(temp, 10)
            // prettier-ignore
            if iszero(temp) { break }
          }

          let length := sub(end, str)
          // Move the pointer 32 bytes leftwards to make room for the length.
          str := sub(str, 0x20)
          // Store the length.
          mstore(str, length)
        }
      }
    // *******************
  // **************************************
}
