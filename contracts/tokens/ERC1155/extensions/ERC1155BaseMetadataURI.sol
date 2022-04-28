// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../ERC1155BaseV1.sol";
import "../../../interfaces/IERC1155MetadataURI.sol";

/**
* @dev Interface of the optional ERC1155MetadataExtension interface, as defined
* in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].
*/
abstract contract ERC1155BaseMetadataURI is ERC1155BaseV1, IERC1155MetadataURI {
	string private _baseURI;
	/**
	* @dev Returns the URI for token type `id_`.
	*
	* Note: If the `\{id\}` substring is present in the URI, it must be replaced by
	* clients with the actual token type ID.
	*/
	function uri( uint256 id_ ) external view virtual returns ( string memory ) {
		return _baseURI;
	}

	function supportsInterface( bytes4 interfaceId_ ) external view virtual override(ERC1155BaseV1, IERC165) returns ( bool ) {
		return 
			interfaceId_ == type( IERC1155MetadataURI ).interfaceId ||
			interfaceId_ == type( IERC1155 ).interfaceId ||
			interfaceId_ == type( IERC165 ).interfaceId;
	}

	function _setUri( string memory baseURI_ ) internal virtual {
		_baseURI = baseURI_;
	}
}
