const TEST_ACTIVATION = {
	// **************************************
	// *****           INPUTS           *****
	// **************************************
		CORRECT_INPUT                 : true,
		INVALID_INPUT                 : true,
	// **************************************

	// **************************************
	// *****            UTIL            *****
	// **************************************
		ERC2981Base                   : true,
		IInitializable                : true,
		IOwnable                      : true,
		IPausable                     : true,
		ITradable                     : true,
		IWhitelistable_Merkle         : true,
		IWhitelistable_MerkleMultiple : true,
	// **************************************

	// **************************************
	// *****           ERC721           *****
	// **************************************
		Consec_ERC721Batch            : true,
		ERC721A                       : true,
		ERC721B                       : true,
		ERC721OZ                      : true,
		Reg_ERC721Batch               : true,
	// **************************************

	// **************************************
	// *****     ERC721  EXTENSIONS     *****
	// **************************************
		Consec_ERC721BatchBurnable    : true,
		Reg_ERC721BatchBurnable       : true,
	// **************************************

	// **************************************
	// *****          NFT BASE          *****
	// **************************************
		NFTBaseC                      : true,
		NFTBaseR                      : true,
	// **************************************

	// **************************************
	// *****      PRICE COMPARISON      *****
	// **************************************
		PRICE_MINT_ERC721             : true,
		PRICE_TRANSFER_ERC721         : true,
	// **************************************
}

module.exports = {
	TEST_ACTIVATION,
}
