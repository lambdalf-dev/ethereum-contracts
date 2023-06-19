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
		shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase,
		shouldBehaveLikeERC2981,
	} = require(`./behavior.IERC2981`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Mock_ERC2981`,
		METHODS: {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				payRoyalties: {
					SIGNATURE: `payRoyalties(uint256)`,
					PARAMS: [`tokenId_`],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				// ***********
				// * IERC2981 *
				// ***********
					setRoyaltyInfo: {
						SIGNATURE: `setRoyaltyInfo(address,uint96)`,
						PARAMS: [`newRoyaltyRecipient_`, `newRoyaltyRate_`],
					},
				// ***********
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// ***********
				// * IERC2981 *
				// ***********
					royaltyInfo: {
						SIGNATURE: `royaltyInfo(uint256,uint256)`,
						PARAMS: [`tokenId_`, `salePrice_`],
					},
				// ***********

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

	const TEST_DATA = {
		NAME: `ERC2981`,
		// TARGET
		TARGET_TOKEN: 3,
		// ROYALTIES
		ROYALTY_BASE: 10000,
		DEFAULT_ROYALTY_RATE: 1000,
		// INTERFACES
		INTERFACES: [
			`IERC165`,
			`IERC2981`,
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
			test_royalty_recipient,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		const test_contract = await contract_artifact.deploy(
			test_royalty_recipient.address,
			TEST_DATA.DEFAULT_ROYALTY_RATE
		)
		await test_contract.deployed()

		return {
			test_user1,
			test_contract,
			test_royalty_recipient,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeMock_ERC2981 (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC2981(fixture, TEST, CONTRACT)

		describe(`Should behave like ERC2981`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["ROYALTY_RECIPIENT"] = test_royalty_recipient
			})

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE, function () {
					it(`Should be reverted when setting royalty rate to more than 100%`, async function () {
						const newRoyaltyRecipient = users["USER1"].address
						const newRoyaltyRate = TEST.ROYALTY_BASE + 1
						await shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase(
							contract.setRoyaltyInfo(newRoyaltyRecipient, newRoyaltyRate),
							contract
						)
						const tokenId = TEST.TARGET_TOKEN
						const salePrice = ethers.constants.WeiPerEther
						const expectedRecipient = users["ROYALTY_RECIPIENT"].address
						const expectedRate = salePrice.mul(TEST.DEFAULT_ROYALTY_RATE).div(TEST.ROYALTY_BASE)

						const royaltyInfo = await contract.royaltyInfo(tokenId, salePrice)
						expect(royaltyInfo).to.exist
						expect(royaltyInfo[0]).to.equal(expectedRecipient)
						expect(royaltyInfo[1]).to.equal(expectedRate)
					})
					it(`Should be fulfilled when setting royalty rate to less than 100%`, async function () {
						const newRoyaltyRecipient = users["USER1"].address
						const newRoyaltyRate = 0
						await expect(
							contract.setRoyaltyInfo(newRoyaltyRecipient, newRoyaltyRate)
						).to.be.fulfilled

						const tokenId = TEST.TARGET_TOKEN
						const salePrice = ethers.constants.WeiPerEther
						const expectedRecipient = ethers.constants.AddressZero
						const expectedRate = salePrice.mul(newRoyaltyRate).div(TEST.ROYALTY_BASE)

						const royaltyInfo = await contract.royaltyInfo(tokenId, salePrice)
						expect(royaltyInfo).to.exist
						expect(royaltyInfo[0]).to.equal(expectedRecipient)
						expect(royaltyInfo[1]).to.equal(expectedRate)
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.payRoyalties.SIGNATURE, function () {
					it(`Should pay the appropriate amount of royalties`, async function () {
						const operator = users["USER1"]
						const tokenId = TEST.TARGET_TOKEN
						const price = ethers.constants.WeiPerEther
						const tx_params = { value: price }
						const expectedRoyalties = price.mul(TEST.DEFAULT_ROYALTY_RATE).div(TEST.ROYALTY_BASE)
						const expectedRecipient = users["ROYALTY_RECIPIENT"]
						await expect(
							contract
								.connect(operator)
								.payRoyalties(tokenId, tx_params)
						).to.changeEtherBalances(
							[operator, expectedRecipient, contract],
							[ethers.constants.Zero.sub(price), expectedRoyalties, price.sub(expectedRoyalties)]
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
		shouldSupportInterface(deployFixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ERC2981(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
