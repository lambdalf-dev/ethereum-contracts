// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

	const {
		shouldRevertWhenRequestedTokenDoesNotExist,
	} = require( `./behavior.ERC721Batch` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeERC721BatchMetadata ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchMetadata`, function () {
			beforeEach( async function () {
				const {
					test_contract,
				} = await loadFixture( fixture )

				contract = test_contract
			})

			describe( CONTRACT.METHODS.name.SIGNATURE, function () {
				it( `Name should be "${ TEST.TOKEN_NAME }"`, async function () {
					expect(
						await contract.name()
					).to.equal( TEST.TOKEN_NAME )
				})
			})
			describe( CONTRACT.METHODS.symbol.SIGNATURE, function () {
				it( `Symbol should be "${ TEST.TOKEN_SYMBOL }"`, async function () {
					expect(
						await contract.symbol()
					).to.equal( TEST.TOKEN_SYMBOL )
				})
			})
			describe( CONTRACT.METHODS.tokenURI.SIGNATURE, function () {
				it( `Should be reverted when requesting an unminted token`, async function () {
					const tokenId = TEST.UNMINTED_TOKEN
					await shouldRevertWhenRequestedTokenDoesNotExist(
						contract.tokenURI( tokenId ),
						contract,
						tokenId
					)
				})
				it( `First token URI should be "${ TEST.FIRST_TOKEN }"`, async function () {
					const tokenId = TEST.FIRST_TOKEN
					expect(
						await contract.tokenURI( tokenId )
					).to.equal( `${ TEST.INIT_BASE_URI }${ tokenId }` )
				})
				it( `Second token URI should be "${ TEST.SECOND_TOKEN }"`, async function () {
					const tokenId = TEST.SECOND_TOKEN
					expect(
						await contract.tokenURI( tokenId )
					).to.equal( `${ TEST.INIT_BASE_URI }${ tokenId }` )
				})
			})
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldBehaveLikeERC721BatchMetadata,
}
