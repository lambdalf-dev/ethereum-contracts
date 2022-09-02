const ARTIFACT = require( '../../artifacts/contracts/mocks/utils/Mock_ContractMetadata.sol/Mock_ContractMetadata.json' )
// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( '../test-activation-module' )
	const {
		THROW,
		ERROR,
		USER1,
		USER2,
		USER_NAMES,
		PROXY_USER,
		TOKEN_OWNER,
		OTHER_OWNER,
		CONTRACT_DEPLOYER,
	} = require( '../test-var-module' )

	const chai = require( 'chai' )
	const chaiAsPromised = require( 'chai-as-promised' )
	chai.use( chaiAsPromised )
	const expect = chai.expect

	const { ethers } = require( `hardhat` )
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( '../fail-test-module' )

	const {
		shouldBehaveLikeContractMetadata,
	} = require( '../utils/behavior.ContractMetadata' )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : 'Mock_ContractMetadata',
		METHODS : {
			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setContractURI       : {
					SIGNATURE          : 'setContractURI(string)',
					PARAMS             : [ 'url_' ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				contractURI          : {
					SIGNATURE          : 'contractURI()',
					PARAMS             : [],
				},
			// **************************************
		},
	}

	const TEST_DATA = {
		NAME : 'ContractMetadata',
		METHODS : {
			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setContractURI       : true,
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				contractURI          : true,
			// **************************************
		},
		// CONTRACT URI
		NEW_CONTRACT_URI   : 'https://api.example.com/contract',
		PARAMS             : {
			contractURI_     : '',
		}
	}

	let test_qty
	let test_contract_params

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function fixture() {
		[
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy(
			TEST_DATA.PARAMS.contractURI_
		)
		// const params = [
		// 	TEST_DATA.PARAMS.contractURI_
		// ]
		// let test_contract = await deployContract( test_contract_deployer, ARTIFACT, params )
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function testInvalidInputs ( fixture, TEST, CONTRACT ) {
		describe( 'Invalid inputs', function () {
			if ( TEST_ACTIVATION.INVALID_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.contractURI.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.setContractURI.SIGNATURE ] = {
						err  : null,
						args : [
							TEST.NEW_CONTRACT_URI,
						],
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

	function shouldBehaveLikeMock_ContractMetadata ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeContractMetadata( fixture, TEST, CONTRACT )

		describe( `Should behave like Mock_ContractMetadata`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( CONTRACT.METHODS.setContractURI.SIGNATURE, function () {
					if ( TEST.METHODS.setContractURI ) {
						it( `Contract URI should be successfully set`, async function () {
							const contractURI = TEST.NEW_CONTRACT_URI
							await expect(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.setContractURI( contractURI )
							).to.be.fulfilled

							expect(
								await contract.contractURI()
							).to.equal( contractURI )
						})
					}
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
		shouldBehaveLikeMock_ContractMetadata( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
