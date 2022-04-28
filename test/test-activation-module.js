const TEST_ACTIVATION = {
	CORRECT_INPUT : true,
	INVALID_INPUT : false,
	// UTILS
	ERC2981Base          : false,
	IInitializable       : false,
	IOwnable             : false,
	IPausable            : false,
	ITradable            : false,
	IMerkleWhitelistable : true,
	// ERC721
	ERC721A                    : false,
	ERC721B                    : false,
	ERC721OZ                   : false,
	Consec_ERC721Batch         : false,
	Reg_ERC721Batch            : false,
	// ERC721 EXTENSIONS
	Consec_ERC721BatchBurnable : false,
	Reg_ERC721BatchBurnable    : false,
	ERC721BatchStakable        : false,
	// ERC20
	ERC20Base         : false,
	// ERC20 EXTENSIONS
	ERC20BaseBurnable : false,
	ERC20BaseCapped   : false,
	ERC20BaseMetadata : false,
	// ERC1155
	ERC1155Base            : false,
	// ERC1155 EXTENSIONS
	ERC1155BaseMetadataURI : false,
	ERC1155BaseBurnable    : false,
	// PRICE COMPARISON
	PRICE_MINT_ERC721     : false,
	PRICE_TRANSFER_ERC721 : false,
}

module.exports = {
	TEST_ACTIVATION,
}
