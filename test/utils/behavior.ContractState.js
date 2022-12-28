// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// SALE STATE
	const CONTRACT_STATE = {
		PAUSED : 0,
	}
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// Events
	async function shouldEmitContractStateChangedEvent ( promise, contract, previousState, newState ) {
		await expect( promise )
			.to.emit( contract, `ContractStateChanged` )
			.withArgs( previousState, newState )
	}
	// Errors
	async function shouldRevertWhenContractStateIsIncorrect ( promise, contract, currentState, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `ContractState_INCORRECT_STATE` )
				.withArgs( currentState )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenContractStateIsInvalid ( promise, contract, currentState, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `ContractState_INVALID_STATE` )
				.withArgs( currentState )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	// Behavior
	function shouldBehaveLikeContractState ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ContractState`, function () {
			beforeEach( async function () {
				const {
					test_contract,
				} = await loadFixture( fixture )

				contract = test_contract
			})

			describe( `Default sale state is PAUSED`, function () {
				describe( CONTRACT.METHODS.getContractState.SIGNATURE, function () {
					it( `Should be ${ CONTRACT_STATE.PAUSED }`, async function () {
						expect(
							await contract.getContractState()
						).to.equal( CONTRACT_STATE.PAUSED )
					})
				})
			})
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	CONTRACT_STATE,
	shouldEmitContractStateChangedEvent,
	shouldRevertWhenContractStateIsIncorrect,
	shouldRevertWhenContractStateIsInvalid,
	shouldBehaveLikeContractState,
}
