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

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../utils/behavior.ERC165` )

	const {
		HOLDER_ARTIFACT,
		NON_HOLDER_ARTIFACT,
		ERC721ReceiverError,
		shouldEmitApprovalEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferEvent,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenTransferingToNonERC721Receiver,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenTransferingToNullAddress,
		shouldBehaveLikeERC721BatchBeforeMint,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require( `../ERC721/behavior.ERC721Batch` )

	const {
		shouldBehaveLikeERC721BatchMetadata,
	} = require( `../ERC721/behavior.ERC721BatchMetadata` )

	const {
		shouldBehaveLikeERC721BatchEnumerableBeforeMint,
		shouldBehaveLikeERC721BatchEnumerableAfterMint,
	} = require( `../ERC721/behavior.ERC721BatchEnumerable` )

	const {
		shouldBehaveLikeERC2981Base,
	} = require( '../utils/behavior.ERC2981Base' )

	const {
		shouldBehaveLikeIOwnable,
		shouldRevertWhenCallerIsNotContractOwner,
	} = require( `../utils/behavior.IOwnable` )

	const {
		CONTRACT_STATE,
		shouldBehaveLikeIPausable,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.IPausable` )
	CONTRACT_STATE.OPEN = 1

	const {
		shouldRevertWhenArrayLengthsDontMatch,
		shouldRevertWhenInputAddressIsContract,
		shouldRevertWhenQtyIsZero,
		shouldRevertWhenQtyOverMaxBatch,
		shouldRevertWhenMintedOut,
		shouldRevertWhenReserveDepleted,
	} = require( `../NFT/behavior.NFT` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let non_holder_artifact
	let holder_artifact
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeNFTFreeAtDeploy ( fixture, TEST, CONTRACT  ) {
		shouldBehaveLikeERC721BatchBeforeMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableBeforeMint( fixture, TEST, CONTRACT )

		describe( `Should behave like NFTFree at deploy`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				// **************************************
				// *****       CONTRACT_OWNER       *****
				// **************************************
					describe( CONTRACT.METHODS.addProxyRegistry.SIGNATURE, function () {
						if ( TEST.METHODS.addProxyRegistry ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const proxyRegistryAddress = proxy_contract.address
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.addProxyRegistry( proxyRegistryAddress ),
									contract,
									users[ USER1 ].address
								)
							})
						}
					})

					describe( CONTRACT.METHODS.airdrop.SIGNATURE, function () {
						if ( TEST.METHODS.airdrop ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const accounts = [
									users[ USER1 ].address,
									users[ USER2 ].address,
								]
								const amounts = [
									TEST.AIRDROP1,
									TEST.AIRDROP2,
								]
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.airdrop( accounts, amounts ),
									contract,
									users[ USER1 ].address
								)
							})

							it( `Inputing arrays of different lengths should be reverted`, async function () {
								const accounts = [
									users[ USER1 ].address,
									users[ USER2 ].address,
								]
								const amounts = [
									TEST.AIRDROP1,
								]
								await shouldRevertWhenArrayLengthsDontMatch(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.airdrop( accounts, amounts ),
									contract,
									accounts.length,
									amounts.length
								)
							})

							describe( `${ USER_NAMES[ CONTRACT_DEPLOYER ] } airdrops a few tokens`, async function () {
								beforeEach( async function () {
									const accounts = [
										users[ USER1 ].address,
										users[ USER2 ].address,
									]
									const amounts = [
										TEST.AIRDROP1,
										TEST.AIRDROP2,
									]
									const fromToken = TEST.INIT_SUPPLY + TEST.FIRST_TOKEN + TEST.AIRDROP1
									const toToken   = TEST.INIT_SUPPLY + TEST.AIRDROP1 + TEST.AIRDROP2
									const fromAddr  = ethers.constants.AddressZero
									const toAddr    = users[ USER2 ].address
									await expect(
										contract.connect( users[ CONTRACT_DEPLOYER ] )
														.airdrop( accounts, amounts )
									).to.be.fulfilled
								})

								it( `Balance of ${ USER_NAMES[ USER1 ] } should be ${ TEST.AIRDROP1 }`, async function () {
									const tokenOwner = users[ USER1 ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( TEST.AIRDROP1 )
								})

								it( `Balance of ${ USER_NAMES[ USER2 ] } should be ${ TEST.AIRDROP2 }`, async function () {
									const tokenOwner = users[ USER2 ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( TEST.AIRDROP2 )
								})
							})
						}
					})

					describe( CONTRACT.METHODS.setBaseURI.SIGNATURE, function () {
						if ( TEST.METHODS.setBaseURI ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const baseURI = TEST.NEW_BASE_URI
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.setBaseURI( baseURI ),
									contract,
									users[ USER1 ].address
								)
							})
						}
					})

					describe( CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE, function () {
						if ( TEST.METHODS.setRoyaltyInfo ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const royaltyRecipient = users[ USER1 ].address
								const royaltyRate      = TEST.PARAMS.royaltyRate_ * 2
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.setRoyaltyInfo( royaltyRecipient, royaltyRate ),
									contract,
									users[ USER1 ].address
								)
							})
						}
					})

					describe( CONTRACT.METHODS.setPauseState.SIGNATURE, function () {
						if ( TEST.METHODS.setPauseState ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const newState = CONTRACT_STATE.OPEN
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.setPauseState( newState ),
									contract,
									users[ USER1 ].address
								)
							})
						}
					})
				// **************************************

				// **************************************
				// *****           PUBLIC           *****
				// **************************************
					describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
						if ( TEST.METHODS.mintPublic ) {
							it( `Transaction initiated with sale state CLOSED should be reverted`, async function() {
								const qty       = TEST.TOKEN_OWNER_SUPPLY
								await shouldRevertWhenContractStateIsIncorrect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty ),
									contract,
									CONTRACT_STATE.PAUSED
								)
							})
						}
					})
				// **************************************

				// **************************************
				// *****            VIEW            *****
				// **************************************
					describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
						if ( TEST.METHODS.balanceOf ) {
							it( `Users should own 0 tokens`, async function () {
								const tokenOwner = users[ USER1 ].address
								expect(
									await contract.balanceOf( tokenOwner )
								).to.equal( 0 )
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTFreeAfterSettingProxy ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFTFree after setting proxy`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				// **************************************
				// *****            VIEW            *****
				// **************************************
					describe( CONTRACT.METHODS.isApprovedForAll.SIGNATURE, function () {
						if ( TEST.METHODS.isApprovedForAll ) {
							it( `Despite not being expressely authorized, ${ USER_NAMES[ PROXY_USER ] } can manage tokens on behalf of ${ USER_NAMES[ TOKEN_OWNER ] }`, async function () {
								const tokenOwner = users[ TOKEN_OWNER ].address
								const operator   = users[ PROXY_USER ].address
								expect(
									await contract.isApprovedForAll( tokenOwner, operator )
								).to.be.true
							})
						}
					})
				// **************************************

				// **************************************
				// *****       CONTRACT_OWNER       *****
				// **************************************
					describe( CONTRACT.METHODS.removeProxyRegistry.SIGNATURE, function () {
						if ( TEST.METHODS.removeProxyRegistry ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								const proxyRegistryAddress = proxy_contract.address
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.removeProxyRegistry( proxyRegistryAddress ),
									contract,
									users[ USER1 ].address
								)
							})

							it( `Removing a proxy registry`, async function () {
								const proxyRegistryAddress = proxy_contract.address
								await expect(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.removeProxyRegistry( proxyRegistryAddress )
								).to.be.fulfilled

								const tokenOwner = users[ TOKEN_OWNER ].address
								const operator   = users[ PROXY_USER ].address
								expect(
									await contract.isApprovedForAll( tokenOwner, operator )
								).to.be.false
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTFreeAfterSettingStateToOpen ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFTFree after setting state to OPEN`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				// **************************************
				// *****           PUBLIC           *****
				// **************************************
					describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
						if ( TEST.METHODS.mintPublic ) {
							it( `Should revert when trying to mint 0 token`, async function() {
								const qty       = 0
								await shouldRevertWhenQtyIsZero(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty ),
									contract
								)
							})

							it( `Should revert when trying to mint more than ${ TEST.PARAMS.maxBatch_ } tokens`, async function() {
								const qty       = TEST.PARAMS.maxBatch_ + 1
								await shouldRevertWhenQtyOverMaxBatch(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty ),
									contract,
									qty,
									TEST.PARAMS.maxBatch_
								)
							})

							it( `${ USER_NAMES[ TOKEN_OWNER ] } mints 1 token`, async function() {
								const qty       = 1
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty )
								).to.be.fulfilled

								expect(
									await contract.ownerOf( fromToken )
								).to.equal( toAddr )

								expect(
									await contract.ownerOf( toToken )
								).to.equal( toAddr )

								expect(
									await contract.balanceOf( toAddr )
								).to.equal( qty )
							})

							it( `${ USER_NAMES[ TOKEN_OWNER ] } mints 2 token`, async function() {
								const qty       = 2
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty )
								).to.be.fulfilled

								expect(
									await contract.ownerOf( fromToken )
								).to.equal( toAddr )

								expect(
									await contract.ownerOf( toToken )
								).to.equal( toAddr )

								expect(
									await contract.balanceOf( toAddr )
								).to.equal( qty )
							})

							it( `${ USER_NAMES[ TOKEN_OWNER ] } mints ${ TEST.PARAMS.maxBatch_ } token`, async function() {
								const qty       = TEST.PARAMS.maxBatch_
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty )
								).to.be.fulfilled

								expect(
									await contract.ownerOf( fromToken )
								).to.equal( toAddr )

								expect(
									await contract.ownerOf( toToken )
								).to.equal( toAddr )

								expect(
									await contract.balanceOf( toAddr )
								).to.equal( qty )
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTFreeAfterMint ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC2981Base( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchAfterMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchMetadata( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableAfterMint( fixture, TEST, CONTRACT )

		describe( `Should behave like NFTFree after minting some tokens`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				// **************************************
				// *****       CONTRACT_OWNER       *****
				// **************************************
					describe( CONTRACT.METHODS.setBaseURI.SIGNATURE, function () {
						if ( TEST.METHODS.setBaseURI ) {
							it( `First token URI should now be "${ TEST.NEW_BASE_URI }${ TEST.FIRST_TOKEN }"`, async function () {
								const baseURI = TEST.NEW_BASE_URI
								await contract.connect( users[ CONTRACT_DEPLOYER ] )
															.setBaseURI( baseURI )

								const tokenId = TEST.FIRST_TOKEN
								expect(
									await contract.tokenURI( tokenId )
								).to.equal( `${ baseURI }${ tokenId }` )
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTFreeAfterMintingOut ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFTFree after minting out`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				// **************************************
				// *****           PUBLIC           *****
				// **************************************
					describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
						if ( TEST.METHODS.mint ) {
							it( `Trying to mint when minted out should be reverted`, async function () {
								const qty       = 1
								const value     = TEST.PARAMS.salePrice_
								const remaining = 0
								const tx_params = {
									value : value
								}
								await shouldRevertWhenMintedOut(
									contract.connect( users[ USER1 ] )
													.mintPublic( qty ),
									contract,
									qty,
									remaining
								)
							})
						}
					})
				// **************************************

				// **************************************
				// *****       CONTRACT_OWNER       *****
				// **************************************
					describe( CONTRACT.METHODS.airdrop.SIGNATURE, function () {
						if ( TEST.METHODS.airdrop ) {
							describe( `Airdopping the remaining reserved tokens`, function () {
								beforeEach( async function () {
									const accounts = [
										users[ USER1 ].address,
										users[ USER2 ].address,
									]
									const amounts  = [
										TEST.AIRDROP1,
										TEST.AIRDROP2,
									]
									await contract.connect( users[ CONTRACT_DEPLOYER ] )
																.airdrop( accounts, amounts )
								})

								it( `Airdrop when reserve depleted should be reverted`, async function () {
									const accounts = [ users[ TOKEN_OWNER ].address, ]
									const amounts  = [ 1, ]
									const qty      = 1
									const reserve  = 0
									await shouldRevertWhenReserveDepleted(
										contract.connect( users[ CONTRACT_DEPLOYER ] )
														.airdrop( accounts, amounts ),
										contract,
										qty,
										reserve
									)
								})
							})
						}
					})
				// **************************************
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldRevertWhenArrayLengthsDontMatch,
	shouldRevertWhenInputAddressIsContract,
	shouldRevertWhenQtyIsZero,
	shouldRevertWhenQtyOverMaxBatch,
	shouldRevertWhenMintedOut,
	shouldRevertWhenReserveDepleted,
	shouldBehaveLikeNFTFreeAtDeploy,
	shouldBehaveLikeNFTFreeAfterSettingProxy,
	shouldBehaveLikeNFTFreeAfterSettingStateToOpen,
	shouldBehaveLikeNFTFreeAfterMint,
	shouldBehaveLikeNFTFreeAfterMintingOut,
}
