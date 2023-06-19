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
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME: `Mock_ERC173`,
		METHODS: {
			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				// ***********
				// * IERC173 *
				// ***********
					transferOwnership: {
						SIGNATURE: `transferOwnership(address)`,
						PARAMS: [`newOwner_`],
					},
				// ***********
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				// ***********
				// * IERC173 *
				// ***********
					owner: {
						SIGNATURE: `owner()`,
						PARAMS: [],
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
		NAME: `ERC173`,
		// INTERFACES
		INTERFACES: [
			`IERC165`,
			`IERC173`,
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
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		const test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_user1,
			test_contract,
			test_contract_deployer,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeMock_ERC173 (fixture, TEST, CONTRACT) {
		shouldBehaveLikeERC173(fixture, TEST, CONTRACT)
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
		shouldBehaveLikeMock_ERC173(deployFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
