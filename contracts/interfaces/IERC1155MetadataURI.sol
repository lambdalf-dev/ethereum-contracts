// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// import "./IERC1155.sol";

/**
* @dev Interface of the optional ERC1155MetadataExtension interface, as defined
* in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].
*/
interface IERC1155MetadataURI /* is IERC1155 */ {
  // **************************************
  // *****            VIEW            *****
  // **************************************
    /// @dev Returns the URI for token type `id_`.
    ///
    /// If the `id_` substring is present in the URI, it must be replaced by clients with the actual token type ID.
    function uri(uint256 id_) external view returns (string memory);
  // **************************************
}
