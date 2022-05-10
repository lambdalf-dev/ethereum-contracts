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
	function shouldBehaveLikeERC721BatchBurnableBeforeBurn ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchBurnable before any token is burned`, function() {
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

				describe( CONTRACT.METHODS.burn.SIGNATURE, function() {
					if ( TEST.METHODS.burn ) {
						it( `Should be reverted when trying to burn a token not minted`, async function() {
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.burn( tokenId ),
								tokenId
							)
						})

						it( `Should be reverted when trying to burn a token not owned`, async function() {
							const tokenId    = TEST.TARGET_TOKEN
							const tokenOwner = users[ TOKEN_OWNER ].address
							const operator   = users[ USER1 ].address
							await shouldRevertWhenCallerIsNotApproved(
								contract.connect( users[ USER1 ] )
												.burn( tokenId ),
								tokenOwner,
								operator,
								tokenId
							)
						})

						it( `Contract should emit a ${ CONTRACT.EVENTS.Transfer } event mentioning token ${ TEST.TARGET_TOKEN } was transfered from ${ USER_NAMES[ TOKEN_OWNER ] } to the NULL address`, async function() {
							const tokenId = TEST.TARGET_TOKEN
							const from    = users[ TOKEN_OWNER ].address
							const to      = CST.ADDRESS_ZERO
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.burn( tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})
					}
				})
			}
		})
	}

	function shouldBehaveLikeERC721BatchBurnableAfterBurn ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchBurnable after burning a token`, function() {
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

				describe( CONTRACT.METHODS.ownerOf.SIGNATURE, function () {
					if ( TEST.METHODS.ownerOf ) {
						it( `Owner of burnt token should be reverted`, async function() {
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.ownerOf( tokenId ),
								tokenId
							)
						})
					}
				})

				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					if ( TEST.METHODS.balanceOf ) {
						it( `Balance of ${ USER_NAMES[ TOKEN_OWNER ] } should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function() {
							const tokenOwner = users[ TOKEN_OWNER ].address
							expect(
								await contract.balanceOf( tokenOwner )
							).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
						})
					}
				})

				describe( CONTRACT.METHODS.totalSupply.SIGNATURE, function () {
					if ( TEST.METHODS.totalSupply ) {
						it( `Total supply should now be ${ TEST.MINTED_SUPPLY - 1 }`, async function () {
							expect(
								await contract.totalSupply()
							).to.equal( TEST.MINTED_SUPPLY - 1 )
						})
					}
				})

				describe( CONTRACT.METHODS.getApproved.SIGNATURE, function () {
					if ( TEST.METHODS.getApproved ) {
						it( `Approved addresses for burnt token should be the NULL address`, async function() {
							const tokenId = TEST.TARGET_TOKEN
							expect(
								await contract.getApproved( tokenId )
							).to.equal( CST.ADDRESS_ZERO )
						})
					}
				})

				describe( CONTRACT.METHODS.transferFrom.SIGNATURE, function () {
					if ( TEST.METHODS.transferFrom ) {
						it( `Trying to transfer burnt token should be reverted`, async function() {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ TOKEN_OWNER ].address
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.transferFrom( from, to, tokenId ),
								tokenId
							)
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
	shouldBehaveLikeERC721BatchBurnableBeforeBurn,
	shouldBehaveLikeERC721BatchBurnableAfterBurn,
}
