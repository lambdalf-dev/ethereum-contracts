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
	async function shouldRevertWhenIndexOutOfBounds ( promise, index, error = `IERC721Enumerable_INDEX_OUT_OF_BOUNDS` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ index })`
		)
	}

	async function shouldRevertWhenOwnerIndexOutOfBounds ( promise, tokenOwner, index, error = `IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }("${ tokenOwner }", ${ index })`
		)
	}

	const shouldBehaveLikeERC721BatchEnumerableBeforeMint = function( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BatchEnumerable before any token is minted`, function() {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				before( async function () {
					holder_artifact = await ethers.getContractFactory( `Mock_ERC721Receiver` )
				})

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

				describe( CONTRACT.METHODS.totalSupply.SIGNATURE, function() {
					if ( TEST.METHODS.totalSupply ) {
						it( `Total supply should be ${ TEST.INIT_SUPPLY }`, async function() {
							expect(
								await contract.totalSupply()
							).to.equal( TEST.INIT_SUPPLY )
						})
					}
				})
			}
		})
	}

	const shouldBehaveLikeERC721BatchEnumerableAfterMint = function( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721BaseEnumerable after minting ${ TEST.MINTED_SUPPLY } tokens`, function() {
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

				describe( CONTRACT.METHODS.tokenByIndex.SIGNATURE, function() {
					if ( TEST.METHODS.tokenByIndex ) {
						it( `Should be reverted when trying to get unminted token index`, async function() {
							const index = TEST.OUT_OF_BOUNDS_INDEX
							await shouldRevertWhenIndexOutOfBounds(
								contract.tokenByIndex( index ),
								index
							)
						})

						it( `Token at index ${ TEST.TARGET_INDEX } should be token ${ TEST.TARGET_INDEX }`, async function() {
							const index = TEST.TARGET_INDEX
							expect(
								await contract.tokenByIndex( index )
							).to.equal( TEST.TARGET_INDEX )
						})
					}
				})

				describe( CONTRACT.METHODS.tokenOfOwnerByIndex.SIGNATURE, function() {
					if ( TEST.METHODS.tokenOfOwnerByIndex ) {
						it( `Should be reverted when trying to get token index of non token owner`, async function() {
							const tokenOwner = users[ USER1 ].address
							const index = TEST.TARGET_INDEX
							await shouldRevertWhenOwnerIndexOutOfBounds(
								contract.tokenOfOwnerByIndex( tokenOwner, index ),
								tokenOwner,
								index
							)
						})

						it( `Should be reverted when trying to get unminted token index`, async function() {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const index = TEST.OUT_OF_BOUNDS_INDEX
							await shouldRevertWhenOwnerIndexOutOfBounds(
								contract.tokenOfOwnerByIndex( tokenOwner, index ),
								tokenOwner,
								index
							)
						})

						it( `Should be reverted when trying to get token of the NULL address`, async function() {
							const tokenOwner = CST.ADDRESS_ZERO
							const index = TEST.TARGET_INDEX
							await shouldRevertWhenOwnerIndexOutOfBounds(
								contract.tokenOfOwnerByIndex( tokenOwner, index ),
								tokenOwner,
								index
							)
						})

						it( `Token of ${ USER_NAMES[ TOKEN_OWNER ] } at index ${ TEST.INDEX_ZERO } should be token ${ TEST.TOKEN_OWNER_FIRST }`, async function() {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const index      = TEST.INDEX_ZERO
							expect(
								await contract.tokenOfOwnerByIndex( tokenOwner, index )
							).to.equal( TEST.TOKEN_OWNER_FIRST )
						})

						it( `Token of ${ USER_NAMES[ TOKEN_OWNER ] } at index ${ TEST.TARGET_INDEX } should be token ${ ( TEST.TOKEN_OWNER_FIRST + TEST.TARGET_INDEX ).toString() }`, async function() {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const index = TEST.TARGET_INDEX
							expect(
								await contract.tokenOfOwnerByIndex( tokenOwner, index )
							).to.equal( TEST.TOKEN_OWNER_FIRST + TEST.TARGET_INDEX )
						})

						it( `Token of ${ USER_NAMES[ TOKEN_OWNER ] } at index ${ TEST.INDEX_SECOND } should be token ${ ( TEST.TOKEN_OWNER_INDEX_SECOND ).toString() }`, async function() {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const index = TEST.INDEX_SECOND
							expect(
								await contract.tokenOfOwnerByIndex( tokenOwner, index )
							).to.equal( TEST.TOKEN_OWNER_INDEX_SECOND )
						})

						it( `Token of ${ USER_NAMES[ OTHER_OWNER ] } at index ${ TEST.INDEX_ZERO } should be token ${ ( TEST.OTHER_OWNER_FIRST + TEST.INDEX_ZERO ).toString() }`, async function() {
							const tokenOwner = users[ OTHER_OWNER ].address
							const index = TEST.INDEX_ZERO
							expect(
								await contract.tokenOfOwnerByIndex( tokenOwner, index )
							).to.equal( TEST.OTHER_OWNER_FIRST + TEST.INDEX_ZERO )
						})
					}
				})

				describe( CONTRACT.METHODS.totalSupply.SIGNATURE, function() {
					if ( TEST.METHODS.totalSupply ) {
						it( `Total supply should be ${ TEST.MINTED_SUPPLY }`, async function() {
							expect(
								await contract.totalSupply()
							).to.equal( TEST.MINTED_SUPPLY )
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
	shouldRevertWhenIndexOutOfBounds,
	shouldRevertWhenOwnerIndexOutOfBounds,
	shouldBehaveLikeERC721BatchEnumerableBeforeMint,
	shouldBehaveLikeERC721BatchEnumerableAfterMint,
}
