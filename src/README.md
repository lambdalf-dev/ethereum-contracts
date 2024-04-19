# Ethereum Contracts - contracts

## Table of contents

- `interfaces`: The list of interfaces used throughout the library.
- `mocks`: Very basic implementations of the contracts withing the library, for testing purposes.
- `templates`: A templated NFT ERC721 smart contract, can be copy-pasted and reused for a basic NFT launch, it includes:
	- standard ERC721 implementation with enumeration and metadata
	- signature-based whitelist implementation
	- ERC2981 royalties with on chain enforcement via [OpenSea's operator filter registry](https://github.com/ProjectOpenSea/operator-filter-registry)
	- support for multiple sale phases
- `tokens`: An opinionated implementation of ERC721 and ERC1155 token standards
- `utils`: A series of utilitary interfaces:
	- ERC173: contract ownership scheme
	- ERC2981: royalties scheme 
	- Whitelist: signature-based whitelist implementation
