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
		shouldEmitOwnershipTransferredEvent,
		shouldRevertWhenCallerIsNotContractOwner,
		shouldBehaveLikeERC173,
	} = require(`./behavior.IERC173`)
	const {
		shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase,
		shouldBehaveLikeERC2981,
	} = require(`./behavior.IERC2981`)
	const {
		ERC721ReceiverError,
		shouldEmitApprovalEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferEvent,
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
	const {
		normalize,
		getSignerWallet,
		createProof,
		generateHashBuffer,
		serializeProof,
		getProof,
		shouldRevertWhenWitelistIsNotSet,
		shouldRevertWhenNotWhitelisted,
		shouldBehaveLikeWhitelistBeforeSettingWhitelist,
		shouldBehaveLikeWhitelistAfterSettingWhitelist,
	} = require(`./behavior.Whitelist`)
	const {
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenArrayLengthsDontMatch,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
		shouldRevertWhenIncorrectAmountPaid,
		shouldRevertWhenContractHasNoBalance,
		shouldRevertWhenEtherTransferFails,
		shouldRevertWhenQtyIsZero,
		shouldRevertWhenInvalidReserve,
		shouldRevertWhenInvalidMaxSupply,
		shouldRevertWhenQtyOverMaxBatch,
		shouldRevertWhenReserveDepleted,
		shouldRevertWhenMintedOut,
		shouldRevertWhenFunctionDoesNotExist,
	} = require(`./behavior.Template721`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Template721`,
		METHODS: {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				// ****************
				// * Template721 *
				// ****************
					privateMint: {
						SIGNATURE: `privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))`,
						PARAMS: [`qty_`, `alloted_`, `proof_`],
					},
					publicMint: {
						SIGNATURE: `publicMint(uint256)`,
						PARAMS: [`qty_`],
					},
				// ****************

				// **************
				// * ERC721Batch *
				// **************
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
				// **************
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				// ****************
				// * Template721 *
				// ****************
					airdrop: {
						SIGNATURE: `airdrop(address[],uint256[])`,
						PARAMS: [`accounts_`, `amounts_`],
					},
					reduceReserve: {
						SIGNATURE: `reduceReserve(uint256)`,
						PARAMS: [`newReserve_`],
					},
					reduceSupply: {
						SIGNATURE: `reduceSupply(uint256)`,
						PARAMS: [`newMaxSupply_`],
					},
					setContractState: {
						SIGNATURE: `setContractState(uint8)`,
						PARAMS: [`newState_`],
					},
					setPrices: {
						SIGNATURE: `setPrices(uint256,uint256)`,
						PARAMS: [`newPrivatePrice_`, `newPublicPrice_`],
					},
					setTreasury: {
						SIGNATURE: `setTreasury(address)`,
						PARAMS: [`newTreasury_`],
					},
					withdraw: {
						SIGNATURE: `withdraw()`,
						PARAMS: [],
					},
				// ****************

				// ***********
				// * IERC173 *
				// ***********
					transferOwnership: {
						SIGNATURE: `transferOwnership(address)`,
						PARAMS: [`newOwner_`],
					},
				// ***********

				// ***********
				// * IERC2981 *
				// ***********
					setRoyaltyInfo: {
						SIGNATURE: `setRoyaltyInfo(address,uint96)`,
						PARAMS: [`newRoyaltyRecipient_`, `newRoyaltyRate_`],
					},
				// ***********

				// **************
				// * ERC721Batch *
				// **************
					setBaseUri: {
						SIGNATURE: `setBaseUri(string)`,
						PARAMS: [`newBaseUri_`],
					},
				// **************

				// *************
				// * Whitelist *
				// *************
					setWhitelist: {
						SIGNATURE: `setWhitelist(address)`,
						PARAMS: [`adminSigner_`],
					},
				// *************
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// ****************
				// * Template721 *
				// ****************
					MAX_BATCH: {
						SIGNATURE: `MAX_BATCH()`,
						PARAMS: [],
					},
					contractState: {
						SIGNATURE: `contractState()`,
						PARAMS: [],
					},
					maxSupply: {
						SIGNATURE: `maxSupply()`,
						PARAMS: [],
					},
					reserve: {
						SIGNATURE: `reserve()`,
						PARAMS: [],
					},
					treasury: {
						SIGNATURE: `treasury()`,
						PARAMS: [],
					},
					salePrice: {
						SIGNATURE: `salePrice(uint8)`,
						PARAMS: [`contractState_`],
					},
				// ****************

				// ***********
				// * IERC165 *
				// ***********
					supportsInterface: {
						SIGNATURE: `supportsInterface(bytes4)`,
						PARAMS: [`interfaceId_`],
					},
				// ***********

				// ***********
				// * IERC173 *
				// ***********
					owner: {
						SIGNATURE: `owner()`,
						PARAMS: [],
					},
				// ***********

				// ***********
				// * IERC2981 *
				// ***********
					royaltyInfo: {
						SIGNATURE: `royaltyInfo(uint256,uint256)`,
						PARAMS: [`tokenId_`, `salePrice_`],
					},
				// ***********

				// **************
				// * ERC721Batch *
				// **************
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
				// **************

				// *************
				// * Whitelist *
				// *************
					checkWhitelistAllowance: {
						SIGNATURE: `checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))`,
						PARAMS: [`account_`, `whitelistId_`, `alloted_`, `proof_`],
					},
				// *************
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY = 0
	// TARGET TOKEN
	const FIRST_TOKEN = 1
	const SECOND_TOKEN = 2
	const TARGET_TOKEN = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	const TOKEN_OWNER_SUPPLY = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY
	const TOKEN_OWNER_FIRST = FIRST_TOKEN
	const TOKEN_OWNER_LAST = TOKEN_OWNER_FIRST + TOKEN_OWNER_INIT_SUPPLY - 1
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY = 1
	const OTHER_OWNER_FIRST = TOKEN_OWNER_LAST + 1
	const OTHER_OWNER_LAST = OTHER_OWNER_FIRST + OTHER_OWNER_SUPPLY - 1
	// NON EXISTENT
	const LAST_TOKEN = FIRST_TOKEN + INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY - 1
	const UNMINTED_TOKEN = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY + 10

	const TEST_DATA = {
		NAME: `Template721`,
		// ROYALTIES
		ROYALTY_BASE: 10000,
		DEFAULT_ROYALTY_RATE: 1000,
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
		INIT_BASE_URI: ``,
		NEW_BASE_URI: `https://example.com/api/`,
		// WHITELIST
		WHITELIST_AMOUNT_1: 3,
		WHITELIST_AMOUNT_2: 1,
		WHITELIST_TYPE_1: 1,
		WHITELIST_TYPE_2: 2,
		// SALE
		MAX_SUPPLY: 500,
		RESERVE: 5,
		MAX_BATCH: 10,
		AIRDROP1: 3,
		AIRDROP2: 2,
		SALE_PRICE: {
			PAUSED: 0,
			PRIVATE_SALE: ethers.constants.WeiPerEther.div(100),
			PUBLIC_SALE: ethers.constants.WeiPerEther.div(50),
		},
		CONTRACT_STATE: {
			PAUSED: 0,
			PRIVATE_SALE: 1,
			PUBLIC_SALE: 2,
			INVALID_STATE: 3,
		},
		// INTERFACES
		INTERFACES: [
			`IERC165`,
			`IERC173`,
			`IERC2981`,
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
			test_treasury,
			test_token_owner,
			test_other_owner,
			test_royalty_recipient,
			...addrs
		] = await ethers.getSigners()

		test_signer_wallet = getSignerWallet()
		test_fake_signer = getSignerWallet()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		const test_contract = await contract_artifact.deploy(
			TEST_DATA.MAX_SUPPLY,
			TEST_DATA.RESERVE,
			TEST_DATA.SALE_PRICE.PRIVATE_SALE,
			TEST_DATA.SALE_PRICE.PUBLIC_SALE,
			TEST_DATA.DEFAULT_ROYALTY_RATE,
			test_royalty_recipient.address,
			test_treasury.address,
			test_signer_wallet.address
		)
		await test_contract.deployed()

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
		} = await loadFixture(deployFixture);

    await sendPublicMint(
      test_contract,
      test_contract_deployer,
      test_token_owner,
      TEST_DATA.CONTRACT_STATE.PUBLIC_SALE,
      TEST_DATA.TOKEN_OWNER_INIT_SUPPLY,
      TEST_DATA.SALE_PRICE.PUBLIC_SALE.mul(TEST_DATA.TOKEN_OWNER_INIT_SUPPLY),
    )
    await sendPublicMint(
      test_contract,
      test_contract_deployer,
      test_other_owner,
      TEST_DATA.CONTRACT_STATE.PUBLIC_SALE,
      TEST_DATA.OTHER_OWNER_SUPPLY,
      TEST_DATA.SALE_PRICE.PUBLIC_SALE.mul(TEST_DATA.OTHER_OWNER_SUPPLY),
    )
    await sendPublicMint(
      test_contract,
      test_contract_deployer,
      test_token_owner,
      TEST_DATA.CONTRACT_STATE.PUBLIC_SALE,
      TEST_DATA.TOKEN_OWNER_MORE_SUPPLY,
      TEST_DATA.SALE_PRICE.PUBLIC_SALE.mul(TEST_DATA.TOKEN_OWNER_MORE_SUPPLY),
    )

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
	// Helpers
	async function sendPrivateMint(contract, contractOwner, operator, initState, qty, totalPrice, alloted, proof) {
		const tx_params = { value: totalPrice }
		await contract
			.connect(contractOwner)
			.setContractState(initState)
		await contract
			.connect(operator)
			.privateMint(qty, alloted, proof, tx_params)
	}
	async function sendPublicMint(contract, contractOwner, operator, initState, qty, totalPrice) {
		const tx_params = { value: totalPrice }
		await contract
			.connect(contractOwner)
			.setContractState(initState)
		await contract
			.connect(operator)
			.publicMint(qty, tx_params)
	}
	async function depleteSupply(contract, contractOwner) {
		await contract
			.connect(contractOwner)
			.reduceSupply(TEST_DATA.RESERVE)
	}

	function shouldBehaveLikeTemplate721AtDeploy (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC173(fixture, TEST, CONTRACT)
		shouldBehaveLikeERC2981(fixture, TEST, CONTRACT)
		shouldBehaveLikeERC721BatchAtDeploy(fixture, TEST, CONTRACT)
		shouldBehaveLikeWhitelistAfterSettingWhitelist(fixture, TEST, CONTRACT)

		describe(`Should behave like Template721 at deployment time`, function () {
			beforeEach(async function () {
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
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TREASURY"] = test_treasury
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
				users["FAKE_SIGNER"] = test_fake_signer
				users["SIGNER_WALLET"] = test_signer_wallet
				users["ROYALTY_RECIPIENT"] = test_royalty_recipient
				users["CONTRACT_DEPLOYER"] = test_contract_deployer
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.privateMint.SIGNATURE, function () {
					it(`Should be reverted when contract state is PAUSED`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await shouldRevertWhenContractStateIsIncorrect(
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PAUSED,
								qty,
								totalPrice,
								alloted,
								proof
							),
							contract
						)
					})
					it(`Should be reverted when contract state is PUBLIC_SALE`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await shouldRevertWhenContractStateIsIncorrect(
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							),
							contract
						)
					})
					it(`Should be reverted when quantity requested is 0`, async function () {
						const operator = users["USER1"]
						const qty = 0
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await shouldRevertWhenQtyIsZero (
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							),
							contract
						)
					})
					it(`Should be reverted when supply is depleted`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await depleteSupply(contract, users["CONTRACT_DEPLOYER"])
						await shouldRevertWhenMintedOut(
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							),
							contract,
							qty,
							0
						)
					})
					it(`Should be reverted when incorrect amount of ETH is sent`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await shouldRevertWhenIncorrectAmountPaid(
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								0,
								alloted,
								proof
							),
							contract,
							0,
							totalPrice
						)
					})
					it(`Should be reverted when quantity requested is higher than the amount the user is whitelisted for`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["FAKE_SIGNER"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await shouldRevertWhenNotWhitelisted(
							sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							),
							contract,
							operator.address
						)
					})
					it(`Should emit a Transfer event`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						await contract
							.connect(users["CONTRACT_DEPLOYER"])
							.setContractState(TEST.CONTRACT_STATE.PRIVATE_SALE)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.privateMint(qty, alloted, proof, { value: totalPrice }),
							contract,
							ethers.constants.AddressZero,
							operator.address,
							TEST.FIRST_TOKEN
						)
						expect(
							await contract.checkWhitelistAllowance(operator.address, TEST.CONTRACT_STATE.PRIVATE_SALE, alloted, proof)
						).to.equal(0)
						expect(
							await contract.totalSupply()
						).to.equal(qty)
						expect(
							await contract.balanceOf(operator.address)
						).to.equal(qty)
						expect(
							await contract.ownerOf(TEST.FIRST_TOKEN)
						).to.equal(operator.address)
					})
					it(`Should transfer the appropriate amount of tokens to the user`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						expect (
							await sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							)
						).to.changeTokenBalances(
							contract,
							[operator],
							[qty]
						)
					})
					it(`Should transfer the appropriate amount of ETH to the contract`, async function () {
						const operator = users["USER1"]
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(
							TEST.CONTRACT_STATE.PRIVATE_SALE,
							alloted,
							operator.address,
							users["SIGNER_WALLET"]
						)
						const totalPrice = TEST.SALE_PRICE.PRIVATE_SALE.mul(qty)
						expect(
							await sendPrivateMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice,
								alloted,
								proof
							)
						).to.changeEtherBalances(
							[operator, contract],
							[ethers.constants.Zero.sub(totalPrice), totalPrice]
						)
					})
				})
				describe(CONTRACT.METHODS.publicMint.SIGNATURE, function () {
					it(`Should be reverted when contract state is PAUSED`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await shouldRevertWhenContractStateIsIncorrect(
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PAUSED,
								qty,
								totalPrice
							),
							contract
						)
					})
					it(`Should be reverted when contract state is PRIVATE_SALE`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await shouldRevertWhenContractStateIsIncorrect(
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PRIVATE_SALE,
								qty,
								totalPrice
							),
							contract
						)
					})
					it(`Should be reverted when quantity requested is 0`, async function () {
						const operator = users["USER1"]
						const qty = 0
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await shouldRevertWhenQtyIsZero (
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice
							),
							contract
						)
					})
					it(`Should be reverted when quantity requested is higher than the max amount per transaction`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH + 1
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await shouldRevertWhenQtyOverMaxBatch (
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice
							),
							contract,
							qty,
							TEST.MAX_BATCH
						)
					})
					it(`Should be reverted when supply is depleted`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await depleteSupply(contract, users["CONTRACT_DEPLOYER"])
						await shouldRevertWhenMintedOut(
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice
							),
							contract,
							qty,
							0
						)
					})
					it(`Should be reverted when incorrect amount of ETH is sent`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await shouldRevertWhenIncorrectAmountPaid(
							sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								0
							),
							contract,
							0,
							totalPrice
						)
					})
					it(`Should emit a Transfer event`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						await contract
							.connect(users["CONTRACT_DEPLOYER"])
							.setContractState(TEST.CONTRACT_STATE.PUBLIC_SALE)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.publicMint(qty, { value: totalPrice }),
							contract,
							ethers.constants.AddressZero,
							operator.address,
							TEST.FIRST_TOKEN
						)
						expect(
							await contract.totalSupply()
						).to.equal(qty)
						expect(
							await contract.balanceOf(operator.address)
						).to.equal(qty)
						expect(
							await contract.ownerOf(TEST.FIRST_TOKEN)
						).to.equal(operator.address)
					})
					it(`Should transfer the appropriate amount of tokens to the user`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						expect (
							await sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice
							)
						).to.changeTokenBalances(
							contract,
							[operator],
							[qty]
						)
					})
					it(`Should transfer the appropriate amount of ETH to the contract`, async function () {
						const operator = users["USER1"]
						const qty = TEST.MAX_BATCH
						const totalPrice = TEST.SALE_PRICE.PUBLIC_SALE.mul(qty)
						expect (
							await sendPublicMint(
								contract,
								users["CONTRACT_DEPLOYER"],
								operator,
								TEST.CONTRACT_STATE.PUBLIC_SALE,
								qty,
								totalPrice
							)
						).to.changeEtherBalances(
							[operator, contract],
							[ethers.constants.Zero.sub(totalPrice), totalPrice]
						)
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.airdrop.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const account1 = users["USER1"]
						const account2 = users["USER2"]
						const amount1 = TEST.AIRDROP1
						const amount2 = TEST.AIRDROP2
						const accounts = [account1.address, account2.address]
						const amounts = [amount1, amount2]
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.airdrop(accounts, amounts),
							contract,
							operator.address
						)
					})
					it(`Should be reverted when array lengths don't match`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const account1 = users["USER1"]
						const account2 = users["USER2"]
						const amount1 = TEST.AIRDROP1
						const amount2 = TEST.AIRDROP2
						const accounts = [account1.address]
						const amounts = [amount1, amount2]
						await shouldRevertWhenArrayLengthsDontMatch(
							contract
								.connect(operator)
								.airdrop(accounts, amounts),
							contract
						)
					})
					it(`Should be reverted when airdropping more than the reserve`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const account1 = users["USER1"]
						const account2 = users["USER2"]
						const amount1 = TEST.AIRDROP1
						const amount2 = TEST.AIRDROP2 + 1
						const accounts = [account1.address, account2.address]
						const amounts = [amount1, amount2]
						await shouldRevertWhenReserveDepleted(
							contract
								.connect(operator)
								.airdrop(accounts, amounts),
							contract,
							amount1 + amount2,
							TEST.RESERVE
						)
					})
					it(`Should emit a Transfer event`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const account1 = users["USER1"]
						const account2 = users["USER2"]
						const amount1 = TEST.AIRDROP1
						const amount2 = TEST.AIRDROP2
						const accounts = [account1.address, account2.address]
						const amounts = [amount1, amount2]
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.airdrop(accounts, amounts),
							contract,
							ethers.constants.AddressZero,
							account1.address,
							TEST.FIRST_TOKEN
						)
						expect(
							await contract.reserve()
						).to.equal(TEST.RESERVE - (amount1 + amount2))
						expect(
							await contract.totalSupply()
						).to.equal(amount1 + amount2)
						expect(
							await contract.balanceOf(account1.address)
						).to.equal(amount1)
						expect(
							await contract.balanceOf(account2.address)
						).to.equal(amount2)
						expect(
							await contract.ownerOf(TEST.FIRST_TOKEN)
						).to.equal(account1.address)
					})
					it(`Should transfer the appropriate amount of tokens to the airdrop addresses`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const account1 = users["USER1"]
						const account2 = users["USER2"]
						const amount1 = TEST.AIRDROP1
						const amount2 = TEST.AIRDROP2
						const accounts = [account1.address, account2.address]
						const amounts = [amount1, amount2]
						expect (
							await contract
								.connect(operator)
								.airdrop(accounts, amounts)
						).changeTokenBalances(
							contract,
							accounts,
							amounts
						)
					})
				})
				describe(CONTRACT.METHODS.reduceReserve.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newReserve = 0
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.reduceReserve(newReserve),
							contract,
							operator.address
						)
					})
					it(`Should be reverted when trying to increase the reserve`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newReserve = TEST.RESERVE + 1
						await shouldRevertWhenInvalidReserve(
							contract
								.connect(operator)
								.reduceReserve(newReserve),
							contract
						)
					})
					it(`Should be fulfilled within expected conditions`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newReserve = 0
						await expect(
							contract
								.connect(operator)
								.reduceReserve(newReserve)
						).to.be.fulfilled
						expect(
							await contract.reserve()
						).to.equal(newReserve)
					})
				})
				describe(CONTRACT.METHODS.reduceSupply.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newSupply = TEST.RESERVE
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.reduceSupply(newSupply),
							contract,
							operator.address
						)
					})
					it(`Should be reverted when trying to increase the supply`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newSupply = TEST.MAX_SUPPLY + 1
						await shouldRevertWhenInvalidMaxSupply(
							contract
								.connect(operator)
								.reduceSupply(newSupply),
							contract
						)
					})
					it(`Should be reverted when trying to lower the max supply lower than the current supply`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newSupply = 0
						await shouldRevertWhenInvalidMaxSupply(
							contract
								.connect(operator)
								.reduceSupply(newSupply),
							contract
						)
					})
					it(`Should be fulfilled within expected conditions`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newSupply = TEST.RESERVE
						await expect(
							contract
								.connect(operator)
								.reduceSupply(newSupply)
						).to.be.fulfilled
						expect(
							await contract.maxSupply()
						).to.equal(newSupply)
					})
				})
				describe(CONTRACT.METHODS.setContractState.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newState = TEST.CONTRACT_STATE.PUBLIC_SALE
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setContractState(newState),
							contract,
							operator.address
						)
					})
					it(`Should be reverted when trying to set state to an invalid value`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newState = TEST.CONTRACT_STATE.INVALID_STATE
						await shouldRevertWhenContractStateIsInvalid(
							contract
								.connect(operator)
								.setContractState(newState),
							contract
						)
					})
					it(`Should emit a ContractStateChanged event`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newState = TEST.CONTRACT_STATE.PUBLIC_SALE
						await shouldEmitContractStateChangedEvent(
							contract
								.connect(operator)
								.setContractState(newState),
							contract,
							TEST.CONTRACT_STATE.PAUSED,
							newState
						)
					})
				})
				describe(CONTRACT.METHODS.setPrices.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newPrivatePrice = ethers.constants.Zero
						const newPublicPrice = ethers.constants.Zero
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setPrices(newPrivatePrice, newPublicPrice),
							contract,
							operator.address
						)
					})
					it(`Should be fulfilled within expected conditions`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newPrivatePrice = ethers.constants.Zero
						const newPublicPrice = ethers.constants.Zero
						await expect(
							contract
								.connect(operator)
								.setPrices(newPrivatePrice, newPublicPrice)
						).to.be.fulfilled
						expect(
							await contract.salePrice(TEST.CONTRACT_STATE.PRIVATE_SALE)
						).to.equal(newPrivatePrice)
						expect(
							await contract.salePrice(TEST.CONTRACT_STATE.PUBLIC_SALE)
						).to.equal(newPublicPrice)
					})
				})
				describe(CONTRACT.METHODS.setTreasury.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newTreasury = users["USER1"].address
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setTreasury(newTreasury),
							contract,
							operator.address
						)
					})
					it(`Should be fulfilled within expected conditions`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newTreasury = users["USER1"].address
						await expect(
							contract
								.connect(operator)
								.setTreasury(newTreasury)
						).to.be.fulfilled
						expect(
							await contract.treasury()
						).to.equal(newTreasury)
					})
				})
				describe(CONTRACT.METHODS.withdraw.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.withdraw(),
							contract,
							operator.address
						)
					})
					it(`Should be reverted when contract holds no ETH`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						await shouldRevertWhenContractHasNoBalance(
							contract
								.connect(operator)
								.withdraw(),
							contract
						)
					})
					it(`Should be reverted when treasury is not able to receive ETH`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const totalAmount = ethers.constants.WeiPerEther
						const tx = {
							to: contract.address,
							value: totalAmount
						}
						await users["USER1"].sendTransaction(tx)
						const non_eth_receiver_artifact = await ethers.getContractFactory("Mock_Invalid_Eth_Receiver")
						const non_eth_receiver = await non_eth_receiver_artifact.deploy()
						await contract
							.connect(users["CONTRACT_DEPLOYER"])
							.setTreasury(non_eth_receiver.address)
						await shouldRevertWhenEtherTransferFails(
							contract
								.connect(operator)
								.withdraw(),
							contract,
							non_eth_receiver.address,
							totalAmount
						)
					})
					it(`Should transfer the appropriate amount of ETH to the treasury`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const totalAmount = ethers.constants.WeiPerEther
						const tx = {
							to: contract.address,
							value: totalAmount
						}
						await users["USER1"].sendTransaction(tx)
						await expect(
							contract
								.connect(operator)
								.withdraw()
						).to.changeEtherBalances(
							[contract, users["TREASURY"]],
							[ethers.constants.Zero.sub(totalAmount), totalAmount]
						)
					})
				})
				describe(CONTRACT.METHODS.setBaseUri.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newUri = TEST.NEW_BASE_URI
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setBaseUri(newUri),
							contract,
							operator.address
						)
					})
					it(`Should be fulfilled when caller is contract owner`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newUri = TEST.NEW_BASE_URI
						await expect(
							contract
								.connect(operator)
								.setBaseUri(newUri)
						).to.be.fulfilled
					})
				})
				describe(CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newRecipient = users["USER1"].address
						const newRate = 0
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setRoyaltyInfo(newRecipient, newRate),
							contract,
							operator.address
						)
					})
					it(`Should be fulfilled when caller is contract owner`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newRecipient = users["USER1"].address
						const newRate = 0
						await expect(
							contract
								.connect(operator)
								.setRoyaltyInfo(newRecipient, newRate)
						).to.be.fulfilled
					})
				})
				describe(CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newAdminSigner = users["SIGNER_WALLET"].address
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.setWhitelist(newAdminSigner),
							contract,
							operator.address
						)
					})
					it(`Should be fulfilled when caller is contract owner`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newAdminSigner = users["SIGNER_WALLET"].address
						await expect(
							contract
								.connect(operator)
								.setWhitelist(newAdminSigner)
						).to.be.fulfilled
					})
				})
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.MAX_BATCH.SIGNATURE, function () {
					it(`Should be the value set at deployment`, async function () {
						const expected = TEST.MAX_BATCH
						expect(
							await contract.MAX_BATCH()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.contractState.SIGNATURE, function () {
					it(`Should be ${TEST.CONTRACT_STATE.PAUSED} by default`, async function () {
						const expected = TEST.CONTRACT_STATE.PAUSED
						expect(
							await contract.contractState()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.maxSupply.SIGNATURE, function () {
					it(`Should be the value set at deployment`, async function () {
						const expected = TEST.MAX_SUPPLY
						expect(
							await contract.maxSupply()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.reserve.SIGNATURE, function () {
					it(`Should be the value set at deployment`, async function () {
						const expected = TEST.RESERVE
						expect(
							await contract.reserve()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.treasury.SIGNATURE, function () {
					it(`Should be the value set at deployment`, async function () {
						const expected = users["TREASURY"].address
						expect(
							await contract.treasury()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.salePrice.SIGNATURE, function () {
					it(`Should be the values set at deployment`, async function () {
						expect(
							await contract.salePrice(TEST.CONTRACT_STATE.PAUSED)
						).to.equal(TEST.SALE_PRICE.PAUSED)
						expect(
							await contract.salePrice(TEST.CONTRACT_STATE.PRIVATE_SALE)
						).to.equal(TEST.SALE_PRICE.PRIVATE_SALE)
						expect(
							await contract.salePrice(TEST.CONTRACT_STATE.PUBLIC_SALE)
						).to.equal(TEST.SALE_PRICE.PUBLIC_SALE)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721AfterMint (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC721BatchAfterMint(fixture, TEST, CONTRACT)
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
		shouldBehaveLikeTemplate721AtDeploy(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeTemplate721AfterMint(mintFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
