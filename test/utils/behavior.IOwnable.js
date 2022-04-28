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
	async function shouldEmitOwnershipTransferredEvent ( promise, contract, previousOwner, newOwner ) {
		await expect( promise ).to.emit( contract, `OwnershipTransferred` )
															.withArgs( previousOwner, newOwner )
	}

	async function shouldRevertWhenCallerIsNotContractOwner ( promise, operator, error = `IOwnable_NOT_OWNER` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }("${ operator }")`
		)
	}

	function shouldBehaveLikeIOwnable ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like IOwnable`, function () {
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

				describe( CONTRACT.METHODS.owner.SIGNATURE, function () {
					if ( TEST.METHODS.owner ) {
						it( `Contract owner should be ${ USER_NAMES[ CONTRACT_DEPLOYER ] }`, async function () {
							expect(
								await contract.owner()
							).to.equal( users[ CONTRACT_DEPLOYER ].address )
						})
					}
				})

				describe( CONTRACT.METHODS.transferOwnership.SIGNATURE, function () {
					if ( TEST.METHODS.transferOwnership ) {
						it( `Should be reverted when called by regular user`, async function () {
							const newOwner = users[ USER1 ].address
							await shouldRevertWhenCallerIsNotContractOwner(
								contract.connect( users[ USER1 ] )
												.transferOwnership( newOwner ),
								newOwner
							)
						})

						describe( `Contract owner transfering ownership`, function () {
							it( `Contract owner should now be User1`, async function () {
								const previousOwner = users[ CONTRACT_DEPLOYER ].address
								const newOwner      = users[ USER1 ].address
								await shouldEmitOwnershipTransferredEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.transferOwnership( newOwner ),
									contract,
									previousOwner,
									newOwner
								)

								expect(
									await contract.owner()
								).to.equal( newOwner )
							})

							it( `Contract owner should now be the NULL address`, async function () {
								const previousOwner = users[ CONTRACT_DEPLOYER ].address
								const newOwner      = CST.ADDRESS_ZERO
								await shouldEmitOwnershipTransferredEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.transferOwnership( newOwner ),
									contract,
									previousOwner,
									newOwner
								)

								expect(
									await contract.owner()
								).to.equal( CST.ADDRESS_ZERO )
							})
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
	shouldBehaveLikeIOwnable,
	shouldEmitOwnershipTransferredEvent,
	shouldRevertWhenCallerIsNotContractOwner,
}
