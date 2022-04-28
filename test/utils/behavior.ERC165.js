// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( '../test-activation-module' )
	const {
		CST,
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

	const { ethers, waffle } = require( 'hardhat' )
	const { loadFixture, deployContract } = waffle

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( '../fail-test-module' )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For activating or de-activating test cases
	const TEST = {
		METHODS : {
			supportsInterface : true,
		},
	}

	// For contract data
	const CONTRACT = {
		METHODS : {
			supportsInterface : {
				SIGNATURE : 'supportsInterface(bytes4)',
				PARAMS    : [ 'interfaceId_' ],
			},
		}
	}

	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldSupportInterface ( fixture, interfaces ) {
		describe( CONTRACT.METHODS.supportsInterface.SIGNATURE, function () {
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

				it( 'Contract should not support invalid interface ID', async function () {
					const interfaceId = CST.INTERFACE_ID.INVALID
					expect(
						await contract.supportsInterface( interfaceId )
					).to.be.false
				})

				it( 'Contract should not support zero interface ID', async function () {
					const interfaceId = CST.INTERFACE_ID.NULL
					expect(
						await contract.supportsInterface( interfaceId )
					).to.be.false
				})

				interfaces.forEach( async function( interface ) {
					it( 'Contract should support ' + interface, async function () {
						const interfaceId = CST.INTERFACE_ID[ interface ]
						expect(
							await contract.supportsInterface( interfaceId )
						).to.be.true
					})
				})
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = { shouldSupportInterface }
