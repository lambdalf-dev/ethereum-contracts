// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		ROYALTY_RECIPIENT,
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
	// Errors
	async function shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase ( promise, contract, royaltyRate, royaltyBase, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC2981_INVALID_ROYALTIES` )
				.withArgs( royaltyRate, royaltyBase )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	// Behavior
	function shouldBehaveLikeERC2981 ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC2981`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
			})

			describe( CONTRACT.METHODS.royaltyInfo.SIGNATURE, function () {
				it( `Royalty info for sale price 1 ETH should be accurate`, async function () {
					const tokenId = TEST.TARGET_TOKEN
					const salePrice = ethers.constants.WeiPerEther
					const expectedRecipient = users[ ROYALTY_RECIPIENT ].address
					const expectedRate = salePrice.mul( TEST.DEFAULT_ROYALTY_RATE ).div( TEST.ROYALTY_BASE )

					const royaltyInfo = await contract.royaltyInfo( tokenId, salePrice )
					expect( royaltyInfo ).to.exist
					expect( royaltyInfo[ 0 ] ).to.equal( expectedRecipient )
					expect( royaltyInfo[ 1 ] ).to.equal( expectedRate )
				})

				it( `Royalty info for sale price 0 should be accurate`, async function () {
					const tokenId = TEST.TARGET_TOKEN
					const salePrice = 0
					const expectedRecipient = users[ ROYALTY_RECIPIENT ].address
					const expectedRate = 0

					const royaltyInfo = await contract.royaltyInfo( tokenId, salePrice )
					expect( royaltyInfo ).to.exist
					expect( royaltyInfo[ 0 ] ).to.equal( expectedRecipient )
					expect( royaltyInfo[ 1 ] ).to.equal( expectedRate )
				})
			})
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase,
	shouldBehaveLikeERC2981,
}
