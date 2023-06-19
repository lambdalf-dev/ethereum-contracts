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
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Mock_Whitelist`,
		METHODS: {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				consumeWhitelist: {
					SIGNATURE: `consumeWhitelist(address,uint8,uint256)`,
					PARAMS: [`account_`, `whitelistId_`, `qty_`],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				setWhitelist: {
					SIGNATURE: `setWhitelist(address)`,
					PARAMS: [`adminSigner_`],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				checkWhitelistAllowance: {
					SIGNATURE: `checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))`,
					PARAMS: [`account_`, `whitelistId_`, `alloted_`, `proof_`],
				},
			// **************************************
		},
	}

	const TEST_DATA = {
		NAME: `Whitelist`,
		// WHITELIST
		WHITELIST_AMOUNT_1: 3,
		WHITELIST_AMOUNT_2: 1,
		WHITELIST_TYPE_1: 1,
		WHITELIST_TYPE_2: 2,
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
			...addrs
		] = await ethers.getSigners()

		test_signer_wallet = getSignerWallet()
		test_fake_signer = getSignerWallet()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		const test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_fake_signer,
			test_signer_wallet,
		}
	}
	async function whitelistFixture() {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_fake_signer,
			test_signer_wallet,
		} = await loadFixture(deployFixture);

		await test_contract.setWhitelist(test_signer_wallet.address)

		return {
			test_user1,
			test_user2,
			test_contract,
			test_fake_signer,
			test_signer_wallet,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeMock_WhitelistBeforeSettingWhitelist (fixture, TEST, CONTRACT) {
		shouldBehaveLikeWhitelistBeforeSettingWhitelist(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_Whitelist before setting whitelist`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["FAKE_SIGNER"] = test_fake_signer
				users["SIGNER_WALLET"] = test_signer_wallet
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					it(`Should be reverted when whitelist is not set`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						await shouldRevertWhenWitelistIsNotSet(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof),
							contract
						)
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					it(`Setting a whitelist should be fulfilled under normal conditions`, async function () {
						const newAdminSigner = users["SIGNER_WALLET"].address
						await expect(
							contract.setWhitelist(newAdminSigner)
						).to.be.fulfilled
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeMock_WhitelistAfterSettingWhitelist (fixture, TEST, CONTRACT) {
		shouldBehaveLikeWhitelistAfterSettingWhitelist(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_Whitelist after setting whitelist`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["FAKE_SIGNER"] = test_fake_signer
				users["SIGNER_WALLET"] = test_signer_wallet
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					it(`User cannot access with someone else's proof`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, users["USER2"].address, users["SIGNER_WALLET"])
						await shouldRevertWhenNotWhitelisted(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof),
							contract,
							account
						)
					})
					it(`User cannot forge their own proof`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["FAKE_SIGNER"])
						await shouldRevertWhenNotWhitelisted(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof),
							contract,
							account
						)
					})
					it(`Whitelisted user cannot access a different whitelist`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(TEST.WHITELIST_TYPE_2, alloted, account, users["SIGNER_WALLET"])
						await shouldRevertWhenNotWhitelisted(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof),
							contract,
							account
						)
					})
					it(`Whitelisted user cannot access more than they are alloted`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						await shouldRevertWhenNotWhitelisted(
							contract.consumeWhitelist(account, whitelistId, qty, alloted + 1, proof),
							contract,
							account
						)
					})
					it(`Whitelisted user can access`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = TEST.WHITELIST_AMOUNT_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						await expect(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof)
						).to.be.fulfilled
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted, proof)
						).to.equal(0)
					})
					it(`Whitelisted user cannot access once their allocation is consummed`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const qty = 1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						await contract.consumeWhitelist(account, whitelistId, TEST.WHITELIST_AMOUNT_1, alloted, proof)
						await shouldRevertWhenNotWhitelisted(
							contract.consumeWhitelist(account, whitelistId, qty, alloted, proof),
							contract,
							account
						)
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
		shouldBehaveLikeMock_WhitelistBeforeSettingWhitelist(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_WhitelistAfterSettingWhitelist(whitelistFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
