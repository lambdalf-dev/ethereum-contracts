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

	const { ethers, waffle } = require( `hardhat` )
	const { loadFixture, deployContract } = waffle

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
		shouldEmitConsecutiveTransferEvent,
	} = require( `../ERC721/behavior.ERC2309` )

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
	async function shouldRevertWhenArrayLengthsDontMatch ( promise, len1, len2, error = `NFT_ARRAY_LENGTH_MISMATCH` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ len1 }, ${ len2 })`
		)
	}

	async function shouldRevertWhenIncorrectAmountPaid ( promise, amountReceived, amountExpected, error = `NFT_INCORRECT_PRICE` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ amountReceived }, ${ amountExpected })`
		)
	}

	async function shouldRevertWhenQtyIsZero ( promise, error = `NFT_INVALID_QTY` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }()`
		)
	}

	async function shouldRevertWhenShareIsZero ( promise, error = `NFT_INVALID_SHARE` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }()`
		)
	}

	async function shouldRevertWhenInputAddressIsContract ( promise, account, error = `NFT_INVALID_TEAM_MEMBER` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ account })`
		)
	}

	async function shouldRevertWhenQtyOverMaxBatch ( promise, qtyRequested, maxBatch, error = `NFT_MAX_BATCH` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ qtyRequested }, ${ maxBatch })`
		)
	}

	async function shouldRevertWhenMintedOut ( promise, qtyRequested, remainingSupply, error = `NFT_MAX_SUPPLY` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ qtyRequested }, ${ remainingSupply })`
		)
	}

	async function shouldRevertWhenReserveDepleted ( promise, qtyRequested, reserveLeft, error = `NFT_MAX_RESERVE` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ qtyRequested }, ${ reserveLeft })`
		)
	}

	async function shouldRevertWhenSumOfSharesIncorrect ( promise, missingShares, error = `NFT_ETHER_TRANSFER_FAIL` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ missingShares })`
		)
	}

	async function shouldRevertWhenContractHasNoBalance ( promise, error = `NFT_NO_ETHER_BALANCE` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }()`
		)
	}

	async function shouldRevertWhenEtherTransferFails ( promise, to, amount, error = `NFT_MISSING_SHARES` ) {
		await expect( promise ).to.be.revertedWith(
			`${ error }(${ to }, ${ amount })`
		)
	}

	async function shouldEmitPaymentReleasedEvent ( promise, contract, to, amount ) {
		await expect( promise )
			.to.emit( contract, `PaymentReleased` )
			.withArgs( to, amount )
	}

	function shouldBehaveLikeNFTAtDeploy ( fixture, TEST, CONTRACT  ) {
		shouldBehaveLikeERC721BatchBeforeMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableBeforeMint( fixture, TEST, CONTRACT )

		describe( `Should behave like NFT at deploy`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
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
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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
									users[ USER1 ].address
								)
							})
						}
					})

					describe( CONTRACT.METHODS.withdraw.SIGNATURE, function () {
						if ( TEST.METHODS.withdraw ) {
							it( `Transaction initiated by a regular user should be reverted`, async function () {
								await shouldRevertWhenCallerIsNotContractOwner(
									contract.connect( users[ USER1 ] )
													.withdraw(),
									users[ USER1 ].address
								)
							})

							it( `Withdraw with no funds in the contract should be reverted`, async function () {
								await shouldRevertWhenContractHasNoBalance (
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.withdraw()
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
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldRevertWhenContractStateIsIncorrect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									CONTRACT_STATE.CLOSED
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

	function shouldBehaveLikeNFTAfterSettingProxy ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFT after setting proxy`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
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
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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

	function shouldBehaveLikeNFTAfterSettingStateToOpen ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFT after setting state to OPEN`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
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
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldRevertWhenQtyIsZero(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params )
								)
							})

							it( `Should revert when trying to mint more than ${ TEST.PARAMS.maxBatch_ } tokens`, async function() {
								const qty       = TEST.PARAMS.maxBatch_ + 1
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldRevertWhenQtyOverMaxBatch(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									qty,
									TEST.PARAMS.maxBatch_
								)
							})

							it( `Should revert when trying to mint without paying enough`, async function() {
								const qty       = 1
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : 0
								}
								await shouldRevertWhenIncorrectAmountPaid(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									0,
									value
								)
							})

							it( `Should revert when trying to mint while paying too much`, async function() {
								const qty       = 1
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value + 1
								}
								await shouldRevertWhenIncorrectAmountPaid(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									value + 1,
									value
								)
							})

							it( `${ USER_NAMES[ TOKEN_OWNER ] } mints 1 token`, async function() {
								const qty       = 1
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params )
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
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params )
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
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await expect(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params )
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

	function shouldBehaveLikeNFTAfterMint ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC2981Base( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchAfterMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchMetadata( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableAfterMint( fixture, TEST, CONTRACT )

		describe( `Should behave like NFT after minting some tokens`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
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
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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

					describe( CONTRACT.METHODS.withdraw.SIGNATURE, function () {
						if ( TEST.METHODS.withdraw ) {
							it( `Withdrawal should be fulfilled`, async function () {
								const recipient = users[ `TEAM1` ].address
								const amount    = TEST.PARAMS.salePrice_.mul( TEST.MINTED_SUPPLY ).mul( TEST.PARAMS.teamShares_[ 0 ] ).div( TEST.SHARE_BASE )
								await shouldEmitPaymentReleasedEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.withdraw(),
									contract,
									recipient,
									amount
								)
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTAfterMintingOut ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like NFT after minting out`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
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
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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
													.mintPublic( qty, tx_params ),
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
	shouldRevertWhenIncorrectAmountPaid,
	shouldRevertWhenInputAddressIsContract,
	shouldRevertWhenQtyIsZero,
	shouldRevertWhenMintedOut,
	shouldRevertWhenReserveDepleted,
	shouldRevertWhenSumOfSharesIncorrect,
	shouldRevertWhenContractHasNoBalance,
	shouldRevertWhenEtherTransferFails,
	shouldEmitPaymentReleasedEvent,
	shouldBehaveLikeNFTAtDeploy,
	shouldBehaveLikeNFTAfterSettingProxy,
	shouldBehaveLikeNFTAfterSettingStateToOpen,
	shouldBehaveLikeNFTAfterMint,
	shouldBehaveLikeNFTAfterMintingOut,
}
