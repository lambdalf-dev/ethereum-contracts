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
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// SALE STATE
	const CONTRACT_STATE = {
		CLOSED : 0,
		OPEN   : 1,
	}
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// For some reason, the processing of the enum type fails...
	// While waiting to find a solution, it is simpler to skip the arguments verification
	async function shouldEmitContractStateChangedEvent ( promise, contract, previousState, newState ) {
		await expect( promise ).to.emit( contract, `ContractStateChanged` )
													 .withArgs( previousState, newState )
	}

	async function shouldRevertWhenContractStateIsIncorrect ( promise, currentState, error = `IPausable_INCORRECT_STATE` ) {
		await expect( promise ).to.be.revertedWith( `${ error }(${ currentState })` )
	}

	async function shouldRevertWhenContractStateIsInvalid ( promise, currentState, error = `IPausable_INVALID_STATE` ) {
		await expect( promise ).to.be.revertedWith( `${ error }(${ currentState })` )
	}

	function shouldBehaveLikeIPausable ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like IPausable`, function () {
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

				describe( `Default sale state is CLOSED`, function () {
					describe( CONTRACT.METHODS.getPauseState.SIGNATURE, function () {
						if ( TEST.METHODS.getPauseState ) {
							it( `Should be ${ CONTRACT_STATE.CLOSED }`, async function () {
								expect(
									await contract.getPauseState()
								).to.equal( CONTRACT_STATE.CLOSED )
							})
						}
					})
				})
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	CONTRACT_STATE,
	shouldBehaveLikeIPausable,
	shouldEmitContractStateChangedEvent,
	shouldRevertWhenContractStateIsIncorrect,
	shouldRevertWhenContractStateIsInvalid,
}
