// For common constants
const CST = {
	// ETHERS JS
	ETH                : ethers.constants.EtherSymbol,
	ONE_ETH            : ethers.constants.WeiPerEther,
	ADDRESS_ZERO       : ethers.constants.AddressZero,
	HASH_ZERO          : ethers.constants.HashZero,
	NUMBER_ZERO        : ethers.constants.Zero,
	NUMBER_ONE         : ethers.constants.One,
	NUMBER_TWO         : ethers.constants.Two,
	MAX_UINT256        : ethers.constants.MaxUint256,
	// SALE STATE
	SALE_STATE         : {
		CLOSED  : 0,
		PRESALE : 1,
		SALE    : 2,
	},
	// INTERFACE ID
	INTERFACE_ID       : {
		IERC1155               : '0xd9b67a26',
		IERC1155MetadataURI    : '0x0e89341c',
		IERC1155SingleReceiver : '0xf23a6e61',
		IERC1155BatchReceiver  : '0xbc197c81',
		IERC165                : '0x01ffc9a7',
		IERC2981               : '0x2a55205a',
		IERC721                : '0x80ac58cd',
		IERC721Metadata        : '0x5b5e139f',
		IERC721Enumerable      : '0x780e9d63',
		IERC721Receiver        : '0x150b7a02',
		INVALID                : '0xffffffff',
		NULL                   : '0x00000000',
	},
}

const USER1             = 'USER1'
const USER2             = 'USER2'
const PROXY_USER        = 'PROXY_USER'
const TOKEN_OWNER       = 'TOKEN_OWNER'
const OTHER_OWNER       = 'OTHER_OWNER'
const CONTRACT_DEPLOYER = 'CONTRACT_DEPLOYER'

const USER_NAMES = {
	USER1             : 'User1',
	USER2             : 'User2',
	PROXY_USER        : 'ProxyUser',
	TOKEN_OWNER       : 'TokenOwner',
	OTHER_OWNER       : 'OtherOwner',
	CONTRACT_DEPLOYER : 'ContractDeployer',
}

module.exports = {
	CONTRACT_DEPLOYER,
	OTHER_OWNER,
	TOKEN_OWNER,
	PROXY_USER,
	USER_NAMES,
	USER2,
	USER1,
	CST,
}
