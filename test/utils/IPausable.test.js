const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IPausable.sol/Mock_IPausable.json` )
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

	const { ethers, waffle } = require( `hardhat` )
	const { loadFixture, deployContract } = waffle

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )

	const {
		CONTRACT_STATE,
		shouldBehaveLikeIPausable,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.IPausable` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_IPausable`,
		METHODS : {
			setPauseState        : {
				SIGNATURE          : `setPauseState(uint8)`,
				PARAMS             : [ `newState_` ],
			},
			getPauseState        : {
				SIGNATURE          : `getPauseState()`,
				PARAMS             : [],
			},
			stateIsClosed        : {
				SIGNATURE          : `stateIsClosed()`,
				PARAMS             : [],
			},
			stateIsNotClosed     : {
				SIGNATURE          : `stateIsNotClosed()`,
				PARAMS             : [],
			},
			stateIsOpen          : {
				SIGNATURE          : `stateIsOpen()`,
				PARAMS             : [],
			},
			stateIsNotOpen       : {
				SIGNATURE          : `stateIsNotOpen()`,
				PARAMS             : [],
			},
		},
	}

	const TEST_DATA = {
		NAME : `IPausable`,
		EVENTS : {
			ContractStateChanged : true,
		},
		METHODS : {
			setPauseState        : true,
			getPauseState        : true,
			stateIsClosed        : true,
			stateIsNotClosed     : true,
			stateIsOpen          : true,
			stateIsNotOpen       : true,
		},
	}

	let test_contract_params

	let contract
	let users = {}
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function fixture() {
		[
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		test_contract_params = []
		let test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
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
					defaultArgs [ CONTRACT.METHODS.setPauseState.SIGNATURE ] = {
						err  : null,
						args : [
							CONTRACT_STATE.OPEN,
						],
					}
					defaultArgs [ CONTRACT.METHODS.getPauseState.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.stateIsClosed.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.stateIsNotClosed.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.stateIsOpen.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.stateIsNotOpen.SIGNATURE ] = {
						err  : null,
						args : [],
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

	function shouldBehaveLikeMock_IPausable ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IPausable`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( `When contract state is CLOSED`, function () {
					it( `${ CONTRACT.METHODS.stateIsClosed.SIGNATURE } should be fulfilled when contract state is CLOSED`, async function () {
						expect(
							await contract.stateIsClosed()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsNotClosed.SIGNATURE } should be reverted when contract state is CLOSED`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsNotClosed(),
							CONTRACT_STATE.CLOSED
						)
					})

					it( `${ CONTRACT.METHODS.stateIsOpen.SIGNATURE } should be reverted when contract state is CLOSED`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsOpen(),
							CONTRACT_STATE.CLOSED
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotOpen.SIGNATURE } should be fulfilled when contract state is CLOSED`, async function () {
						expect(
							await contract.stateIsNotOpen()
						).to.be.true
					})

					describe( CONTRACT.METHODS.setPauseState.SIGNATURE, function () {
						if ( TEST.METHODS.setPauseState ) {
							it( `should be reverted when an invalid state is entered`, async function () {
								const newState = 5
								await shouldRevertWhenContractStateIsInvalid(
									contract.setPauseState( newState ),
									newState
								)
							})

							it( `Setting the sale state to OPEN`, async function () {
								const previousState = CONTRACT_STATE.CLOSED
								const newState      = CONTRACT_STATE.OPEN
								await shouldEmitContractStateChangedEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.setPauseState( newState ),
									contract,
									previousState,
									newState
								)

								expect(
									await contract.getPauseState()
								).to.equal( newState )
							})

							it( `Setting the sale state to OPEN`, async function () {
								const previousState = CONTRACT_STATE.CLOSED
								const newState      = CONTRACT_STATE.OPEN
								await shouldEmitContractStateChangedEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.setPauseState( newState ),
									contract,
									previousState,
									newState
								)

								expect(
									await contract.getPauseState()
								).to.equal( newState )
							})
						}
					})
				})

				describe( `New state: OPEN`, function () {
					beforeEach( async function () {
						const previousState = CONTRACT_STATE.CLOSED
						const newState      = CONTRACT_STATE.OPEN
						await shouldEmitContractStateChangedEvent(
							contract.connect( users[ CONTRACT_DEPLOYER ] )
											.setPauseState( newState ),
							contract,
							previousState,
							newState
						)
					})

					it( `${ CONTRACT.METHODS.stateIsClosed.SIGNATURE } should be reverted when contract state is OPEN`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsClosed(),
							CONTRACT_STATE.OPEN
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotClosed.SIGNATURE } should be fulfilled when contract state is OPEN`, async function () {
						expect(
							await contract.stateIsNotClosed()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsOpen.SIGNATURE } should be fulfilled when contract state is OPEN`, async function () {
						expect(
							await contract.stateIsOpen()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsNotOpen.SIGNATURE } should be reverted when contract state is OPEN`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsNotOpen(),
							CONTRACT_STATE.OPEN
						)
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
		shouldBehaveLikeIPausable( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IPausable( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})

module.exports = {
	shouldBehaveLikeMock_IPausable,
}