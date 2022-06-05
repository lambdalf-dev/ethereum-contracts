const TEST_ACTIVATION = {
	CORRECT_INPUT : true,
	INVALID_INPUT : false,
	// UTILS
	ERC2981Base          : true,
	IInitializable       : true,
	IOwnable             : true,
	IPausable            : true,
	ITradable            : true,
	IMerkleWhitelistable : true,
	// ERC721
	Consec_ERC721Batch         : true,
	ERC721A                    : false,
	ERC721B                    : false,
	ERC721OZ                   : false,
	Reg_ERC721Batch            : true,
	// ERC721 EXTENSIONS
	Consec_ERC721BatchBurnable : true,
	Reg_ERC721BatchBurnable    : true,
	// NFT BASE
	NFTBaseC : true,
	NFTBaseR : true,
	// PRICE COMPARISON
	PRICE_MINT_ERC721     : false,
	PRICE_TRANSFER_ERC721 : false,
}

module.exports = {
	TEST_ACTIVATION,
}
