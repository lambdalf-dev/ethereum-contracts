const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IPausable_Extended.sol/Mock_IPausable_Extended.json` )
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

	const {
		CONTRACT_STATE,
		shouldBehaveLikeIPausable,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.IPausable` )

	const {
		shouldBehaveLikeMock_IPausable,
	} = require( `./IPausable.test` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_IPausable_Extended`,
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
			stateIsStage2        : {
				SIGNATURE          : `stateIsStage2()`,
				PARAMS             : [],
			},
			stateIsNotStage2     : {
				SIGNATURE          : `stateIsNotStage2()`,
				PARAMS             : [],
			},
		},
	}

	const TEST_DATA = {
		NAME : `IPausable_Extended`,
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
			stateIsStage2        : true,
			stateIsNotStage2     : true,
		},
	}
	CONTRACT_STATE.STAGE2 = 2

	let test_contract_params

	let contract
	let users = {}
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
		test_contract = await contract_artifact.deploy()
		// test_contract_params = []
		// let test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
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
					defaultArgs [ CONTRACT.METHODS.stateIsStage2.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.stateIsNotStage2.SIGNATURE ] = {
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

	function shouldBehaveLikeMock_IPausable_Extended ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeMock_IPausable( fixture, TEST, CONTRACT )

		describe( `Should behave like Mock_IPausable_Extended`, function () {
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
					it( `${ CONTRACT.METHODS.stateIsStage2.SIGNATURE } should be reverted when contract state is CLOSED`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsStage2(),
							contract,
							CONTRACT_STATE.CLOSED
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotStage2.SIGNATURE } should be fulfilled when contract state is CLOSED`, async function () {
						expect(
							await contract.stateIsNotStage2()
						).to.be.true
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

					it( `${ CONTRACT.METHODS.stateIsStage2.SIGNATURE } should be reverted when contract state is OPEN`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsStage2(),
							contract,
							CONTRACT_STATE.OPEN
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotStage2.SIGNATURE } should be fulfilled when contract state is OPEN`, async function () {
						expect(
							await contract.stateIsNotStage2()
						).to.be.true
					})
				})

				describe( `New state: STAGE2`, function () {
					beforeEach( async function () {
						const previousState = CONTRACT_STATE.CLOSED
						const newState      = CONTRACT_STATE.STAGE2
						await shouldEmitContractStateChangedEvent(
							contract.connect( users[ CONTRACT_DEPLOYER ] )
											.setPauseState( newState ),
							contract,
							previousState,
							newState
						)
					})

					it( `${ CONTRACT.METHODS.stateIsClosed.SIGNATURE } should be reverted when contract state is STAGE2`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsClosed(),
							contract,
							CONTRACT_STATE.STAGE2
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotClosed.SIGNATURE } should be fulfilled when contract state is STAGE2`, async function () {
						expect(
							await contract.stateIsNotClosed()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsOpen.SIGNATURE } should be reverted when contract state is STAGE2`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsOpen(),
							contract,
							CONTRACT_STATE.STAGE2
						)
					})

					it( `${ CONTRACT.METHODS.stateIsNotOpen.SIGNATURE } should be fulfilled when contract state is STAGE2`, async function () {
						expect(
							await contract.stateIsNotOpen()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsStage2.SIGNATURE } should be fulfilled when contract state is STAGE2`, async function () {
						expect(
							await contract.stateIsStage2()
						).to.be.true
					})

					it( `${ CONTRACT.METHODS.stateIsNotStage2.SIGNATURE } should be reverted when contract state is STAGE2`, async function () {
						await shouldRevertWhenContractStateIsIncorrect(
							contract.stateIsNotStage2(),
							contract,
							CONTRACT_STATE.STAGE2
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
		shouldBehaveLikeMock_IPausable_Extended( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
