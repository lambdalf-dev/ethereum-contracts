// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require(`chai`)
	const chaiAsPromised = require(`chai-as-promised`)
	chai.use(chaiAsPromised)
	const expect = chai.expect
	const { ethers } = require(`hardhat`)
	const { loadFixture } = require(`@nomicfoundation/hardhat-network-helpers`)

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require(`./behavior.IERC165`)
	const {
		shouldRevertWhenArrayLengthsDontMatch,
	} = require(`./behavior.Arrays`)
	const {
		ERC1155ReceiverError,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferBatchEvent,
		shouldEmitTransferSingleEvent,
		shouldEmitURIEvent,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenInvalidReceiver,
		shouldRevertWhenNewSeriesAlreadyExist,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens,
		shouldBehaveLikeIERC1155AtDeployTime,
		shouldBehaveLikeIERC1155AfterCreatingSeries,
		shouldBehaveLikeIERC1155AfterMint,
		shouldBehaveLikeIERC1155MetadataURI,
	} = require(`./behavior.ERC1155`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Mock_ERC1155`,
		METHODS: {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				// Mock_ERC1155
				mint: {
					SIGNATURE: `mint(uint256,uint256)`,
					PARAMS: [`id_`, `qty_`],
				},
				// IERC1155
				safeBatchTransferFrom: {
					SIGNATURE: `safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)`,
					PARAMS: [`from_`, `to_`, `ids_`, `amounts_`, `data_`],
				},
				safeTransferFrom: {
					SIGNATURE: `safeTransferFrom(address,address,uint256,uint256,bytes)`,
					PARAMS: [`from_`, `to_`, `id_`, `amount_`, `data_`],
				},
				setApprovalForAll: {
					SIGNATURE: `setApprovalForAll(address,bool)`,
					PARAMS: [`operator_`, `approved_`],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				// Mock_ERC1155
				createSeries: {
					SIGNATURE: `createSeries(uint256)`,
					PARAMS: [`id_`],
				},
				setBaseUri: {
					SIGNATURE: `setBaseUri(string)`,
					PARAMS: [`newBaseUri_`],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// Mock_ERC1155
				DEFAULT_SERIES: {
					SIGNATURE: `DEFAULT_SERIES()`,
					PARAMS: [],
				},
				exists: {
					SIGNATURE: `exists(uint256)`,
					PARAMS: [`id_`],
				},
				// IERC165
				supportsInterface: {
					SIGNATURE: `supportsInterface(bytes4)`,
					PARAMS: [`interfaceId_`],
				},
				// IERC1155
				balanceOf: {
					SIGNATURE: `balanceOf(address,uint256)`,
					PARAMS: [`owner_`, `id_`], 
				},
				balanceOfBatch: {
					SIGNATURE: `balanceOfBatch(address[],uint256[])`,
					PARAMS: [`owners_`, `ids_`],
				},
				isApprovedForAll: {
					SIGNATURE: `isApprovedForAll(address,address)`,
					PARAMS: [`tokenOwner_`, `operator_`],
				},
				// IERC1155MetadataURI
				uri: {
					SIGNATURE: `uri(uint256)`,
					PARAMS: [`id_`],
				},
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY             = 0
	// TARGET AMOUNT
	const TARGET_AMOUNT           = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY      = 1
	// AIRDROP
	const AIRDROP1                = 1
	const AIRDROP2                = 2
	// WHITELIST
	const WHITELIST_AMOUNT_1      = 3
	const WHITELIST_AMOUNT_2      = 1

	const TEST_DATA = {
		// TEST NAME
		NAME: `ERC1155`,
		INVALID_SERIES_ID: 0,
		DEFAULT_SERIES: 0,
		// SUPPLY
		INIT_SUPPLY: INIT_SUPPLY,
		MINTED_SUPPLY: INIT_SUPPLY + TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY + OTHER_OWNER_SUPPLY,
		MAX_BATCH: 10,
		// TARGET AMOUNT
		TARGET_TOKEN: 2,
		TARGET_AMOUNT: INIT_SUPPLY + TARGET_AMOUNT,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY: TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY: TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY: TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY: OTHER_OWNER_SUPPLY,
		// METADATA
		INIT_BASE_URI: `https://api.exemple.com/`,
		NEW_BASE_URI: `https://exemple.com/api/`,
    TOKEN_NAME: `NFT Collection`,
    TOKEN_SYMBOL: `NFT`,
		// AIRDROP
		AIRDROP1: AIRDROP1,
		AIRDROP2: AIRDROP2,
		// ROYALTIES
		ROYALTY_BASE: 10000,
		DEFAULT_ROYALTY_RATE: 500,
		NEW_ROYALTY_RATE: 250,
		// WHITELIST
		WHITELIST_AMOUNT_1: WHITELIST_AMOUNT_1,
		WHITELIST_AMOUNT_2: WHITELIST_AMOUNT_2,
		// INTERFACES
		INTERFACES: [
			`IERC165`,
			`IERC1155`,
			`IERC1155MetadataURI`,
		],
		// FIRST SERIES
		INIT_SERIES: {
			id_: 1,
		},
	}

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		}
	}
	async function initialSeriesFixture () {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		} = await loadFixture(deployFixture)

		await test_contract.createSeries(TEST_DATA.INIT_SERIES.id_)

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		}
	}
	async function mintFixture () {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		} = await loadFixture(initialSeriesFixture)

		await test_contract
			.connect(test_token_owner)
			.mint(
				TEST_DATA.INIT_SERIES.id_,
				TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
			)
		await test_contract
			.connect(test_other_owner)
			.mint(
				TEST_DATA.INIT_SERIES.id_,
				TEST_DATA.OTHER_OWNER_SUPPLY
			)
		await test_contract
			.connect(test_token_owner)
			.mint(
				TEST_DATA.INIT_SERIES.id_,
				TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
			)

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeMock_ERC1155AtDeployTime (fixture, TEST, CONTRACT) {
		shouldBehaveLikeIERC1155AtDeployTime(fixture, TEST, CONTRACT)
	}
	function shouldBehaveLikeMock_ERC1155AfterCreatingSeries (fixture, TEST, CONTRACT) {
		shouldBehaveLikeIERC1155AfterCreatingSeries(fixture, TEST, CONTRACT)
		shouldBehaveLikeIERC1155MetadataURI(fixture, TEST, CONTRACT)

		describe(`Should Behave like Mock_ERC1155 after creating series`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_contract_deployer,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
				users["CONTRACT_DEPLOYER"] = test_contract_deployer
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.mint.SIGNATURE, function () {
					it(`Should revert when series ID is invalid`, async function () {
						const operator = users["TOKEN_OWNER"]
						const id = TEST.INIT_SERIES.id_ + 1
						const qty = 1
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect(operator)
								.mint(id, qty),
							contract,
							id
						)
					})
					it(`Should emit a TransferSingle event`, async function () {
						const operator = users["TOKEN_OWNER"]
						const id = TEST.INIT_SERIES.id_
						const qty = TEST.TARGET_AMOUNT
						await shouldEmitTransferSingleEvent(
							contract
								.connect(operator)
								.mint(id, qty),
							contract,
							operator.address,
							ethers.constants.AddressZero,
							operator.address,
							id,
							qty
						)
						expect(
							await contract.balanceOf(operator.address, id)
						).to.equal(qty)
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.createSeries.SIGNATURE, function () {
					it(`Should revert when series already exists`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const id = TEST.INIT_SERIES.id_
						await shouldRevertWhenNewSeriesAlreadyExist(
							contract
								.connect(operator)
								.createSeries(id),
							contract,
							id
						)
					})
					it(`Should be fulfilled under normal conditions`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const id = TEST.INIT_SERIES.id_ + 1
						await expect(
							contract
								.connect(operator)
								.createSeries(id)
						).to.be.fulfilled
						expect(
							await contract.exists(id)
						).to.be.true
					})
				})
				describe(CONTRACT.METHODS.setBaseUri.SIGNATURE, function () {
					it(`Should emit a URI event`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const uri = TEST.NEW_BASE_URI
						await shouldEmitURIEvent(
							contract
								.connect(operator)
								.setBaseUri(uri),
							contract,
							uri,
							TEST.DEFAULT_SERIES
						)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeMock_ERC1155AfterMint (fixture, TEST, CONTRACT) {
		shouldBehaveLikeIERC1155AfterMint(fixture, TEST, CONTRACT)
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe(TEST_DATA.NAME, function () {
	if (true) {
		shouldSupportInterface(deployFixture, TEST_DATA.INTERFACES)
	}
	if (true) {
		shouldBehaveLikeMock_ERC1155AtDeployTime(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ERC1155AfterCreatingSeries(initialSeriesFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ERC1155AfterMint(mintFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
