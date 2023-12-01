// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require(`chai`)
	const chaiAsPromised = require(`chai-as-promised`)
	chai.use(chaiAsPromised)
	const expect = chai.expect
	const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
	const {ethers} = require(`hardhat`)

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require(`./behavior.IERC165`)
	const {
		ERC721ReceiverError,
		shouldEmitApprovalEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferEvent,
		shouldEmitConsecutiveTransferEvent,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenTransferingToInvalidReceiver,
		shouldRevertWhenCheckingInvalidTokenOwner,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenIndexOutOfBounds,
		shouldRevertWhenOwnerIndexOutOfBounds,
		shouldBehaveLikeIERC721,
		shouldBehaveLikeIERC721EnumerableAtDeploy,
		shouldBehaveLikeIERC721EnumerableAfterMint,
		shouldBehaveLikeIERC721Metadata,
		shouldBehaveLikeERC721BatchAtDeploy,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require(`./behavior.ERC721Batch`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Mock_ERC721Batch`,
		METHODS: {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				mint: {
					SIGNATURE: `mint(uint256)`,
					PARAMS: [`qty_`],
				},
				mint2309: {
					SIGNATURE: `mint2309(uint256)`,
					PARAMS: [`qty_`],
				},

				// ***********
				// * IERC721 *
				// ***********
					approve: {
						SIGNATURE: `approve(address,uint256)`,
						PARAMS: [`to_`, `tokenId_`],
					},
					safeTransferFrom: {
						SIGNATURE: `safeTransferFrom(address,address,uint256)`,
						PARAMS: [`from_`, `to_`, `tokenId_`],
					},
					safeTransferFrom_ol: {
						SIGNATURE: `safeTransferFrom(address,address,uint256,bytes)`,
						PARAMS: [`from_`, `to_`, `tokenId_`, `data_`],
					},
					setApprovalForAll: {
						SIGNATURE: `setApprovalForAll(address,bool)`,
						PARAMS: [`operator_`, `approved_`],
					},
					transferFrom: {
						SIGNATURE: `transferFrom(address,address,uint256)`,
						PARAMS: [`from_`, `to_`, `tokenId_`],
					},
				// ***********
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				setBaseUri: {
					SIGNATURE: `setBaseUri(string)`,
					PARAMS: [`newBaseUri_`],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// ***********
				// * IERC721 *
				// ***********
					balanceOf: {
						SIGNATURE: `balanceOf(address)`,
						PARAMS: [`tokenOwner_`],
					},
					getApproved: {
						SIGNATURE: `getApproved(uint256)`,
						PARAMS: [`tokenId_`],
					},
					isApprovedForAll: {
						SIGNATURE: `isApprovedForAll(address,address)`,
						PARAMS: [`tokenOwner_`, `operator_`],
					},
					ownerOf: {
						SIGNATURE: `ownerOf(uint256)`,
						PARAMS: [`tokenId_`],
					},
				// ***********

				// *********************
				// * IERC721Enumerable *
				// *********************
					tokenByIndex: {
						SIGNATURE: `tokenByIndex(uint256)`,
						PARAMS: [`index_`],
					},
					tokenOfOwnerByIndex: {
						SIGNATURE: `tokenOfOwnerByIndex(address,uint256)`,
						PARAMS: [`tokenOwner_`, `index_`],
					},
					totalSupply: {
						SIGNATURE: `totalSupply()`,
						PARAMS: [],
					},
				// *********************

				// *******************
				// * IERC721Metadata *
				// *******************
					name: {
						SIGNATURE: `name()`,
						PARAMS: [],
					},
					symbol: {
						SIGNATURE: `symbol()`,
						PARAMS: [],
					},
					tokenURI: {
						SIGNATURE: `tokenURI(uint256)`,
						PARAMS: [`index_`],
					},
				// *******************

				// ***********
				// * IERC165 *
				// ***********
					supportsInterface: {
						SIGNATURE: `supportsInterface(bytes4)`,
						PARAMS: [`interfaceId_`],
					},
				// ***********
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

	const TEST_DATA = {
		NAME: `ERC721Batch`,
		// SUPPLY
		INIT_SUPPLY: INIT_SUPPLY,
		MINTED_SUPPLY: INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN: FIRST_TOKEN,
		SECOND_TOKEN: SECOND_TOKEN,
		LAST_TOKEN: LAST_TOKEN,
		TARGET_TOKEN: INIT_SUPPLY + TARGET_TOKEN,
		INVALID_TOKEN: 0,
		UNMINTED_TOKEN: INIT_SUPPLY + UNMINTED_TOKEN,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY: TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY: TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY: TOKEN_OWNER_SUPPLY,
		TOKEN_OWNER_FIRST: INIT_SUPPLY + FIRST_TOKEN,
		TOKEN_OWNER_LAST: INIT_SUPPLY + LAST_TOKEN,
		TOKEN_OWNER_INDEX_SECOND: FIRST_TOKEN + TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY + 1,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY: OTHER_OWNER_SUPPLY,
		OTHER_OWNER_FIRST: INIT_SUPPLY + OTHER_OWNER_FIRST,
		OTHER_OWNER_LAST: INIT_SUPPLY + OTHER_OWNER_LAST,
		// ENUMERABLE
		INDEX_ZERO: 0,
		INDEX_SECOND: TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY,
		TARGET_INDEX: INIT_SUPPLY + TARGET_TOKEN,
		OUT_OF_BOUNDS_INDEX: INIT_SUPPLY + UNMINTED_TOKEN,
		// METADATA
		TOKEN_NAME: `NFT Collection`,
		TOKEN_SYMBOL: `NFT`,
		INIT_BASE_URI: `https://api.example.com/`,
		NEW_BASE_URI: `https://example.com/api/`,
		// INTERFACES
		INTERFACES: [
			`IERC165`,
			`IERC721`,
			`IERC721Enumerable`,
			`IERC721Metadata`,
		],
	}
	let contract
	let users = {}
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		[
			test_contract_deployer,
			test_user1,
			test_user2,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		const test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		}
	}
	async function mintFixture() {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		} = await loadFixture(deployFixture)

		await test_contract.connect(test_token_owner).mint(TEST_DATA.TOKEN_OWNER_INIT_SUPPLY)
		await test_contract.connect(test_other_owner).mint(TEST_DATA.OTHER_OWNER_SUPPLY)
		await test_contract.connect(test_token_owner).mint(TEST_DATA.TOKEN_OWNER_MORE_SUPPLY)

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeMock_ERC721BatchAtDeploy (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC721BatchAtDeploy(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_ERC721Batch before any token is minted`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.mint.SIGNATURE, function () {
					it(`Should emit a Transfer event`, async function () {
						const operator = users["USER1"]
						const qty = 1
						const from = ethers.constants.AddressZero
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.mint(qty),
							contract,
							from,
							operator.address,
							tokenId
						)
						expect(
							await contract.balanceOf(operator.address)
						).to.equal(qty)
						expect(
							await contract.ownerOf(tokenId)
						).to.equal(operator.address)
						expect(
							await contract.totalSupply()
						).to.equal(TEST.INIT_SUPPLY + qty)
					})
				})
				describe(CONTRACT.METHODS.mint2309.SIGNATURE, function () {
					it(`Should emit a ConsecutiveTransfer event`, async function () {
						const operator = users["USER1"]
						const qty = 3
						const from = ethers.constants.AddressZero
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitConsecutiveTransferEvent(
							contract
								.connect(operator)
								.mint2309(qty),
							contract,
							tokenId,
							tokenId + qty - 1,
							from,
							operator.address
						)
						expect(
							await contract.balanceOf(operator.address)
						).to.equal(qty)
						expect(
							await contract.ownerOf(tokenId)
						).to.equal(operator.address)
						expect(
							await contract.totalSupply()
						).to.equal(TEST.INIT_SUPPLY + qty)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeMock_ERC721BatchAfterMint (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC721BatchAfterMint(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_ERC721Batch after minting some token`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.setBaseUri.SIGNATURE, function () {
					it(`Should update the token's base URI`, async function () {
						const newBaseUri = TEST.NEW_BASE_URI
						await expect(
							contract.setBaseUri(newBaseUri)
						).to.be.fulfilled

						expect(
							await contract.tokenURI(TEST.TARGET_TOKEN)
						).to.equal(`${TEST.NEW_BASE_URI}${TEST.TARGET_TOKEN}`)
					})
				})
			// **************************************
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe(TEST_DATA.NAME, function () {
	if (true) {
		shouldSupportInterface(deployFixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ERC721BatchAtDeploy(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ERC721BatchAfterMint(mintFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
