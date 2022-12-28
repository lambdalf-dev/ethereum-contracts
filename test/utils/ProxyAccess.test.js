// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		PROXY_USER,
		TOKEN_OWNER,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )

	const {
		shouldBehaveLikeProxyAccessBeforeProxy,
		shouldBehaveLikeProxyAccessAfterProxy,
		shouldRevertWhenProxyRegistryExist,
		shouldRevertWhenProxyRegistryDontExist,
	} = require( `../utils/behavior.ProxyAccess` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_ProxyAccess`,
		METHODS : {
			isRegisteredProxy    : {
				SIGNATURE          : `isRegisteredProxy(address,address)`,
				PARAMS             : [ `tokenOwner_`, `operator_` ],
			},
			addProxyRegistry     : {
				SIGNATURE          : `addProxyRegistry(address)`,
				PARAMS             : [ `proxyRegistryAddress_` ],
			},
			removeProxyRegistry  : {
				SIGNATURE          : `removeProxyRegistry(address)`,
				PARAMS             : [ `proxyRegistryAddress_` ],
			},
		},
	}

	const TEST_DATA = {
		NAME : `ProxyAccess`,
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

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		const test_proxy_contract = await proxy_artifact.deploy()
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
		}
	}
	async function proxyFixture () {
		const {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
		} = await loadFixture( noProxyFixture )

		await test_contract.addProxyRegistry( test_proxy_contract.address )

		return {
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_proxy_contract,
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
						test_contract,
						test_proxy_user,
						test_proxy_contract,
					} = await loadFixture( fixture )

					contract = test_contract
					proxy_contract = test_proxy_contract
					users[ PROXY_USER ] = test_proxy_user
					users[ TOKEN_OWNER ] = test_token_owner

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.isRegisteredProxy.SIGNATURE ] = {
						err  : null,
						args : [
							users[ TOKEN_OWNER ].address,
							users[ PROXY_USER ].address,
						]
					}
					defaultArgs [ CONTRACT.METHODS.addProxyRegistry.SIGNATURE ] = {
						err  : null,
						args : [
							test_proxy_contract.address,
						]
					}
					defaultArgs [ CONTRACT.METHODS.removeProxyRegistry.SIGNATURE ] = {
						err  : null,
						args : [
							test_proxy_contract.address,
						]
					}
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
	async function shouldBehaveLikeMock_ProxyAccessBeforeProxy ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeProxyAccessBeforeProxy( fixture, TEST, CONTRACT )

		describe( `Should behave like Mock_ProxyAccess before setting proxy`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture( fixture )

				contract = test_contract
				proxy_contract = test_proxy_contract
				users[ PROXY_USER ] = test_proxy_user
				users[ TOKEN_OWNER ] = test_token_owner
			})

			describe( CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
				it( `Setting up a proxy registry`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await expect(
						contract.addProxyRegistry( proxyRegistryAddress )
					).to.be.fulfilled
				})
			})
			describe( CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
				it( `Should be reverted when the proxy registry is not registered`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await shouldRevertWhenProxyRegistryDontExist(
						contract.removeProxyRegistry( proxyRegistryAddress ),
						contract
					)
				})
			})
		})
	}
	async function shouldBehaveLikeMock_ProxyAccessAfterProxy ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeProxyAccessAfterProxy( fixture, TEST, CONTRACT )

		describe( `Should behave like Mock_ProxyAccess after setting proxy`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture( fixture )

				contract = test_contract
				proxy_contract = test_proxy_contract
				users[ PROXY_USER ] = test_proxy_user
				users[ TOKEN_OWNER ] = test_token_owner
			})

			describe( CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
				it( `Should be reverted when the proxy registry is already registered`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await shouldRevertWhenProxyRegistryExist(
						contract.addProxyRegistry( proxyRegistryAddress ),
						contract
					)
				})
			})
			describe( CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
				it( `Removing a proxy registry`, async function () {
					const proxyRegistryAddress = proxy_contract.address
					await expect(
						contract.removeProxyRegistry( proxyRegistryAddress )
					).to.be.fulfilled
					const tokenOwner = users[ TOKEN_OWNER ].address
					const operator = users[ PROXY_USER ].address
					expect(
						await contract.isRegisteredProxy( tokenOwner, operator )
					).to.be.false
				})
			})
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		testInvalidInputs( noProxyFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_ProxyAccessBeforeProxy( noProxyFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_ProxyAccessAfterProxy( proxyFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
