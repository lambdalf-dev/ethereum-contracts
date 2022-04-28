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

	const {
		shouldRevertWhenRequestedTokenDoesNotExist,
	} = require( `./behavior.ERC721Batch` )
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
	function shouldBehaveLikeERC721BatchMetadata ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchMetadata`, function () {
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

				describe( CONTRACT.METHODS.name.SIGNATURE, function () {
					if ( TEST.METHODS.name ) {
						it( `Name should be "${ TEST.PARAMS.name_ }"`, async function () {
							expect(
								await contract.name()
							).to.equal( TEST.PARAMS.name_ )
						})
					}
				})

				describe( CONTRACT.METHODS.symbol.SIGNATURE, function () {
					if ( TEST.METHODS.symbol ) {
						it( `Symbol should be "${ TEST.PARAMS.symbol_ }"`, async function () {
							expect(
								await contract.symbol()
							).to.equal( TEST.PARAMS.symbol_ )
						})
					}
				})

				describe( CONTRACT.METHODS.tokenURI.SIGNATURE, function () {
					if ( TEST.METHODS.tokenURI ) {
						it( `Should be reverted when requesting an unminted token`, async function () {
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.tokenURI( tokenId ),
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
	shouldBehaveLikeERC721BatchMetadata,
}
