// SPDX-License-Identifier: MIT

/**
* Author: Lambdalf the White
*/

pragma solidity 0.8.10;

import "../ERC1155BaseV1.sol";

/**
* @dev Interface of the optional ERC1155MetadataExtension interface, as defined
* in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].
*/
abstract contract ERC1155BaseBurnable is ERC1155BaseV1 {
	/**
	* @dev Destroys `amount_` tokens from series `id_` owned by `account_`.
	* 
	* Emits a {IERC1155-TransferSingle} event.
	* 
	* Requirements: 
	* 
	* - `account_` must own at least `amount_` tokens from series `id_`.
	* - if caller is not `account_`, they must have permission to handle tokens on behalf of `account_`.
	*/
	function burnFrom( address account_, uint256 id_, uint256 amount_ ) public virtual {
		_transfer( msg.sender, account_, address( 0 ), id_, amount_, "" );
	}

	/**
	* @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {burnFrom}.
	*
	* Emits a {IERC1155-TransferBatch} event.
	*
	* Requirements:
	*
	* - `ids` and `amounts` must have the same length.
	*/
	function batchBurnFrom( address account_, uint256[] memory ids_, uint256[] memory amounts_ ) public virtual {
		_batchTransfer( msg.sender, account_, address( 0 ), ids_, amounts_, "" );
	}
}
