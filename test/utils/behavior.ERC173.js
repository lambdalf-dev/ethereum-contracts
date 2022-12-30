// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )
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
	// Events
	async function shouldEmitOwnershipTransferredEvent ( promise, contract, previousOwner, newOwner ) {
		await expect( promise ).to.emit( contract, `OwnershipTransferred` )
															.withArgs( previousOwner, newOwner )
	}
	// Errors
	async function shouldRevertWhenCallerIsNotContractOwner ( promise, contract, operator, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC173_NOT_OWNER` )
				.withArgs( operator )
		}
		else if ( error == 'custom' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, 'OnlyOwner' )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	// Behavior
	function shouldBehaveLikeERC173 ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC173`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_contract,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			describe( CONTRACT.METHODS.owner.SIGNATURE, function () {
				it( `Contract owner should be contract deployer`, async function () {
					expect(
						await contract.owner()
					).to.equal( users[ CONTRACT_DEPLOYER ].address )
				})
			})
			describe( CONTRACT.METHODS.transferOwnership.SIGNATURE, function () {
				it( `Should be reverted when called by regular user`, async function () {
					const newOwner = users[ USER1 ].address
					await shouldRevertWhenCallerIsNotContractOwner(
						contract
							.connect( users[ USER1 ] )
							.transferOwnership( newOwner ),
						contract,
						newOwner
					)
				})

				describe( `Contract owner transfering ownership`, function () {
					it( `Contract owner should now be User1`, async function () {
						const previousOwner = users[ CONTRACT_DEPLOYER ].address
						const newOwner = users[ USER1 ].address
						await shouldEmitOwnershipTransferredEvent(
							contract
								.connect( users[ CONTRACT_DEPLOYER ] )
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
						const newOwner = ethers.constants.AddressZero
						await shouldEmitOwnershipTransferredEvent(
							contract
								.connect( users[ CONTRACT_DEPLOYER ] )
								.transferOwnership( newOwner ),
							contract,
							previousOwner,
							newOwner
						)

						expect(
							await contract.owner()
						).to.equal( ethers.constants.AddressZero )
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
	shouldEmitOwnershipTransferredEvent,
	shouldRevertWhenCallerIsNotContractOwner,
	shouldBehaveLikeERC173,
}
