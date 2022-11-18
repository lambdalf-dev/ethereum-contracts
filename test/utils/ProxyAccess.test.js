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
	async function fixture () {
		const [
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		const proxy_artifact = await ethers.getContractFactory( `Mock_ProxyRegistry` )
		const test_proxy_contract = await proxy_artifact.deploy()
		await test_proxy_contract.deployed()
		await test_proxy_contract.setProxy( test_token_owner.address, test_proxy_user.address )

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()
		await test_contract.connect( test_contract_deployer )
											 .addProxyRegistry( test_proxy_contract.address )

		return {
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
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

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

	async function shouldBehaveLikeMock_ProxyAccess ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ProxyAccess`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
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
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
					it( `Setting up a proxy registry`, async function () {
						const proxyRegistryAddress = proxy_contract.address
						await expect(
							contract.connect( users[ CONTRACT_DEPLOYER ] )
											.addProxyRegistry( proxyRegistryAddress )
						).to.be.fulfilled
					})
				})

				describe( CONTRACT.METHODS.isRegisteredProxy.SIGNATURE, function () {
					beforeEach( async function () {
						const proxyRegistryAddress = proxy_contract.address
						await contract.connect( users[ CONTRACT_DEPLOYER ] )
													.addProxyRegistry( proxyRegistryAddress )
					})

					it( `${ USER_NAMES[ PROXY_USER ] } is a registered proxy for ${ USER_NAMES[ TOKEN_OWNER ] }`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ].address
						const operator   = users[ PROXY_USER ].address
						expect(
							await contract.isRegisteredProxy( tokenOwner, operator )
						).to.be.true
					})

					it( `${ USER_NAMES[ PROXY_USER ] } is not a registerd proxy for ${ USER_NAMES[ CONTRACT_DEPLOYER ] }`, async function () {
						const tokenOwner = users[ CONTRACT_DEPLOYER ].address
						const operator   = users[ PROXY_USER ].address
						expect(
							await contract.isRegisteredProxy( tokenOwner, operator )
						).to.be.false
					})

					describe( CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
						it( `Removing a proxy registry`, async function () {
							const proxyRegistryAddress = proxy_contract.address
							await expect(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.removeProxyRegistry( proxyRegistryAddress )
							).to.be.fulfilled

							const tokenOwner = users[ TOKEN_OWNER ].address
							const operator   = users[ PROXY_USER ].address
							expect(
								await contract.isRegisteredProxy( tokenOwner, operator )
							).to.be.false
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
		testInvalidInputs( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_ProxyAccess( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
