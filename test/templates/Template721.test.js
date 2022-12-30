// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		USER1,
		USER2,
		PROXY_USER,
		TOKEN_OWNER,
		OTHER_OWNER,
		FAKE_SIGNER,
		SIGNER_WALLET,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( '../utils/behavior.ERC165' )

	const {
		normalize,
		getSignerWallet,
		createProof,
		generateHashBuffer,
		serializeProof,
		shouldRevertWhenWitelistIsNotSet,
		shouldRevertWhenWhitelistIsConsumed,
		shouldRevertWhenNotWhitelisted,
	} = require( `../utils/behavior.Whitelist` )

	const {
		shouldBehaveLikeTemplate721AtDeploy,
		shouldBehaveLikeTemplate721NoWhitelist,
		shouldBehaveLikeTemplate721WithWhitelist,
		shouldBehaveLikeTemplate721PublicSale,
		shouldBehaveLikeTemplate721AfterMint,
		shouldBehaveLikeTemplate721AfterMintingOut,
	} = require( `../templates/behavior.Template721` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME : `Mock_Template721`,
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				// Template721
				mintPrivate : {
					SIGNATURE : `mintPrivate(uint256,uint256,tuple(bytes32,bytes32,uint8))`,
					PARAMS    : [ `qty_`, `alloted_`, `proof_` ],
				},
				mintPublic : {
					SIGNATURE : `mintPublic(uint256)`,
					PARAMS    : [ `qty_` ],
				},
				// IERC721
				approve : {
					SIGNATURE : `approve(address,uint256)`,
					PARAMS    : [ `to_`, `tokenId_` ],
				},
				safeTransferFrom : {
					SIGNATURE : `safeTransferFrom(address,address,uint256)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_` ],
				},
				safeTransferFrom_ol : {
					SIGNATURE : `safeTransferFrom(address,address,uint256,bytes)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_`, `data_` ],
				},
				setApprovalForAll : {
					SIGNATURE : `setApprovalForAll(address,bool)`,
					PARAMS    : [ `operator_`, `approved_` ],
				},
				transferFrom : {
					SIGNATURE : `transferFrom(address,address,uint256)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_` ],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				// Template721
				airdrop : {
					SIGNATURE : `airdrop(address[],uint256[])`,
					PARAMS    : [ `accounts_`, `amounts_` ],
				},
				reduceSupply : {
					SIGNATURE : `reduceSupply(uint256)`,
					PARAMS    : [ `newMaxSupply_` ],
				},
				setBaseUri : {
					SIGNATURE : `setBaseUri(string)`,
					PARAMS    : [ `newBaseUri_` ],
				},
				setContractState : {
					SIGNATURE : `setContractState(uint8)`,
					PARAMS    : [ `newState_` ],
				},
				setPrices : {
					SIGNATURE : `setPrices(uint256,uint256)`,
					PARAMS    : [ `newPrivatePrice_`, `newPublicPrice_` ],
				},
				setRoyaltyInfo : {
					SIGNATURE : `setRoyaltyInfo(address,uint256)`,
					PARAMS    : [ `newRoyaltyRecipient_`, `newRoyaltyRate_` ],
				},
				setTreasury : {
					SIGNATURE : `setTreasury(address)`,
					PARAMS    : [ `newTreasury_` ],
				},
				setWhitelist : {
					SIGNATURE : `setWhitelist(address)`,
					PARAMS    : [ `newAdminSigner_` ],
				},
				withdraw : {
					SIGNATURE : `withdraw()`,
					PARAMS    : [],
				},
				// IERC173
				transferOwnership : {
					SIGNATURE : `transferOwnership(address)`,
					PARAMS    : [ `newOwner_` ],
				},
				// OPERATOR FILTER REGISTRY (OS COMPLIANCE)
				updateOperatorFilterRegistryAddress : {
					SIGNATURE : `updateOperatorFilterRegistryAddress(address)`,
					PARAMS    : [ `newRegistry` ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// Template721
				DEFAULT_SUBSCRIPTION : {
					SIGNATURE : `DEFAULT_SUBSCRIPTION()`,
					PARAMS    : [],
				},
				DEFAULT_OPERATOR_FILTER_REGISTRY : {
					SIGNATURE : `DEFAULT_OPERATOR_FILTER_REGISTRY()`,
					PARAMS    : [],
				},
				MAX_BATCH : {
					SIGNATURE : `MAX_BATCH()`,
					PARAMS    : [],
				},
				maxSupply : {
					SIGNATURE : `maxSupply()`,
					PARAMS    : [],
				},
				PRIVATE_SALE : {
					SIGNATURE : `PRIVATE_SALE()`,
					PARAMS    : [],
				},
				PUBLIC_SALE : {
					SIGNATURE : `PUBLIC_SALE()`,
					PARAMS    : [],
				},
				salePrice : {
					SIGNATURE : `salePrice(uint8)`,
					PARAMS    : [ `contractState_` ],
				},
				supplyMinted : {
					SIGNATURE : `supplyMinted()`,
					PARAMS    : [],
				},
				treasury : {
					SIGNATURE : `treasury()`,
					PARAMS    : [],
				},
				// IERC721
				balanceOf : {
					SIGNATURE : `balanceOf(address)`,
					PARAMS    : [ `tokenOwner_` ],
				},
				getApproved : {
					SIGNATURE : `getApproved(uint256)`,
					PARAMS    : [ `tokenId_` ],
				},
				isApprovedForAll : {
					SIGNATURE : `isApprovedForAll(address,address)`,
					PARAMS    : [ `tokenOwner_`, `operator_` ],
				},
				ownerOf : {
					SIGNATURE : `ownerOf(uint256)`,
					PARAMS    : [ `tokenId_` ],
				},
				// IERC721Enumerable
				tokenByIndex : {
					SIGNATURE : `tokenByIndex(uint256)`,
					PARAMS    : [ `index_` ],
				},
				tokenOfOwnerByIndex : {
					SIGNATURE : `tokenOfOwnerByIndex(address,uint256)`,
					PARAMS    : [ `tokenOwner_`, `index_` ],
				},
				totalSupply : {
					SIGNATURE : `totalSupply()`,
					PARAMS    : [],
				},
				// IERC721Metadata
				name : {
					SIGNATURE : `name()`,
					PARAMS    : [],
				},
				symbol : {
					SIGNATURE : `symbol()`,
					PARAMS    : [],
				},
				tokenURI : {
					SIGNATURE : `tokenURI(uint256)`,
					PARAMS    : [ `index_` ],
				},
				// IERC165
				supportsInterface : {
					SIGNATURE : `supportsInterface(bytes4)`,
					PARAMS    : [ `interfaceId_` ],
				},
				// IERC173
				owner : {
					SIGNATURE : `owner()`,
					PARAMS    : [],
				},
				// ContractState
				PAUSED : {
					SIGNATURE : `PAUSED()`,
					PARAMS    : [],
				},
				getContractState : {
					SIGNATURE : `getContractState()`,
					PARAMS    : [],
				},
				// Whitelist_ECDSA
				checkWhitelistAllowance : {
					SIGNATURE : `checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))`,
					PARAMS    : [ `account_`, `whitelistType_`, `alloted_`, `proof_` ],
				},
				// IERC2981
				royaltyInfo : {
					SIGNATURE : 'royaltyInfo(uint256,uint256)',
					PARAMS    : [ `tokenId_`, `salePrice_` ],
				},
				// OPERATOR FILTER REGISTRY (OS COMPLIANCE)
				operatorFilterRegistry : {
					SIGNATURE : `operatorFilterRegistry()`,
					PARAMS    : [],
				},
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY             = 0
	// TARGET TOKEN
	const INVALID_TOKEN           = 0
	const FIRST_TOKEN             = 1
	const SECOND_TOKEN            = 2
	const TARGET_TOKEN            = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	const TOKEN_OWNER_SUPPLY      = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY
	const TOKEN_OWNER_FIRST       = FIRST_TOKEN
	const TOKEN_OWNER_LAST        = TOKEN_OWNER_FIRST + TOKEN_OWNER_INIT_SUPPLY - 1
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY      = 1
	const OTHER_OWNER_FIRST       = TOKEN_OWNER_LAST + 1
	const OTHER_OWNER_LAST        = OTHER_OWNER_FIRST + OTHER_OWNER_SUPPLY - 1
	// NON EXISTENT
	const LAST_TOKEN              = FIRST_TOKEN + INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY - 1
	const UNMINTED_TOKEN          = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY + 10
  // AIRDROP
  const AIRDROP1                = 1
  const AIRDROP2                = 2

	const TEST_DATA = {
		// TEST NAME
		NAME : `Template721`,
		DEFAULT_SUBSCRIPTION : `0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6`,
		DEFAULT_OPERATOR_FILTER_REGISTRY : `0x000000000000AAeB6D7670E522A718067333cd4E`,
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN                 : FIRST_TOKEN,
		SECOND_TOKEN                : SECOND_TOKEN,
		LAST_TOKEN                  : LAST_TOKEN,
		TARGET_TOKEN                : INIT_SUPPLY + TARGET_TOKEN,
		INVALID_TOKEN               : INVALID_TOKEN,
		UNMINTED_TOKEN              : INIT_SUPPLY + UNMINTED_TOKEN,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY     : TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY     : TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY          : TOKEN_OWNER_SUPPLY,
		TOKEN_OWNER_FIRST           : INIT_SUPPLY + FIRST_TOKEN,
		TOKEN_OWNER_LAST            : INIT_SUPPLY + LAST_TOKEN,
		TOKEN_OWNER_INDEX_SECOND    : FIRST_TOKEN + TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY + 1,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY          : OTHER_OWNER_SUPPLY,
		OTHER_OWNER_FIRST           : INIT_SUPPLY + OTHER_OWNER_FIRST,
		OTHER_OWNER_LAST            : INIT_SUPPLY + OTHER_OWNER_LAST,
		// METADATA
		INIT_BASE_URI               : ``,
		NEW_BASE_URI                : `https://api.exemple.com/`,
		TOKEN_NAME                  : `Template721 NFT Collection`,
		TOKEN_SYMBOL                : `NFT`,
		// ENUMERABLE
		INDEX_ZERO                  : 0,
		INDEX_SECOND                : TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY,
		TARGET_INDEX                : INIT_SUPPLY + TARGET_TOKEN,
		OUT_OF_BOUNDS_INDEX         : INIT_SUPPLY + UNMINTED_TOKEN,
		// AIRDROP
		AIRDROP1                    : AIRDROP1,
		AIRDROP2                    : AIRDROP2,
		// WHITELIST
		WHITELIST_AMOUNT            : 3,
		// ROYALTIES
		ROYALTY_BASE                : 10000,
		DEFAULT_ROYALTY_RATE        : 500,
		NEW_ROYALTY_RATE            : 1000,
		INVALID_ROYALTY_RATE        : 10001,
		// MAX
		MAX_SUPPLY                  : 500,
		NEW_MAX_SUPPLY              : 300,
		INVALID_SUPPLY              : 1000,
		RESERVE                     : 100,
		MAX_BATCH                   : 20,
		MINT_QTY                    : 2,
		// CONTRACT STATE
		CONTRACT_STATE : {
			PAUSED       : 0,
			PRIVATE_SALE : 1,
			PUBLIC_SALE  : 2,
		},
		// PRICE
		SALE_PRICE : {
			PAUSED       : 0,
			PRIVATE_SALE : ethers.BigNumber.from( `50000000000000000` ), // 0.05 ether
			PUBLIC_SALE  : ethers.BigNumber.from( `80000000000000000` ), // 0.08 ether
		},
		NEW_SALE_PRICE : {
			PAUSED       : 0,
			PRIVATE_SALE : ethers.BigNumber.from( `10000000000000000` ), // 0.01 ether
			PUBLIC_SALE  : ethers.BigNumber.from( `30000000000000000` ), // 0.03 ether
		},
		// INTERFACES
		INTERFACES : [
			`IERC165`,
			`IERC721`,
			`IERC721Enumerable`,
			`IERC721Metadata`,
			`IERC173`,
			`IERC2981`,
		],
	}

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		[
			test_contract_deployer,
			test_user1,
			test_user2,
			test_treasury,
			test_token_owner,
			test_other_owner,
			test_royalty_recipient,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		const test_contract = await contract_artifact.deploy(
			TEST_DATA.MAX_BATCH,
			TEST_DATA.MAX_SUPPLY,
			TEST_DATA.RESERVE,
			TEST_DATA.SALE_PRICE.PRIVATE_SALE,
			TEST_DATA.SALE_PRICE.PUBLIC_SALE,
			TEST_DATA.DEFAULT_ROYALTY_RATE,
			test_royalty_recipient.address,
			test_treasury.address,
			TEST_DATA.TOKEN_NAME,
			TEST_DATA.TOKEN_SYMBOL
		)
		await test_contract.deployed()

		const test_signer_wallet = getSignerWallet()
		const test_fake_signer   = getSignerWallet()

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
	async function noWhitelistFixture() {
		const {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		} = await loadFixture( deployFixture )

		const test_newState = TEST_DATA.CONTRACT_STATE.PRIVATE_SALE
		await test_contract
			.connect( test_contract_deployer )
			.setContractState( test_newState )

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
	async function withWhitelistFixture() {
		const {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		} = await loadFixture( noWhitelistFixture )

		await test_contract
			.connect( test_contract_deployer )
			.setWhitelist( test_signer_wallet.address )

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
	async function publicSaleFixture() {
		const {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		} = await loadFixture( withWhitelistFixture )

		const test_newState = TEST_DATA.CONTRACT_STATE.PUBLIC_SALE
		await test_contract
			.connect( test_contract_deployer )
			.setContractState( test_newState )

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
	async function mintFixture() {
		const {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		} = await loadFixture( publicSaleFixture )

		const test_token_price = TEST_DATA.SALE_PRICE.PUBLIC_SALE
		let test_qty = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		let test_value = test_token_price.mul( test_qty )
		let test_tx_params = { value : test_value }
		let test_operator = test_token_owner
		await test_contract
			.connect( test_operator )
			.mintPublic( test_qty, test_tx_params )

		test_qty = TEST_DATA.OTHER_OWNER_SUPPLY
		test_value = test_token_price.mul( test_qty )
		test_tx_params = { value : test_value }
		test_operator = test_other_owner
		await test_contract
			.connect( test_operator )
			.mintPublic( test_qty, test_tx_params )

		test_qty = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_value = test_token_price.mul( test_qty )
		test_tx_params = { value : test_value }
		test_operator = test_token_owner
		await test_contract
			.connect( test_operator )
			.mintPublic( test_qty, test_tx_params )

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
	async function mintOutFixture() {
		const {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		} = await loadFixture( publicSaleFixture )

		const test_token_price = TEST_DATA.SALE_PRICE.PUBLIC_SALE
		const test_operator = test_token_owner
		let test_qty = TEST_DATA.MAX_BATCH
		let test_value = test_token_price.mul( test_qty )
		let test_tx_params = { value : test_value }
		for ( let i = 0; i < TEST_DATA.MAX_SUPPLY - TEST_DATA.RESERVE; i += TEST_DATA.MAX_BATCH ) {
			await test_contract
				.connect( test_operator )
				.mintPublic( test_qty, test_tx_params )
		}
		const test_accounts = [
			test_token_owner.address,
			test_other_owner.address,
			test_user1.address,
		]
		const test_amounts = [
			50,
			30,
			20,
		]
		await test_contract
			.connect( test_contract_deployer )
      .airdrop( test_accounts, test_amounts )

		return {
			test_user1,
			test_user2,
			test_treasury,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
			test_royalty_recipient,
			test_contract_deployer,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
function shouldBehaveLikeMock_Template721AtDeploy( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721AtDeploy( fixture, TEST, CONTRACT )
}
function shouldBehaveLikeMock_Template721NoWhitelist( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721NoWhitelist( fixture, TEST, CONTRACT )
}
function shouldBehaveLikeMock_Template721WithWhitelist( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721WithWhitelist( fixture, TEST, CONTRACT )
}
function shouldBehaveLikeMock_Template721PublicSale( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721PublicSale( fixture, TEST, CONTRACT )
}
function shouldBehaveLikeMock_Template721AfterMint( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721AfterMint( fixture, TEST, CONTRACT )
}
function shouldBehaveLikeMock_Template721AfterMintingOut( fixture, TEST, CONTRACT ) {
	shouldBehaveLikeTemplate721AfterMintingOut( fixture, TEST, CONTRACT )
}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION.Template721 ) {
		if ( true ) {
			shouldSupportInterface( deployFixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721AtDeploy( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721NoWhitelist( noWhitelistFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721WithWhitelist( withWhitelistFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721PublicSale( publicSaleFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721AfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_Template721AfterMintingOut( mintOutFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
	}
})
