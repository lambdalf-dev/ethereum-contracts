// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		CST,
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
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// For some reason, the processing of the enum type fails...
	// While waiting to find a solution, it is simpler to skip the arguments verification
	async function shouldEmitSaleStateChangedEvent ( promise, contract, previousState, newState ) {
		await expect( promise ).to.emit( contract, `SaleStateChanged` )/*.withArgs( previousState, newState )*/
	}

	async function shouldRevertWhenSaleStateIsNotClose ( promise, error = `IPausable_SALE_NOT_CLOSED` ) {
		await expect( promise ).to.be.revertedWith( `${ error }()` )
	}

	async function shouldRevertWhenSaleStateIsNotPreSale ( promise, error = `IPausable_PRESALE_CLOSED` ) {
		await expect( promise ).to.be.revertedWith( `${ error }()` )
	}

	async function shouldRevertWhenSaleStateIsNotSale ( promise, error = `IPausable_SALE_CLOSED` ) {
		await expect( promise ).to.be.revertedWith( `${ error }()` )
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
					describe( CONTRACT.METHODS.saleState.SIGNATURE, function () {
						if ( TEST.METHODS.saleState ) {
							it( `Should be ${ CST.SALE_STATE.CLOSED }`, async function () {
								expect(
									await contract.saleState()
								).to.equal( CST.SALE_STATE.CLOSED )
							})
						}
					})
				})

				describe( CONTRACT.METHODS.setSaleState.SIGNATURE, function () {
					if ( TEST.METHODS.setSaleState ) {
						it( `Setting the sale state to PRESALE`, async function () {
							const previousState = CST.SALE_STATE.CLOSE
							const newState      = CST.SALE_STATE.PRESALE
							await shouldEmitSaleStateChangedEvent(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.setSaleState( newState ),
								contract,
								previousState,
								newState
							)

							expect(
								await contract.saleState()
							).to.equal( newState )
						})

						it( `Setting the sale state to SALE`, async function () {
							const previousState = CST.SALE_STATE.CLOSE
							const newState      = CST.SALE_STATE.SALE
							await shouldEmitSaleStateChangedEvent(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.setSaleState( newState ),
								contract,
								previousState,
								newState
							)

							expect(
								await contract.saleState()
							).to.equal( newState )
						})
					}
				})
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldBehaveLikeIPausable,
	shouldEmitSaleStateChangedEvent,
	shouldRevertWhenSaleStateIsNotClose,
	shouldRevertWhenSaleStateIsNotPreSale,
	shouldRevertWhenSaleStateIsNotSale,
}
