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
		shouldBehaveLikeProxyAccessBeforeProxy,
		shouldBehaveLikeProxyAccessAfterProxy,
		shouldRevertWhenProxyRegistryExist,
		shouldRevertWhenProxyRegistryDontExist,
	} = require(`./behavior.ProxyAccess`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME: `Mock_ProxyAccess`,
		METHODS: {
			// **************************************
			// *****            VIEW            *****
			// **************************************
				isRegisteredProxy: {
					SIGNATURE: `isRegisteredProxy(address,address)`,
					PARAMS: [`tokenOwner_`, `operator_`],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				addProxyRegistry: {
					SIGNATURE: `addProxyRegistry(address)`,
					PARAMS: [`proxyRegistryAddress_`],
				},
				removeProxyRegistry: {
					SIGNATURE: `removeProxyRegistry(address)`,
					PARAMS: [`proxyRegistryAddress_`],
				},
			// **************************************
		},
	}

	const TEST_DATA = {
		NAME: `ProxyAccess`,
	}

	let users = {}
	let contract
	let proxy_contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function noProxyFixture () {
		const [
			test_contract_deployer,
			test_proxy_user,
			test_token_owner,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory(`Mock_ProxyRegistry`)
		const test_proxy_contract = await proxy_artifact.deploy()
		const test_proxy_contract1 = await proxy_artifact.deploy()
		const test_proxy_contract2 = await proxy_artifact.deploy()
		await test_proxy_contract.deployed()
		await test_proxy_contract1.deployed()
		await test_proxy_contract2.deployed()
		await test_proxy_contract.setProxy(test_token_owner.address, test_proxy_user.address)

		const contract_artifact = await ethers.getContractFactory(CONTRACT_INTERFACE.NAME)
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
			test_proxy_contract1,
			test_proxy_contract2,
		}
	}
	async function proxyFixture () {
		const {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
			test_proxy_contract1,
			test_proxy_contract2,
		} = await loadFixture(noProxyFixture)

		await test_contract.addProxyRegistry(test_proxy_contract1.address)
		await test_contract.addProxyRegistry(test_proxy_contract.address)
		await test_contract.addProxyRegistry(test_proxy_contract2.address)

		return {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
			test_proxy_contract1,
			test_proxy_contract2,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	async function shouldBehaveLikeMock_ProxyAccessBeforeProxy (fixture, TEST, CONTRACT) {
		shouldBehaveLikeProxyAccessBeforeProxy(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_ProxyAccess before setting proxy`, function () {
			beforeEach(async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture(fixture)

				contract = test_contract
				proxy_contract = test_proxy_contract
				users["PROXY_USER"] = test_proxy_user
				users["TOKEN_OWNER"] = test_token_owner
			})

			describe(CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
				it(`Setting up a proxy registry`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await expect(
						contract.addProxyRegistry(proxyRegistryAddress)
					).to.be.fulfilled
				})
			})
			describe(CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
				it(`Should be reverted when the proxy registry is not registered`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await shouldRevertWhenProxyRegistryDontExist(
						contract.removeProxyRegistry(proxyRegistryAddress),
						contract
					)
				})
			})
		})
	}
	async function shouldBehaveLikeMock_ProxyAccessAfterProxy (fixture, TEST, CONTRACT) {
		shouldBehaveLikeProxyAccessAfterProxy(fixture, TEST, CONTRACT)

		describe(`Should behave like Mock_ProxyAccess after setting proxy`, function () {
			beforeEach(async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture(fixture)

				contract = test_contract
				proxy_contract = test_proxy_contract
				users["PROXY_USER"] = test_proxy_user
				users["TOKEN_OWNER"] = test_token_owner
			})

			describe(CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
				it(`Should be reverted when the proxy registry is already registered`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await shouldRevertWhenProxyRegistryExist(
						contract.addProxyRegistry(proxyRegistryAddress),
						contract
					)
				})
			})
			describe(CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
				it(`Removing a proxy registry`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await expect(
						contract.removeProxyRegistry(proxyRegistryAddress)
					).to.be.fulfilled
					await expect(
						contract.addProxyRegistry(proxyRegistryAddress)
					).to.be.fulfilled
					await expect(
						contract.removeProxyRegistry(proxyRegistryAddress)
					).to.be.fulfilled
					const tokenOwner = users["TOKEN_OWNER"].address
					const operator = users["PROXY_USER"].address
					expect(
						await contract.isRegisteredProxy(tokenOwner, operator)
					).to.be.false
				})
			})
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe(TEST_DATA.NAME, function () {
	if (true) {
		shouldBehaveLikeMock_ProxyAccessBeforeProxy(noProxyFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
	if (true) {
		shouldBehaveLikeMock_ProxyAccessAfterProxy(proxyFixture, TEST_DATA, CONTRACT_INTERFACE)
	}
})
