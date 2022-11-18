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
	// For some reason, the processing of the enum type fails...
	// While waiting to find a solution, it is simpler to skip the arguments verification
	async function shouldEmitContractStateChangedEvent ( promise, contract, previousState, newState ) {
		await expect( promise ).to.emit( contract, `ContractStateChanged` )
													 .withArgs( previousState, newState )
	}

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

	function shouldBehaveLikeContractState ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ContractState`, function () {
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

				describe( `Default sale state is PAUSED`, function () {
					describe( CONTRACT.METHODS.getContractState.SIGNATURE, function () {
						it( `Should be ${ CONTRACT_STATE.PAUSED }`, async function () {
							expect(
								await contract.getContractState()
							).to.equal( CONTRACT_STATE.PAUSED )
						})
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
	shouldEmitContractStateChangedEvent,
	shouldRevertWhenContractStateIsIncorrect,
	shouldRevertWhenContractStateIsInvalid,
	shouldBehaveLikeContractState,
}
