// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		TOKEN_OWNER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		shouldEmitTransferEvent,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenCallerIsNotApproved,
		shouldBehaveLikeERC721BatchBeforeMint,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require( `../ERC721/behavior.ERC721Batch` )
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
	// Behavior
	function shouldBehaveLikeERC721BatchBurnableBeforeBurn ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchBurnable before any token is burned`, function() {
			beforeEach( async function () {
				const {
					test_user1,
					test_contract,
					test_token_owner,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ TOKEN_OWNER ] = test_token_owner
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.burn.SIGNATURE, function() {
					it( `Should be reverted when trying to burn a token not minted`, async function() {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.connect( users[ TOKEN_OWNER ] )
											.burn( tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when trying to burn a token not owned`, async function() {
						const tokenId = TEST.TARGET_TOKEN
						const tokenOwner = users[ TOKEN_OWNER ].address
						const operator = users[ USER1 ].address
						await shouldRevertWhenCallerIsNotApproved(
							contract.connect( users[ USER1 ] )
											.burn( tokenId ),
							contract,
							tokenOwner,
							operator,
							tokenId
						)
					})
					it( `Contract should emit a Transfer event mentioning token ${ TEST.TARGET_TOKEN } was transfered from token owner to the NULL address`, async function() {
						const tokenId = TEST.TARGET_TOKEN
						const from = users[ TOKEN_OWNER ].address
						const to = ethers.constants.AddressZero
						await shouldEmitTransferEvent(
							contract.connect( users[ TOKEN_OWNER ] )
											.burn( tokenId ),
							contract,
							from,
							to,
							tokenId
						)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeERC721BatchBurnableAfterBurn ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchBurnable after burning a token`, function() {
			beforeEach( async function () {
				const {
					test_user1,
					test_contract,
					test_token_owner,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ TOKEN_OWNER ] = test_token_owner
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.ownerOf.SIGNATURE, function () {
					it( `Owner of burnt token should be reverted`, async function() {
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.ownerOf( tokenId ),
							contract,
							tokenId
						)
					})
				})
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Balance of token owner should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function() {
						const tokenOwner = users[ TOKEN_OWNER ].address
						expect(
							await contract.balanceOf( tokenOwner )
						).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
					})
				})
				describe( CONTRACT.METHODS.getApproved.SIGNATURE, function () {
					it( `Should be reverted when querying approval for burnt token`, async function() {
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.getApproved( tokenId ),
							contract,
							tokenId
						)
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.transferFrom.SIGNATURE, function () {
					it( `Trying to transfer burnt token should be reverted`, async function() {
						const from = users[ TOKEN_OWNER ].address
						const to = users[ TOKEN_OWNER ].address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.connect( users[ TOKEN_OWNER ] )
											.transferFrom( from, to, tokenId ),
							contract,
							tokenId
						)
					})
				})
			// **************************************
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldBehaveLikeERC721BatchBurnableBeforeBurn,
	shouldBehaveLikeERC721BatchBurnableAfterBurn,
}
