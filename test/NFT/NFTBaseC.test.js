const ARTIFACT            = require( `../../artifacts/contracts/mocks/NFT/Mock_NFTBaseC.sol/Mock_NFTBaseC.json` )
const HOLDER_ARTIFACT     = require( `../../artifacts/contracts/mocks/external/Mock_ERC721Receiver.sol/Mock_ERC721Receiver.json` )
const NON_HOLDER_ARTIFACT = require( `../../artifacts/contracts/mocks/external/Mock_NonERC721Receiver.sol/Mock_NonERC721Receiver.json` )
const PROXY               = require( `../../artifacts/contracts/mocks/external/Mock_ProxyRegistry.sol/Mock_ProxyRegistry.json` )
// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		USER1,
		USER2,
		USER_NAMES,
		PROXY_USER,
		TOKEN_OWNER,
		OTHER_OWNER,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect

	const { ethers } = require( `hardhat` )
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../utils/behavior.ERC165` )

	const {
		CONTRACT_STATE,
	} = require( `../utils/behavior.IPausable` )

	const {
		shouldRevertWhenArrayLengthsDontMatch,
		shouldRevertWhenIncorrectAmountPaid,
		shouldRevertWhenInputAddressIsContract,
		shouldRevertWhenMintedOut,
		shouldRevertWhenReserveDepleted,
		shouldRevertWhenSumOfSharesIncorrect,
		shouldRevertWhenContractHasNoBalance,
		shouldRevertWhenEtherTransferFails,
		shouldEmitPaymentReleasedEvent,
		shouldBehaveLikeNFTBaseCAtDeploy,
		shouldBehaveLikeNFTAfterSettingProxy,
		shouldBehaveLikeNFTBaseCAfterSettingStateToOpen,
		shouldBehaveLikeNFTAfterMint,
		shouldBehaveLikeNFTAfterMintingOut,
	} = require( `../NFT/behavior.NFTBaseC` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME : `Mock_NFTBaseC`,
		ERRORS : {
			ERC721Receiver_PANIC                        : `panic code`,
			ERC721Receiver_ERROR                        : `custom error`,
			ERC721Receiver_MESSAGE                      : `Mock_ERC721Receiver: reverting`,
			IERC721_APPROVE_OWNER                       : `IERC721_APPROVE_OWNER`,
			IERC721_CALLER_NOT_APPROVED                 : `IERC721_CALLER_NOT_APPROVED`,
			IERC721_INVALID_APPROVAL_FOR_ALL            : `IERC721_INVALID_APPROVAL_FOR_ALL`,
			IERC721_INVALID_TRANSFER                    : `IERC721_INVALID_TRANSFER`,
			IERC721_NONEXISTANT_TOKEN                   : `IERC721_NONEXISTANT_TOKEN`,
			IERC721_NON_ERC721_RECEIVER                 : `IERC721_NON_ERC721_RECEIVER`,
			IERC721Enumerable_INDEX_OUT_OF_BOUNDS       : `IERC721Enumerable_INDEX_OUT_OF_BOUNDS`,
			IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS : `IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS`,
			NFT_ARRAY_LENGTH_MISMATCH                   : `NFT_ARRAY_LENGTH_MISMATCH`,
			NFT_INCORRECT_PRICE                         : `NFT_INCORRECT_PRICE`,
			NFT_INVALID_TEAM_MEMBER                     : `NFT_INVALID_TEAM_MEMBER`,
			NFT_MAX_RESERVE                             : `NFT_MAX_RESERVE`,
			NFT_MAX_SUPPLY                              : `NFT_MAX_SUPPLY`,
			NFT_MISSING_SHARES                          : `NFT_MISSING_SHARES`,
			NFT_NO_ETHER_BALANCE                        : `NFT_NO_ETHER_BALANCE`,
			NFT_TRANSFER_FAIL                           : `NFT_TRANSFER_FAIL`,
		},
		EVENTS : {
			Approval             : `Approval`,
			ApprovalForAll       : `ApprovalForAll`,
			ConsecutiveTransfer  : `ConsecutiveTransfer`,
			OwnershipTransferred : `OwnershipTransferred`,
			PaymentReleased      : `PaymentReleased`,
			ContractStateChanged : `ContractStateChanged`,
			Transfer             : `Transfer`,
		},
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				approve              : {
					SIGNATURE          : `approve(address,uint256)`,
					PARAMS             : [ `to_`, `tokenId_` ],
				},
				mintPublic           : {
					SIGNATURE          : `mintPublic(uint256)`,
					PARAMS             : [ `qty_` ],
				},
				safeTransferFrom     : {
					SIGNATURE          : `safeTransferFrom(address,address,uint256)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_` ],
				},
				safeTransferFrom_ol  : {
					SIGNATURE          : `safeTransferFrom(address,address,uint256,bytes)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_`, `data_` ],
				},
				setApprovalForAll    : {
					SIGNATURE          : `setApprovalForAll(address,bool)`,
					PARAMS             : [ `operator_`, `approved_` ],
				},
				transferFrom         : {
					SIGNATURE          : `transferFrom(address,address,uint256)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_` ],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				addProxyRegistry     : {
					SIGNATURE          : `addProxyRegistry(address)`,
					PARAMS             : [ `proxyRegistryAddress_` ],
				},
				airdrop              : {
					SIGNATURE          : `airdrop(address[],uint256[])`,
					PARAMS             : [ `accounts_`, `amounts_` ],
				},
				removeProxyRegistry  : {
					SIGNATURE          : `removeProxyRegistry(address)`,
					PARAMS             : [ `proxyRegistryAddress_` ],
				},
				setBaseURI           : {
					SIGNATURE          : `setBaseURI(string)`,
					PARAMS             : [ `baseURI_` ],
				},
				setRoyaltyInfo       : {
					SIGNATURE          : `setRoyaltyInfo(address,uint256)`,
					PARAMS             : [ `recipient_`, `royaltyRate_` ],
				},
				setPauseState         : {
					SIGNATURE          : `setPauseState(uint8)`,
					PARAMS             : [ `newState_` ],
				},
				transferOwnership    : {
					SIGNATURE          : `transferOwnership(address)`,
					PARAMS             : [ `newOwner_` ],
				},
				withdraw             : {
					SIGNATURE          : `withdraw()`,
					PARAMS             : [],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				balanceOf            : {
					SIGNATURE          : `balanceOf(address)`,
					PARAMS             : [ `tokenOwner_` ],
				},
				getApproved          : {
					SIGNATURE          : `getApproved(uint256)`,
					PARAMS             : [ `tokenId_` ],
				},
				isApprovedForAll     : {
					SIGNATURE          : `isApprovedForAll(address,address)`,
					PARAMS             : [ `tokenOwner_`, `operator_` ],
				},
				name                 : {
					SIGNATURE          : `name()`,
					PARAMS             : [],
				},
				owner                : {
					SIGNATURE          : `owner()`,
					PARAMS             : [],
				},
				ownerOf              : {
					SIGNATURE          : `ownerOf(uint256)`,
					PARAMS             : [ `tokenId_` ],
				},
				royaltyInfo          : {
					SIGNATURE          : 'royaltyInfo(uint256,uint256)',
					PARAMS             : [ 'tokenId_', 'salePrice_' ],
				},
				getPauseState        : {
					SIGNATURE          : `getPauseState()`,
					PARAMS             : [],
				},
				supportsInterface    : {
					SIGNATURE          : `supportsInterface(bytes4)`,
					PARAMS             : [ `interfaceId_` ],
				},
				symbol               : {
					SIGNATURE          : `symbol()`,
					PARAMS             : [],
				},
				tokenByIndex         : {
					SIGNATURE          : `tokenByIndex(uint256)`,
					PARAMS             : [ `index_` ],
				},
				tokenOfOwnerByIndex  : {
					SIGNATURE          : `tokenOfOwnerByIndex(address,uint256)`,
					PARAMS             : [ `tokenOwner_`, `index_` ],
				},
				tokenURI             : {
					SIGNATURE          : `tokenURI(uint256)`,
					PARAMS             : [ `index_` ],
				},
				totalSupply          : {
					SIGNATURE          : `totalSupply()`,
					PARAMS             : [],
				},
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY             = 0
	// TARGET TOKEN
	const FIRST_TOKEN             = 1
	const SECOND_TOKEN            = 2
	const TARGET_TOKEN            = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	const TOKEN_OWNER_FIRST       = FIRST_TOKEN
	const TOKEN_OWNER_LAST        = TOKEN_OWNER_FIRST + TOKEN_OWNER_INIT_SUPPLY - 1
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY      = 1
	const OTHER_OWNER_FIRST       = TOKEN_OWNER_LAST + 1
	const OTHER_OWNER_LAST        = OTHER_OWNER_FIRST + OTHER_OWNER_SUPPLY - 1
	// NON EXISTENT
	const LAST_TOKEN              = FIRST_TOKEN + INIT_SUPPLY + TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY + OTHER_OWNER_SUPPLY - 1
	const UNMINTED_TOKEN          = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY + OTHER_OWNER_SUPPLY + 10
	// AIRDROP
	const AIRDROP1                = 1
	const AIRDROP2                = 2
	// SALE PRICE
	const SALE_PRICE              = ethers.BigNumber.from( `50000000000000000` )
	// METADATA
	const INIT_BASE_URI           = `https://api.exemple.com/`
	const NEW_BASE_URI            = `https://exemple.com/api/`

	const TEST_DATA = {
		// TEST NAME
		NAME : `NFTBaseC`,
		// TEST EVENTS
		EVENTS : {
			Approval             : true,
			ApprovalForAll       : true,
			ConsecutiveTransfer  : true,
			OwnershipTransferred : true,
			PaymentReleased      : true,
			ContractStateChanged : true,
			Transfer             : true,
		},
		// TEST METHODS
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				approve             : true,
				mintPublic          : true,
				safeTransferFrom    : true,
				safeTransferFrom_ol : true,
				setApprovalForAll   : true,
				transferFrom        : true,
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				addProxyRegistry    : true,
				airdrop             : true,
				removeProxyRegistry : true,
				setBaseURI          : true,
				setRoyaltyInfo      : true,
				transferOwnership   : true,
				withdraw            : true,
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				balanceOf           : true,
				getApproved         : true,
				isApprovedForAll    : true,
				name                : true,
				owner               : true,
				ownerOf             : true,
				royaltyInfo         : true,
				getPauseState       : true,
				supportsInterface   : true,
				symbol              : true,
				tokenByIndex        : true,
				tokenOfOwnerByIndex : true,
				tokenURI            : true,
				totalSupply         : true,
			// **************************************

			// **************************************
			// *****            PURE            *****
			// **************************************
				onERC721Received    : true,
			// **************************************
		},
		// ARTIFACTS
		HOLDER_ARTIFACT             : HOLDER_ARTIFACT,
		NON_HOLDER_ARTIFACT         : NON_HOLDER_ARTIFACT,
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN                 : FIRST_TOKEN,
		SECOND_TOKEN                : SECOND_TOKEN,
		LAST_TOKEN                  : LAST_TOKEN,
		TARGET_TOKEN                : INIT_SUPPLY + TARGET_TOKEN,
		UNMINTED_TOKEN              : INIT_SUPPLY + UNMINTED_TOKEN,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY     : TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY     : TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY          : TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_FIRST           : INIT_SUPPLY + FIRST_TOKEN,
		TOKEN_OWNER_LAST            : INIT_SUPPLY + LAST_TOKEN,
		TOKEN_OWNER_INDEX_SECOND    : FIRST_TOKEN + TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY + 1,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY          : OTHER_OWNER_SUPPLY,
		OTHER_OWNER_FIRST           : INIT_SUPPLY + OTHER_OWNER_FIRST,
		OTHER_OWNER_LAST            : INIT_SUPPLY + OTHER_OWNER_LAST,
		// METADATA
		INIT_BASE_URI               : INIT_BASE_URI,
		NEW_BASE_URI                : NEW_BASE_URI,
		// ENUMERABLE
		INDEX_ZERO                  : 0,
		INDEX_SECOND                : TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY,
		TARGET_INDEX                : INIT_SUPPLY + TARGET_TOKEN,
		OUT_OF_BOUNDS_INDEX         : INIT_SUPPLY + UNMINTED_TOKEN,
		// PRICE
		SALE_PRICE                  : ethers.BigNumber.from( `50000000000000000` ),
		// AIRDROP
		AIRDROP1                    : AIRDROP1,
		AIRDROP2                    : AIRDROP2,
		// ROYALTIES
		ROYALTY_BASE                : 10000,
		// SHARES
		SHARE_BASE                  : 10000,
		// WHITELIST
	  ACCESS_LIST : {
	    '0x0010e29271bbca7abfbbbda1bdec668720cca795': 1,
	    '0x001709b366bb85f0fb2cC4eF18833392EBBA5756': 1,
	    '0x003018F3b836e952775C07E9b7BCde83b519a299': 1,
	    '0x00673506c19116893bdffa587d5ef968affe6a99': 1,
	    '0x009E7c27d5e3A1a4eB94b1ffCB258Eea12E17d1a': 1,
	    '0x00a139733aD9A7D6DEb9e5B7E2C6a01122b17747': 1,
	  },
		// INTERFACES
		INTERFACES : [
			`IERC165`,
			`IERC721`,
			`IERC721Metadata`,
			`IERC721Enumerable`,
			`IERC2981`,
		],
		// CONSTRUCTOR PARAMETERS
		PARAMS : {
			reserve_     : 50,
			maxBatch_    : 10,
			maxSupply_   : 8000,
			salePrice_   : SALE_PRICE,
			royaltyRate_ : 100,
			name_        : `NFT Token`,
			symbol_      : `NFT`,
			baseURI_     : INIT_BASE_URI,
			teamShares_  : [ 6000, 2000, 1500, 500 ],
		},
		// MINT OUT
		MINT_OUT : {
			reserve_   : AIRDROP1 + AIRDROP2,
			maxBatch_  : 50,
			maxSupply_ : 50 + AIRDROP1 + AIRDROP2,
		}
	}

	let test_qty
	let test_contract_params
	let test_tx_params
	let test_value
	let test_teamAddresses

	let users = {}
	let contract
	let proxy_contract
	let test_proxy_contract_params
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		let test_proxy_contract = await proxy_artifact.deploy()
		// test_proxy_contract_params = []
		// test_proxy_contract = await deployContract( test_contract_deployer, PROXY, test_proxy_contract_params )
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.PARAMS.reserve_,
			TEST_DATA.PARAMS.maxBatch_,
			TEST_DATA.PARAMS.maxSupply_,
			TEST_DATA.PARAMS.salePrice_,
			TEST_DATA.PARAMS.royaltyRate_,
			TEST_DATA.PARAMS.name_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.teamShares_,
			[
				test_team1.address,
				test_team2.address,
				test_team3.address,
				test_team4.address,
			]
		)

		// test_contract_params = [
		// ]
		// let test_contract = await deployContract(
		// 	test_contract_deployer,
		// 	ARTIFACT,
		// 	test_contract_params
		// )
		await test_contract.deployed()

		return {
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_proxy_contract,
			test_contract_deployer,
		}
	}

	async function proxyFixture () {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		let test_proxy_contract = await proxy_artifact.deploy()
		// test_proxy_contract_params = []
		// test_proxy_contract = await deployContract( test_contract_deployer, PROXY, test_proxy_contract_params )
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.PARAMS.reserve_,
			TEST_DATA.PARAMS.maxBatch_,
			TEST_DATA.PARAMS.maxSupply_,
			TEST_DATA.PARAMS.salePrice_,
			TEST_DATA.PARAMS.royaltyRate_,
			TEST_DATA.PARAMS.name_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.teamShares_,
			[
				test_team1.address,
				test_team2.address,
				test_team3.address,
				test_team4.address,
			]
		)

		// test_contract_params = [
		// ]
		// test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
		// await test_contract.deployed()

		test_proxyRegistryAddress = test_proxy_contract.address
		await test_contract.connect( test_contract_deployer )
											 .addProxyRegistry( test_proxyRegistryAddress )

		return {
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_proxy_contract,
			test_contract_deployer,
		}
	}

	async function saleFixture () {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		let test_proxy_contract = await proxy_artifact.deploy()
		// test_proxy_contract_params = []
		// test_proxy_contract = await deployContract( test_contract_deployer, PROXY, test_proxy_contract_params )
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.PARAMS.reserve_,
			TEST_DATA.PARAMS.maxBatch_,
			TEST_DATA.PARAMS.maxSupply_,
			TEST_DATA.PARAMS.salePrice_,
			TEST_DATA.PARAMS.royaltyRate_,
			TEST_DATA.PARAMS.name_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.teamShares_,
			[
				test_team1.address,
				test_team2.address,
				test_team3.address,
				test_team4.address,
			]
		)

		// test_contract_params = [
		// ]
		// test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
		// await test_contract.deployed()

		test_proxyRegistryAddress = test_proxy_contract.address
		await test_contract.connect( test_contract_deployer )
											 .addProxyRegistry( test_proxyRegistryAddress )

		test_newState = CONTRACT_STATE.OPEN
		await test_contract.connect( test_contract_deployer )
											 .setPauseState( test_newState )

		return {
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_proxy_contract,
			test_contract_deployer,
		}
	}

	async function mintFixture() {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		let test_proxy_contract = await proxy_artifact.deploy()
		// test_proxy_contract_params = []
		// test_proxy_contract = await deployContract( test_contract_deployer, PROXY, test_proxy_contract_params )
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.PARAMS.reserve_,
			TEST_DATA.PARAMS.maxBatch_,
			TEST_DATA.PARAMS.maxSupply_,
			TEST_DATA.PARAMS.salePrice_,
			TEST_DATA.PARAMS.royaltyRate_,
			TEST_DATA.PARAMS.name_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.teamShares_,
			[
				test_team1.address,
				test_team2.address,
				test_team3.address,
				test_team4.address,
			]
		)

		// test_contract_params = [
		// ]
		// let test_contract = await deployContract(
		// 	test_contract_deployer,
		// 	ARTIFACT,
		// 	test_contract_params
		// )
		// await test_contract.deployed()

		test_newState = CONTRACT_STATE.OPEN
		await test_contract.connect( test_contract_deployer )
											 .setPauseState( test_newState )

		test_qty   = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		test_value = TEST_DATA.PARAMS.salePrice_.mul( test_qty )
		test_tx_params = {
			value : test_value
		}
		await test_contract.connect( test_token_owner )
											 .mintPublic( test_qty, test_tx_params )

		test_qty   = TEST_DATA.OTHER_OWNER_SUPPLY
		test_value = TEST_DATA.PARAMS.salePrice_.mul( test_qty )
		test_tx_params = {
			value : test_value
		}
		await test_contract.connect( test_other_owner )
											 .mintPublic( test_qty, test_tx_params )

		test_qty   = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_value = TEST_DATA.PARAMS.salePrice_.mul( test_qty )
		test_tx_params = {
			value : test_value
		}
		await test_contract.connect( test_token_owner )
											 .mintPublic( test_qty, test_tx_params )

		return {
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_proxy_contract,
			test_contract_deployer,
		}
	}

	async function mintOutFixture() {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		let test_proxy_contract = await proxy_artifact.deploy()
		// test_proxy_contract_params = []
		// test_proxy_contract = await deployContract( test_contract_deployer, PROXY, test_proxy_contract_params )
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.MINT_OUT.reserve_,
			TEST_DATA.MINT_OUT.maxBatch_,
			TEST_DATA.MINT_OUT.maxSupply_,
			TEST_DATA.PARAMS.salePrice_,
			TEST_DATA.PARAMS.royaltyRate_,
			TEST_DATA.PARAMS.name_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.teamShares_,
			[
				test_team1.address,
				test_team2.address,
				test_team3.address,
				test_team4.address,
			]
		)

		// test_contract_params = [
		// ]
		// let test_contract = await deployContract(
		// 	test_contract_deployer,
		// 	ARTIFACT,
		// 	test_contract_params
		// )
		// await test_contract.deployed()

		test_newState = CONTRACT_STATE.OPEN
		await test_contract.connect( test_contract_deployer )
											 .setPauseState( test_newState )

		test_qty   = TEST_DATA.MINT_OUT.maxBatch_
		test_value = TEST_DATA.PARAMS.salePrice_.mul( test_qty )
		test_tx_params = {
			value : test_value
		}
		await test_contract.connect( test_token_owner )
											 .mintPublic( test_qty, test_tx_params )

		return {
			test_team1,
			test_team2,
			test_team3,
			test_team4,
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_proxy_contract,
			test_contract_deployer,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function testInvalidInputs ( fixture, TEST, CONTRACT ) {
		describe( `Invalid inputs`, function () {
			if ( TEST_ACTIVATION.INVALID_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

					defaultArgs = {}
					// **************************************
					// *****           PUBLIC           *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.approve.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs [ CONTRACT.METHODS.mintPublic.SIGNATURE ] = {
							err  : null,
							args : [
								5,
							],
						}
						defaultArgs[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
								`0x`,
							],
						}
						defaultArgs[ CONTRACT.METHODS.setApprovalForAll.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								true,
							],
						}
						defaultArgs[ CONTRACT.METHODS.transferFrom.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
					// **************************************

					// **************************************
					// *****       CONTRACT_OWNER       *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.addProxyRegistry.SIGNATURE ] = {
							err  : null,
							args : [
								test_proxy_contract.address,
							],
						}
						defaultArgs[ CONTRACT.METHODS.airdrop.SIGNATURE ] = {
							err  : null,
							args : [
								[
									users[ TOKEN_OWNER ].address,
									users[ USER1 ].address,
								],
								[ 1, 2 ],
							],
						}
						defaultArgs [ CONTRACT.METHODS.removeProxyRegistry.SIGNATURE ] = {
							err  : null,
							args : [
								test_proxy_contract.address,
							]
						}
						defaultArgs[ CONTRACT.METHODS.setBaseURI.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.NEW_BASE_URI,
							],
						}
						defaultArgs[ CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE ] = {
							err  : null,
							args : [
								users[ CONTRACT_DEPLOYER ].address,
								TEST.PARAMS.royaltyRate_,
							],
						}
						defaultArgs[ CONTRACT.METHODS.setPauseState.SIGNATURE ] = {
							err  : null,
							args : [
								CONTRACT_STATE.OPEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.transferOwnership.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
							]
						}
						defaultArgs[ CONTRACT.METHODS.withdraw.SIGNATURE ] = {
							err  : null,
							args : [],
						}
					// **************************************

					// **************************************
					// *****            VIEW            *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.balanceOf.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
							],
						}
						defaultArgs[ CONTRACT.METHODS.getApproved.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.isApprovedForAll.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
							],
						}
						defaultArgs[ CONTRACT.METHODS.name.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						defaultArgs[ CONTRACT.METHODS.owner.SIGNATURE ] = {
							err  : null,
							args : []
						}
						defaultArgs[ CONTRACT.METHODS.ownerOf.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.royaltyInfo.SIGNATURE ] = {
							err  : null,
							args : [
								0,
								ethers.constants.WeiPerEther,
							],
						}
						defaultArgs[ CONTRACT.METHODS.getPauseState.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						defaultArgs[ CONTRACT.METHODS.supportsInterface.SIGNATURE ] = {
							err  : null,
							args : [
								INTERFACE_ID.IERC165,
							]
						}
						defaultArgs[ CONTRACT.METHODS.symbol.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						defaultArgs[ CONTRACT.METHODS.tokenURI.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.tokenByIndex.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.INDEX_ZERO,
							],
						}
						defaultArgs[ CONTRACT.METHODS.tokenOfOwnerByIndex.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								TEST.INDEX_ZERO,
							],
						}
						defaultArgs[ CONTRACT.METHODS.totalSupply.SIGNATURE ] = {
							err  : null,
							args : [],
						}
					// **************************************
				})

				Object.entries( CONTRACT.METHODS ).forEach( function( [ prop, val ] ) {
					describe( val.SIGNATURE, function () {
						const testSuite = getTestCasesByFunction( val.SIGNATURE, val.PARAMS )

						testSuite.forEach( testCase => {
							it( testCase.test_description, async function () {
								await generateTestCase( contract, testCase, defaultArgs, prop, val )
							})
						})
					})
				})
			}
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		testInvalidInputs( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldSupportInterface( deployFixture, TEST_DATA.INTERFACES )
		shouldBehaveLikeNFTBaseCAtDeploy( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeNFTAfterSettingProxy( proxyFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeNFTBaseCAfterSettingStateToOpen( saleFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeNFTAfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeNFTAfterMintingOut( mintOutFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
