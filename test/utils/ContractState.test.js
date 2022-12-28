// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
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
		CONTRACT_STATE,
		shouldBehaveLikeContractState,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.ContractState` )
	CONTRACT_STATE.PUBLIC_SALE = 1
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_ContractState`,
		METHODS : {
			setContractState : {
				SIGNATURE : `setContractState(uint8)`,
				PARAMS    : [ `newState_` ],
			},
			getContractState : {
				SIGNATURE : `getContractState()`,
				PARAMS    : [],
			},
			stateIsClosed : {
				SIGNATURE : `stateIsClosed()`,
				PARAMS    : [],
			},
			stateIsNotClosed : {
				SIGNATURE : `stateIsNotClosed()`,
				PARAMS    : [],
			},
			stateIsOpen : {
				SIGNATURE : `stateIsOpen()`,
				PARAMS    : [],
			},
			stateIsNotOpen : {
				SIGNATURE : `stateIsNotOpen()`,
				PARAMS    : [],
			},
		},
	}

	const TEST_DATA = {
		NAME : `ContractState`,
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
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_contract,
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
						test_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.setContractState.SIGNATURE ] = {
						err  : null,
						args : [
							CONTRACT_STATE.PUBLIC_SALE,
						],
					}
					defaultArgs [ CONTRACT.METHODS.getContractState.SIGNATURE ] = {
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
	function shouldBehaveLikeMock_ContractState ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_ContractState`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			describe( `When contract state is PAUSED`, function () {
				it( `${ CONTRACT.METHODS.stateIsClosed.SIGNATURE } should be fulfilled when contract state is PAUSED`, async function () {
					expect(
						await contract.stateIsClosed()
					).to.be.true
				})

				it( `${ CONTRACT.METHODS.stateIsNotClosed.SIGNATURE } should be reverted when contract state is PAUSED`, async function () {
					await shouldRevertWhenContractStateIsIncorrect(
						contract.stateIsNotClosed(),
						contract,
						CONTRACT_STATE.PAUSED
					)
				})

				it( `${ CONTRACT.METHODS.stateIsOpen.SIGNATURE } should be reverted when contract state is PAUSED`, async function () {
					await shouldRevertWhenContractStateIsIncorrect(
						contract.stateIsOpen(),
						contract,
						CONTRACT_STATE.PAUSED
					)
				})

				it( `${ CONTRACT.METHODS.stateIsNotOpen.SIGNATURE } should be fulfilled when contract state is PAUSED`, async function () {
					expect(
						await contract.stateIsNotOpen()
					).to.be.true
				})

				describe( CONTRACT.METHODS.setContractState.SIGNATURE, function () {
					it( `should be reverted when an invalid state is entered`, async function () {
						const newState = 5
						await shouldRevertWhenContractStateIsInvalid(
							contract.setContractState( newState ),
							contract,
							newState
						)
					})

					it( `Setting the sale state to OPEN`, async function () {
						const previousState = CONTRACT_STATE.PAUSED
						const newState      = CONTRACT_STATE.PUBLIC_SALE
						await shouldEmitContractStateChangedEvent(
							contract
								.connect( users[ CONTRACT_DEPLOYER ] )
								.setContractState( newState ),
							contract,
							previousState,
							newState
						)

						expect(
							await contract.getContractState()
						).to.equal( newState )
					})

					it( `Setting the sale state to OPEN`, async function () {
						const previousState = CONTRACT_STATE.PAUSED
						const newState      = CONTRACT_STATE.PUBLIC_SALE
						await shouldEmitContractStateChangedEvent(
							contract
								.connect( users[ CONTRACT_DEPLOYER ] )
								.setContractState( newState ),
							contract,
							previousState,
							newState
						)

						expect(
							await contract.getContractState()
						).to.equal( newState )
					})
				})
			})
			describe( `New state: OPEN`, function () {
				beforeEach( async function () {
					const previousState = CONTRACT_STATE.PAUSED
					const newState      = CONTRACT_STATE.PUBLIC_SALE
					await shouldEmitContractStateChangedEvent(
						contract
							.connect( users[ CONTRACT_DEPLOYER ] )
							.setContractState( newState ),
						contract,
						previousState,
						newState
					)
				})

				it( `${ CONTRACT.METHODS.stateIsClosed.SIGNATURE } should be reverted when contract state is OPEN`, async function () {
					await shouldRevertWhenContractStateIsIncorrect(
						contract.stateIsClosed(),
						contract,
						CONTRACT_STATE.PUBLIC_SALE
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
						contract,
						CONTRACT_STATE.PUBLIC_SALE
					)
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
		testInvalidInputs( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeContractState( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_ContractState( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})

module.exports = {
	shouldBehaveLikeMock_ContractState,
}