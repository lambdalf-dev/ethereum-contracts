// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity ^0.8.17;

import { IArrays } from "../../interfaces/IArrays.sol";
import { IERC1155 } from "../../interfaces/IERC1155.sol";
import { IERC1155MetadataURI } from "../../interfaces/IERC1155MetadataURI.sol";
import { IERC1155Receiver } from "../../interfaces/IERC1155Receiver.sol";
import { BitMaps } from "@openzeppelin/contracts/utils/structs/BitMaps.sol";

/// @dev Implementation of https://eips.ethereum.org/EIPS/eip-1155[ERC1155] Semi-Fungible Token Standard.
/// @dev This contract does not implement ERC165, unlike the ERC1155 specification recommends,
///   to simplify inheritance tree. Remember to implement it in the final contract.
abstract contract ERC1155 is
IERC1155, IERC1155MetadataURI, IArrays {
  // **************************************
  // *****    BYTECODE  VARIABLES     *****
  // **************************************
    // ************
    // * IERC1155 *
    // ************
      /// @dev A default series ID for emission of the {URI} event
      uint public constant DEFAULT_SERIES = 0;
    // ************
  // **************************************

  // **************************************
  // *****     STORAGE VARIABLES      *****
  // **************************************
    // ************
    // * IERC1155 *
    // ************
      /// @dev List of valid series ID
      BitMaps.BitMap private _validSeries;
      /// @dev Series ID mapped to balances
      mapping(uint256 => mapping(address => uint256)) private _balances;
      /// @dev Token owner mapped to operator approvals
      mapping(address => mapping(address => bool)) private _operatorApprovals;
    // ************

    // ***********************
    // * IERC1155MetadataURI *
    // ***********************
      /// @dev The token's base URI.
      string private _baseUri;
    // ***********************
  // **************************************

  // **************************************
  // *****          MODIFIER          *****
  // **************************************
    // ************
    // * IERC1155 *
    // ************
      /// @dev Ensures that `id_` is a valid series
      /// 
      /// @param id_ : the series id to validate 
      modifier isValidSeries(uint256 id_) {
        if (! BitMaps.get(_validSeries, id_)) {
          revert IERC1155_NON_EXISTANT_TOKEN(id_);
        }
        _;
      }
    // ************
  // **************************************

  // **************************************
  // *****           PUBLIC           *****
  // **************************************
    // ************
    // * IERC1155 *
    // ************
      /// @dev Transfers `amounts_` amount(s) of `ids_` from the `from_` address to the `to_` address specified
      /// 
      /// @param from_ Source address
      /// @param to_ Target address
      /// @param ids_ IDs of each token type (order and length must match `amounts_` array)
      /// @param amounts_ Transfer amounts per token type (order and length must match `ids_` array)
      /// @param data_ Additional data with no specified format,
      ///   MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `to_`
      /// 
      /// Requirements:
      /// 
      /// - Caller must be approved to manage the tokens being transferred out of the `from_` account
      ///   (see "Approval" section of the standard).
      /// - MUST revert if `to_` is the zero address.
      /// - MUST revert if length of `ids_` is not the same as length of `amounts_`.
      /// - MUST revert if any of the balance(s) of the holder(s) for token(s) in `ids_` is
      ///   lower than the respective amount(s) in `amounts_` sent to the recipient.
      /// - MUST revert on any other error.        
      /// - MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected
      ///   (see "Safe Transfer Rules" section of the standard).
      /// - Balance changes and events MUST follow the ordering of the arrays
      ///   (_ids[0]/_amounts[0] before ids_[1]/_amounts[1], etc).
      /// - After the above conditions for the transfer(s) in the batch are met,
      ///   this function MUST check if `to_` is a smart contract (e.g. code size > 0).
      ///   If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `to_` and act appropriately
      ///   (see "Safe Transfer Rules" section of the standard).                      
      function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] calldata ids_,
        uint256[] calldata amounts_,
        bytes calldata data_
      ) external override {
        if (to_ == address(0)) {
          revert IERC1155_INVALID_RECEIVER(to_);
        }
        uint256 _len_ = ids_.length;
        if (amounts_.length != _len_) {
          revert ARRAY_LENGTH_MISMATCH();
        }
        address _operator_ = msg.sender;
        if (! _isApprovedOrOwner(from_, _operator_)) {
          revert IERC1155_CALLER_NOT_APPROVED(from_, _operator_);
        }
        for (uint256 i; i < _len_;) {
          if (! exists(ids_[i])) {
            revert IERC1155_NON_EXISTANT_TOKEN(ids_[i]);
          }
          uint256 _balance_ = _balances[ids_[i]][from_];
          if (_balance_ < amounts_[i]) {
            revert IERC1155_INSUFFICIENT_BALANCE(from_, ids_[i]);
          }
          unchecked {
            _balances[ids_[i]][from_] = _balance_ - amounts_[i];
          }
          _balances[ids_[i]][to_] += amounts_[i];
          unchecked {
            ++i;
          }
        }
        emit TransferBatch(_operator_, from_, to_, ids_, amounts_);
        _doSafeBatchTransferAcceptanceCheck(_operator_, from_, to_, ids_, amounts_, data_);
      }
      /// @dev Transfers `amount_` amount of an `id_` from the `from_` address to the `to_` address specified
      /// 
      /// @param from_ Source address
      /// @param to_ Target address
      /// @param id_ ID of the token type
      /// @param amount_ Transfer amount
      /// @param data_ Additional data with no specified format,
      ///   MUST be sent unaltered in call to `onERC1155Received` on `to_`
      /// 
      /// Requirements:
      /// 
      /// - Caller must be approved to manage the tokens being transferred out of the `from_` account
      ///   (see "Approval" section of the standard).
      /// - MUST revert if `to_` is the zero address.
      /// - MUST revert if balance of holder for token type `id_` is lower than the `amount_` sent.
      /// - MUST revert on any other error.
      /// - MUST emit the `TransferSingle` event to reflect the balance change
      ///   (see "Safe Transfer Rules" section of the standard).
      /// - After the above conditions are met,
      ///   this function MUST check if `to_` is a smart contract (e.g. code size > 0).
      ///   If so, it MUST call `onERC1155Received` on `to_` and act appropriately
      ///   (see "Safe Transfer Rules" section of the standard).        
      function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes calldata data_
      ) external override isValidSeries(id_) {
        if (to_ == address(0)) {
          revert IERC1155_INVALID_RECEIVER(to_);
        }
        address _operator_ = msg.sender;
        if (! _isApprovedOrOwner(from_, _operator_)) {
          revert IERC1155_CALLER_NOT_APPROVED(from_, _operator_);
        }
        uint256 _balance_ = _balances[id_][from_];
        if (_balance_ < amount_) {
          revert IERC1155_INSUFFICIENT_BALANCE(from_, id_);
        }
        unchecked {
          _balances[id_][from_] = _balance_ - amount_;
        }
        _balances[id_][to_] += amount_;
        emit TransferSingle(_operator_, from_, to_, id_, amount_);
        _doSafeTransferAcceptanceCheck(_operator_, from_, to_, id_, amount_, data_);
      }
      /// @dev Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
      /// 
      /// @param operator_  Address to add to the set of authorized operators
      /// @param approved_  True if the operator is approved, false to revoke approval
      /// 
      /// Requirements:
      /// 
      /// - MUST emit the ApprovalForAll event on success.
      function setApprovalForAll(address operator_, bool approved_) external override {
        address _tokenOwner_ = msg.sender;
        if (_tokenOwner_ == operator_) {
          revert IERC1155_INVALID_APPROVAL();
        }
        _operatorApprovals[_tokenOwner_][operator_] = approved_;
        emit ApprovalForAll(_tokenOwner_, operator_, approved_);
      }
    // ************
  // **************************************

  // **************************************
  // *****            VIEW            *****
  // **************************************
    // ***********
    // * ERC1155 *
    // ***********
      /// @dev Returns whether `id_` is an existing series.
      /// 
      /// @param id_ the type of token being requested
      ///
      /// @return isValid whether `id_` is a valid series ID
      function exists(uint256 id_) public view returns (bool isValid) {
        isValid = BitMaps.get(_validSeries, id_);
      }
    // ***********

    // ************
    // * IERC1155 *
    // ************
      /// @dev Get the balance of an account's tokens.
      /// 
      /// @param owner_ The address of the token holder
      /// @param id_ ID of the token type
      /// 
      /// @return ownerBalance The owner's balance of the token type requested
      function balanceOf(address owner_, uint256 id_) public view override isValidSeries(id_) returns (uint256 ownerBalance) {
        ownerBalance = _balances[id_][owner_];
      }
      /// @dev Get the balance of multiple account/token pairs
      /// 
      /// @param owners_ The addresses of the token holders
      /// @param ids_ ID of the token types
      /// 
      /// @return ownerBalances The owners' balance of the token types requested (i.e. balance for each (owner, id) pair)
      function balanceOfBatch(
        address[] calldata owners_,
        uint256[] calldata ids_
      ) public view override returns (uint256[] memory ownerBalances) {
        uint256 _len_ = owners_.length;
        if (_len_ != ids_.length) {
          revert ARRAY_LENGTH_MISMATCH();
        }
        ownerBalances = new uint256[](_len_);
        while (_len_ > 0) {
          unchecked {
            --_len_;
          }
          if (! exists(ids_[_len_])) {
            revert IERC1155_NON_EXISTANT_TOKEN(ids_[_len_]);
          }
          ownerBalances[_len_] = _balances[ids_[_len_]][owners_[_len_]];
        }
      }
      /// @dev Queries the approval status of an operator for a given owner.
      /// 
      /// @param owner_ The owner of the tokens
      /// @param operator_ Address of authorized operator
      /// 
      /// @return isApproved True if the operator is approved, false if not
      function isApprovedForAll(address owner_, address operator_) public view override returns (bool isApproved) {
        isApproved = _operatorApprovals[owner_][operator_];
      }
    // ************

    // ***********************
    // * IERC1155MetadataURI *
    // ***********************
      /// @dev Returns the URI for token type `id_`.
      /// 
      /// @param id_ the identifier of the token being requested
      ///
      /// @return url the URI of the token
      function uri(uint256 id_) public view virtual override isValidSeries(id_) returns (string memory url) {
        url = /*bytes(_baseUri).length > 0 ?*/ string(abi.encodePacked(_baseUri, _toString(id_))) /*: _toString(id_)*/;
      }
    // *******************
  // **************************************

  // **************************************
  // *****          INTERNAL          *****
  // **************************************
    // ************
    // * IERC1155 *
    // ************
      /// @dev Internal function that creates a new series
      /// 
      /// @param id_ the new series ID
      /// 
      /// Requirements:
      /// 
      /// - `id_` must not be a valid series ID
      function _createSeries(uint256 id_) internal {
        if (exists(id_)) {
          revert IERC1155_EXISTANT_TOKEN(id_);
        }
        BitMaps.set(_validSeries, id_);
      }
      /// @dev Internal function that checks if the receiver is a smart contract able to handle batches of IERC1155 tokens.
      /// 
      /// @param operator_ address that sent the order
      /// @param from_ address tokens are being transferred from
      /// @param to_ address tokens are being transferred to
      /// @param ids_ identifiers of the tokens being transferred
      /// @param amounts_ amounts of tokens being transferred
      /// @param data_ optional data to send along with the call
      function _doSafeBatchTransferAcceptanceCheck(
        address operator_,
        address from_,
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_,
        bytes memory data_
      ) private {
        uint256 _size_;
        assembly {
          _size_ := extcodesize(to_)
        }
        if (_size_ > 0) {
          try IERC1155Receiver(to_)
            .onERC1155BatchReceived(operator_, from_, ids_, amounts_, data_) returns (bytes4 response) {
            if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
              revert IERC1155_INVALID_RECEIVER(to_);
            }
          }
          catch (bytes memory reason) {
            if (reason.length == 0) {
              revert IERC1155_INVALID_RECEIVER(to_);
            }
            else {
              assembly {
                revert(add(32, reason), mload(reason))
              }
            }
          }
        }
      }
      /// @dev Internal function that checks if the receiver is a smart contract able to handle IERC1155 tokens.
      /// 
      /// @param operator_ address that sent the order
      /// @param from_ address tokens are being transferred from
      /// @param to_ address tokens are being transferred to
      /// @param id_ identifier of the tokens being transferred
      /// @param amount_ amount of tokens being transferred
      /// @param data_ optional data to send along with the call
      function _doSafeTransferAcceptanceCheck(
        address operator_,
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes memory data_
      ) private {
        uint256 _size_;
        assembly {
          _size_ := extcodesize(to_)
        }
        if (_size_ > 0) {
          try IERC1155Receiver(to_)
            .onERC1155Received(operator_, from_, id_, amount_, data_) returns (bytes4 response) {
            if (response != IERC1155Receiver.onERC1155Received.selector) {
              revert IERC1155_INVALID_RECEIVER(to_);
            }
          }
          catch (bytes memory reason) {
            if (reason.length == 0) {
              revert IERC1155_INVALID_RECEIVER(to_);
            }
            else {
              assembly {
                revert(add(32, reason), mload(reason))
              }
            }
          }
        }
      }
      /// @dev Internal function that checks if `operator_` is allowed to handle tokens on behalf of `owner_`
      /// 
      /// @param owner_ address that owns the tokens
      /// @param isApproved operator_ address that wants to manage the tokens
      function _isApprovedOrOwner(address owner_, address operator_) internal view returns (bool isApproved) {
        return 
          owner_ == operator_ ||
          isApprovedForAll(owner_, operator_);
      }
      /// @dev Internal function that mints `amount_` tokens from series `id_` into `account_`.
      /// 
      /// Emits a {IERC1155.TransferSingle} event
      /// 
      /// @param account_ address tokens are being transferred to
      /// @param id_ the type of tokens being transferred
      /// @param amount_ the amount of tokens being transferred
      function _mint(address account_, uint256 id_, uint256 amount_) internal isValidSeries(id_) {
        unchecked {
          _balances[id_][account_] += amount_;
        }
        emit TransferSingle(account_, address(0), account_, id_, amount_);
      }
    // ************

    // ***********************
    // * IERC1155MetadataURI *
    // ***********************
      /// @notice Updates the baseUri for the tokens.
      /// 
      /// @param newBaseUri_ the new baseUri for the tokens
      function _setBaseUri(string memory newBaseUri_) internal virtual {
        _baseUri = newBaseUri_;
        emit URI(_baseUri, DEFAULT_SERIES);
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
    // ***********************
  // **************************************
}
