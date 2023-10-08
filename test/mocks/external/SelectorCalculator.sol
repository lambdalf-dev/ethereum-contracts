// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

contract SelectorCalculator {
  // **************************************
  // *****           ERRORS           *****
  // **************************************
    /// @dev Thrown when trying to query the whitelist while it's not set
    error WHITELIST_NOT_SET();
    /// @dev Thrown when `account` does not have enough alloted access to fulfil their query
    /// 
    /// @param account address trying to access the whitelist
    error WHITELIST_FORBIDDEN(address account);
    /// @dev Thrown when `operator` is not allowed to manage `tokenId`.
    /// 
    /// @param operator address trying to manage the token
    /// @param tokenId identifier of the NFT being referenced
    error IERC721_CALLER_NOT_APPROVED(address operator, uint256 tokenId);
    /// @dev Thrown when user tries to approve themselves for managing a token they own.
    error IERC721_INVALID_APPROVAL();
    /// @dev Thrown when a token is being transferred to a contract unable to handle it or the zero address.
    /// 
    /// @param receiver address unable to receive the token
    error IERC721_INVALID_RECEIVER(address receiver);
    /// @dev Thrown when checking ownership of the wrong token owner.
    error IERC721_INVALID_TOKEN_OWNER();
    /// @dev Thrown when the requested token doesn"t exist.
    /// 
    /// @param tokenId identifier of the NFT being referenced
    error IERC721_NONEXISTANT_TOKEN(uint256 tokenId);
    /// @dev Thrown when trying to get the token at an index that doesn"t exist.
    /// 
    /// @param index the inexistant index
    error IERC721Enumerable_INDEX_OUT_OF_BOUNDS(uint256 index);
    /// @dev Thrown when trying to get the token owned by `tokenOwner` at an index that doesn"t exist.
    /// 
    /// @param index the inexistant index
    error IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS(uint256 index);
    /// @dev Thrown when the desired royalty rate is higher than 10,000
    error IERC2981_INVALID_ROYALTIES();
    /// @dev Thrown when a function is called with the wrong contract state.
    error CONTRACT_STATE_INCORRECT();
    /// @dev Thrown when trying to set the contract state to an invalid value.
    error CONTRACT_STATE_INVALID();
    /// @dev Thrown when an incorrect amount of eth is being sent for a payable operation.
    /// 
    /// @param amountReceived the amount the contract received
    /// @param amountExpected the actual amount the contract expected to receive
    error ETHER_INCORRECT_PRICE(uint256 amountReceived, uint256 amountExpected);
    /// @dev Thrown when trying to withdraw from the contract with no balance.
    error ETHER_NO_BALANCE();
    /// @dev Thrown when contract fails to send ether to recipient.
    /// 
    /// @param to the recipient of the ether
    /// @param amount the amount of ether being sent
    error ETHER_TRANSFER_FAIL(address to, uint256 amount);
    /// @dev Thrown when trying to mint 0 token.
    error NFT_INVALID_QTY();
    /// @dev Thrown when trying to set reserve to an invalid amount.
    error NFT_INVALID_RESERVE();
    /// @dev Thrown when trying to set max supply to an invalid amount.
    error NFT_INVALID_SUPPLY();
    /// @dev Thrown when trying to mint more tokens than the max allowed per transaction.
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param maxBatch the maximum amount that can be minted per transaction
    error NFT_MAX_BATCH(uint256 qtyRequested, uint256 maxBatch);
    /// @dev Thrown when trying to mint more tokens from the reserve than the amount left.
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param reserveLeft the amount of tokens left in the reserve
    error NFT_MAX_RESERVE(uint256 qtyRequested, uint256 reserveLeft);
    /// @dev Thrown when trying to mint more tokens than the amount left to be minted (except reserve).
    /// 
    /// @param qtyRequested the amount of tokens requested
    /// @param remainingSupply the amount of tokens left in the reserve
    error NFT_MINTED_OUT(uint256 qtyRequested, uint256 remainingSupply);
    /// @dev Thrown when trying to call a non existant function.
    error UNKNOWN();
    /// @dev Thrown when `operator` is not the contract owner.
    /// 
    /// @param operator address trying to use a function reserved to contract owner without authorization
    error IERC173_NOT_OWNER(address operator);
    /// @dev Thrown when `operator` has not been approved to manage `tokenId` on behalf of `tokenOwner`.
    /// 
    /// @param from address owning the token
    /// @param operator address trying to manage the token
    error IERC1155_CALLER_NOT_APPROVED(address from, address operator);
    /// @dev Thrown when trying to create series `id` that already exists.
    /// 
    /// @param id identifier of the NFT being referenced
    error IERC1155_EXISTANT_TOKEN(uint256 id);
    /// @dev Thrown when `from` tries to transfer more than they own.
    /// 
    /// @param from address that the NFT are being transferred from
    /// @param id identifier of the NFT being referenced
    error IERC1155_INSUFFICIENT_BALANCE(address from, uint256 id);
    /// @dev Thrown when operator tries to approve themselves for managing a token they own.
    error IERC1155_INVALID_APPROVAL();
    /// @dev Thrown when a token is being safely transferred to an address unable to handle it.
    /// 
    /// @param receiver address unable to receive the token
    error IERC1155_INVALID_RECEIVER(address receiver);
    /// @dev Thrown when the requested token doesn"t exist.
    /// 
    /// @param id identifier of the NFT being referenced
    error IERC1155_NON_EXISTANT_TOKEN(uint256 id);
    /// @dev Thrown when two related arrays have different lengths.
    error ARRAY_LENGTH_MISMATCH();
  // **************************************

  // **************************************
  // *****           EVENTS           *****
  // **************************************
    /// @dev Emitted instead of {ERC721.Transfer} when several consecutive tokens are being transferred.
    /// @dev See EIP2309 https://eips.ethereum.org/EIPS/eip-2309
    /// 
    /// @param fromTokenId identifier of the first token being transferred
    /// @param toTokenId identifier of the last token being transferred
    /// @param fromAddress address tokens are being transferred from
    /// @param toAddress address tokens are being transferred to
    event ConsecutiveTransfer(
        uint256 indexed fromTokenId,
        uint256 toTokenId,
        address indexed fromAddress,
        address indexed toAddress
    );
    /// @dev This emits when the approved address for an NFT is changed or reaffirmed.
    ///   The zero address indicates there is no approved address.
    ///   When a Transfer event emits, this also indicates that the approved address for that NFT (if any) is reset to none.
    /// 
    /// @param owner address that owns the token
    /// @param approved address that is allowed to manage the token
    /// @param tokenId identifier of the token being approved
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    /// @dev This emits when ownership of any NFT changes by any mechanism.
    ///   This event emits when NFTs are created (`from` == 0) and destroyed (`to` == 0).
    ///   Exception: during contract creation, any number of NFTs may be created and assigned without emitting Transfer.
    ///   At the time of any transfer, the approved address for that NFT (if any) is reset to none.
    /// 
    /// @param from address the token is being transferred from
    /// @param to address the token is being transferred to
    /// @param tokenId identifier of the token being transferred
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    /// @dev Emitted when the sale state changes
    /// 
    /// @param previousState the previous state of the contract
    /// @param newState the new state of the contract
    event ContractStateChanged(uint8 indexed previousState, uint8 indexed newState);
    /// @dev This emits when ownership of a contract changes.
    /// 
    /// @param previousOwner the previous contract owner
    /// @param newOwner the new contract owner
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    /// @dev MUST emit when approval for a second party/operator address to manage all tokens for an owner address is
    ///   enabled or disabled (absence of an event assumes disabled).
    /// 
    /// @param owner address that owns the tokens
    /// @param operator address allowed or not to manage the tokens
    /// @param approved whether the operator is allowed
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    /// @dev MUST emit when the URI is updated for a token ID.
    /// URIs are defined in RFC 3986.
    /// The URI MUST point to a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
    /// 
    /// @param value the new uri
    /// @param id the token id involved
    event URI(string value, uint256 indexed id);
    /// @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred,
    ///   including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
    /// 
    /// The `operator` argument MUST be the address of an account/contract
    ///   that is approved to make the transfer (SHOULD be msg.sender).
    /// The `from` argument MUST be the address of the holder whose balance is decreased.
    /// The `to` argument MUST be the address of the recipient whose balance is increased.
    /// The `ids` argument MUST be the list of tokens being transferred.
    /// The `values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in ids)
    ///   the holder balance is decreased by and match what the recipient balance is increased by.
    /// When minting/creating tokens, the `from` argument MUST be set to `0x0` (i.e. zero address).
    /// When burning/destroying tokens, the `to` argument MUST be set to `0x0` (i.e. zero address).
    /// 
    /// @param operator address ordering the transfer
    /// @param from address tokens are being transferred from
    /// @param to address tokens are being transferred to
    /// @param ids identifiers of the tokens being transferred
    /// @param values amounts of tokens being transferred
    event TransferBatch(
      address indexed operator,
      address indexed from,
      address indexed to,
      uint256[] ids,
      uint256[] values
    );
    /// @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred,
    ///   including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
    /// 
    /// The `operator` argument MUST be the address of an account/contract
    ///   that is approved to make the transfer (SHOULD be msg.sender).
    /// The `from` argument MUST be the address of the holder whose balance is decreased.
    /// The `to` argument MUST be the address of the recipient whose balance is increased.
    /// The `id` argument MUST be the token type being transferred.
    /// The `value` argument MUST be the number of tokens the holder balance is decreased by
    ///   and match what the recipient balance is increased by.
    /// When minting/creating tokens, the `from` argument MUST be set to `0x0` (i.e. zero address).
    /// When burning/destroying tokens, the `to` argument MUST be set to `0x0` (i.e. zero address).
    /// 
    /// @param operator address ordering the transfer
    /// @param from address tokens are being transferred from
    /// @param to address tokens are being transferred to
    /// @param id identifier of the token being transferred
    /// @param value amount of token being transferred
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
  // **************************************

	function WHITELIST_NOT_SET_error_selector() public pure returns (bytes32) {
		return WHITELIST_NOT_SET.selector;
	}
	function WHITELIST_FORBIDDEN_error_selector() public pure returns (bytes32) {
		return WHITELIST_FORBIDDEN.selector;
	}
	function IERC721_CALLER_NOT_APPROVED_error_selector() public pure returns (bytes32) {
		return IERC721_CALLER_NOT_APPROVED.selector;
	}
	function IERC721_INVALID_APPROVAL_error_selector() public pure returns (bytes32) {
		return IERC721_INVALID_APPROVAL.selector;
	}
	function IERC721_INVALID_RECEIVER_error_selector() public pure returns (bytes32) {
		return IERC721_INVALID_RECEIVER.selector;
	}
	function IERC721_INVALID_TOKEN_OWNER_error_selector() public pure returns (bytes32) {
		return IERC721_INVALID_TOKEN_OWNER.selector;
	}
	function IERC721_NONEXISTANT_TOKEN_error_selector() public pure returns (bytes32) {
		return IERC721_NONEXISTANT_TOKEN.selector;
	}
	function IERC721Enumerable_INDEX_OUT_OF_BOUNDS_error_selector() public pure returns (bytes32) {
		return IERC721Enumerable_INDEX_OUT_OF_BOUNDS.selector;
	}
	function IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS_error_selector() public pure returns (bytes32) {
		return IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS.selector;
	}
	function IERC2981_INVALID_ROYALTIES_error_selector() public pure returns (bytes32) {
		return IERC2981_INVALID_ROYALTIES.selector;
	}
	function CONTRACT_STATE_INCORRECT_error_selector() public pure returns (bytes32) {
		return CONTRACT_STATE_INCORRECT.selector;
	}
	function CONTRACT_STATE_INVALID_error_selector() public pure returns (bytes32) {
		return CONTRACT_STATE_INVALID.selector;
	}
	function ETHER_INCORRECT_PRICE_error_selector() public pure returns (bytes32) {
		return ETHER_INCORRECT_PRICE.selector;
	}
	function ETHER_NO_BALANCE_error_selector() public pure returns (bytes32) {
		return ETHER_NO_BALANCE.selector;
	}
	function ETHER_TRANSFER_FAIL_error_selector() public pure returns (bytes32) {
		return ETHER_TRANSFER_FAIL.selector;
	}
	function NFT_INVALID_QTY_error_selector() public pure returns (bytes32) {
		return NFT_INVALID_QTY.selector;
	}
	function NFT_INVALID_RESERVE_error_selector() public pure returns (bytes32) {
		return NFT_INVALID_RESERVE.selector;
	}
	function NFT_INVALID_SUPPLY_error_selector() public pure returns (bytes32) {
		return NFT_INVALID_SUPPLY.selector;
	}
	function NFT_MAX_BATCH_error_selector() public pure returns (bytes32) {
		return NFT_MAX_BATCH.selector;
	}
	function NFT_MAX_RESERVE_error_selector() public pure returns (bytes32) {
		return NFT_MAX_RESERVE.selector;
	}
	function NFT_MINTED_OUT_error_selector() public pure returns (bytes32) {
		return NFT_MINTED_OUT.selector;
	}
	function UNKNOWN_error_selector() public pure returns (bytes32) {
		return UNKNOWN.selector;
	}
	function IERC173_NOT_OWNER_error_selector() public pure returns (bytes32) {
		return IERC173_NOT_OWNER.selector;
	}
	function IERC1155_CALLER_NOT_APPROVED_error_selector() public pure returns (bytes32) {
		return IERC1155_CALLER_NOT_APPROVED.selector;
	}
	function IERC1155_EXISTANT_TOKEN_error_selector() public pure returns (bytes32) {
		return IERC1155_EXISTANT_TOKEN.selector;
	}
	function IERC1155_INSUFFICIENT_BALANCE_error_selector() public pure returns (bytes32) {
		return IERC1155_INSUFFICIENT_BALANCE.selector;
	}
	function IERC1155_INVALID_APPROVAL_error_selector() public pure returns (bytes32) {
		return IERC1155_INVALID_APPROVAL.selector;
	}
	function IERC1155_INVALID_RECEIVER_error_selector() public pure returns (bytes32) {
		return IERC1155_INVALID_RECEIVER.selector;
	}
	function IERC1155_NON_EXISTANT_TOKEN_error_selector() public pure returns (bytes32) {
		return IERC1155_NON_EXISTANT_TOKEN.selector;
	}
	function ARRAY_LENGTH_MISMATCH_error_selector() public pure returns (bytes32) {
		return ARRAY_LENGTH_MISMATCH.selector;
	}
	function ConsecutiveTransfer_event_selector() public pure returns (bytes32) {
		return ConsecutiveTransfer.selector;
	}
	function Approval_event_selector() public pure returns (bytes32) {
		return Approval.selector;
	}
	function Transfer_event_selector() public pure returns (bytes32) {
		return Transfer.selector;
	}
	function ContractStateChanged_event_selector() public pure returns (bytes32) {
		return ContractStateChanged.selector;
	}
	function OwnershipTransferred_event_selector() public pure returns (bytes32) {
		return OwnershipTransferred.selector;
	}
	function ApprovalForAll_event_selector() public pure returns (bytes32) {
		return ApprovalForAll.selector;
	}
	function URI_event_selector() public pure returns (bytes32) {
		return URI.selector;
	}
	function TransferBatch_event_selector() public pure returns (bytes32) {
		return TransferBatch.selector;
	}
	function TransferSingle_event_selector() public pure returns (bytes32) {
		return TransferSingle.selector;
	}
}
