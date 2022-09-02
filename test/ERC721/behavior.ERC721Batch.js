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
	} = require( '../utils/behavior.ERC165' )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let non_holder_artifact
	let holder_artifact
	let contract
	let users = {}

	// Custom ERC721ReceiverError type for testing the transfer to ERC721Receiver (copied from Open Zeppelin)
	const ERC721ReceiverError = [ `None`, `RevertWithERC721ReceiverError`, `RevertWithMessage`, `RevertWithoutMessage`, `Panic` ]
		.reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {})
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	async function shouldEmitApprovalEvent ( promise, contract, owner, approved, tokenId ) {
		await expect( promise )
			.to.emit( contract, `Approval` )
			.withArgs( owner, approved, tokenId )
	}

	async function shouldEmitApprovalForAllEvent ( promise, contract, owner, operator, approved ) {
		await expect( promise )
			.to.emit( contract, `ApprovalForAll` )
			.withArgs( owner, operator, approved )
	}

	async function shouldEmitTransferEvent ( promise, contract, from, to, tokenId ) {
		await expect( promise )
			.to.emit( contract, `Transfer` )
			.withArgs( from, to, tokenId )
	}

	async function shouldRevertWhenCallerIsNotApproved ( promise, contract, tokenOwner, operator, tokenId, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_CALLER_NOT_APPROVED` )
				.withArgs( tokenOwner, operator, tokenId )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}

	async function shouldRevertWhenRequestedTokenDoesNotExist ( promise, contract, tokenId, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_NONEXISTANT_TOKEN` )
				.withArgs( tokenId )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}

	async function shouldRevertWhenTransferingToNonERC721Receiver ( promise, contract, receiver, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_NON_ERC721_RECEIVER` )
				.withArgs( receiver )
		}
		else {
			if ( error == 'custom error' ) {
				const receiverContract = new ethers.Contract( receiver, '[{"inputs": [{"internalType": "bytes4","name": "retval","type": "bytes4"},{"internalType": "enum Mock_ERC721Receiver.Error","name": "error","type": "uint8"}],"stateMutability": "nonpayable","type": "constructor"},{"inputs": [],"name": "ERC721ReceiverError","type": "error"}]', contract.provider )
				await expect( promise )
					.to.be.revertedWithCustomError( receiverContract, `ERC721ReceiverError` )
			}
			else if ( error == 'panic code' ) {
				await expect( promise )
					.to.be.revertedWithPanic()
			}
			else {
				await expect( promise )
					.to.be.revertedWith( error )
			}
		}
	}

	async function shouldRevertWhenApprovingTokenOwner ( promise, contract, operator, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_INVALID_APPROVAL` )
				.withArgs( operator )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}

	async function shouldRevertWhenTransferingToNullAddress ( promise, contract, recipient, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_INVALID_TRANSFER` )
				.withArgs( recipient )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}

	function shouldBehaveLikeERC721BatchBeforeMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721Batch before any token is minted`, function () {
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

				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					if ( TEST.METHODS.balanceOf ) {
						it( `${ USER_NAMES[ USER1 ] } should have 0 token`, async function () {
							const tokenOwner = users[ USER1 ].address
							expect(
								await contract.balanceOf( tokenOwner )
							).to.equal( 0 )
						})

						it( `Balance of the NULL address should be 0`, async function () {
							const tokenOwner = ethers.constants.AddressZero
							expect(
								await contract.balanceOf( tokenOwner )
							).to.equal( 0 )
						})
					}
				})

				describe( CONTRACT.METHODS.isApprovedForAll.SIGNATURE, function () {
					if ( TEST.METHODS.isApprovedForAll ) {
						it( `${ USER_NAMES[ TOKEN_OWNER ] } does not need approval to manage their own tokens, expect false`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const operator   = users[ TOKEN_OWNER ].address
							expect(
								await contract.isApprovedForAll( tokenOwner, operator )
							).to.be.false
						})

						it( `${ USER_NAMES[ USER1 ] } requires ${ USER_NAMES[ TOKEN_OWNER ] }'s approval to manage their tokens, expect false`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ].address
							const operator   = users[ USER1       ].address
							expect(
								await contract.isApprovedForAll( tokenOwner, operator )
							).to.be.false
						})
					}
				})
			}
		})
	}

	function shouldBehaveLikeERC721BatchAfterMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721Batch after minting some tokens`, function () {
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

				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					if ( TEST.METHODS.balanceOf ) {
						it( `Balance of ${ USER_NAMES[ TOKEN_OWNER ] } should be ${ TEST.TOKEN_OWNER_SUPPLY }`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ].address
							expect(
								await contract.balanceOf( tokenOwner )
							).to.equal( TEST.TOKEN_OWNER_SUPPLY )
						})

						it( `Balance of ${ USER_NAMES[ OTHER_OWNER ] } should be ${ TEST.OTHER_OWNER_SUPPLY }`, async function () {
							const tokenOwner = users[ OTHER_OWNER ].address
							expect(
								await contract.balanceOf( tokenOwner )
							).to.equal( TEST.OTHER_OWNER_SUPPLY )
						})
					}
				})

				describe( CONTRACT.METHODS.getApproved.SIGNATURE, function () {
					if ( TEST.METHODS.getApproved ) {
						it( `Should be the null address when requested token does not exist`, async function () {
							const tokenId = TEST.UNMINTED_TOKEN
							expect(
								await contract.getApproved( tokenId )
							).to.equal( ethers.constants.AddressZero )
						})
					}
				})

				describe( CONTRACT.METHODS.ownerOf.SIGNATURE, function () {
					if ( TEST.METHODS.ownerOf ) {
						it( `Should be reverted when requested token does not exist`, async function () {
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.ownerOf( tokenId ),
								contract,
								tokenId
							)
						})

						it( `Owner of token ${ TEST.TARGET_TOKEN } should be ${ USER_NAMES[ TOKEN_OWNER ] }`, async function () {
							const tokenId = TEST.TARGET_TOKEN
							expect(
								await contract.ownerOf( tokenId )
							).to.equal( users[ TOKEN_OWNER ].address )
						})
					}
				})

				describe( CONTRACT.METHODS.approve.SIGNATURE, function () {
					if( TEST.METHODS.approve ) {
						it( `Should be reverted when requested token does not exist`, async function () {
							const to      = users[ TOKEN_OWNER ].address
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.approve( to, tokenId ),
								contract,
								tokenId
							)

							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.approve( to, 0 ),
								contract,
								0
							)
						})

						it( `Should be reverted when caller is not approved operator`, async function () {
							const to         = users[ USER1 ].address
							const tokenId    = TEST.TARGET_TOKEN
							const tokenOwner = users[ TOKEN_OWNER ].address
							await shouldRevertWhenCallerIsNotApproved(
								contract.connect( users[ USER1 ] )
												.approve( to, tokenId ),
								contract,
								tokenOwner,
								to,
								tokenId
							)
						})

						describe( `${ USER_NAMES[ TOKEN_OWNER ] } approve management of token ${ TEST.TARGET_TOKEN } owned, by ${ USER_NAMES[ USER1 ] }`, function () {
							beforeEach( async function () {
								const from    = users[ TOKEN_OWNER ].address
								const to      = users[ USER1       ].address
								const tokenId = TEST.TARGET_TOKEN
								await shouldEmitApprovalEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.approve( to, tokenId ),
									contract,
									from,
									to,
									tokenId
								)
							})

							it( `${ USER_NAMES[ USER1 ] } should be approved to manage token ${ TEST.TARGET_TOKEN }`, async function () {
								const tokenId = TEST.TARGET_TOKEN
								expect(
									await contract.getApproved( tokenId )
								).to.equal( users[ USER1 ].address )
							})

							describe( `${ USER_NAMES[ USER1 ] } trying to approve management of token ${ TEST.TARGET_TOKEN }`, function () {
								it( `Should be reverted when approving tokenOwner`, async function () {
									const to      = users[ TOKEN_OWNER ].address
									const tokenId = TEST.TARGET_TOKEN
									await shouldRevertWhenApprovingTokenOwner(
										contract.connect( users[ USER1 ] )
														.approve( to, tokenId ),
										contract,
										to
									)
								})

								it( `Should be be allowed and clear their approval when approving someone else`, async function () {
									const to      = users[ USER2 ].address
									const tokenId = TEST.TARGET_TOKEN
									await contract.connect( users[ USER1 ] )
																.approve( to, tokenId )
									expect(
										await contract.getApproved( tokenId )
									).to.equal( users[ USER2 ].address )
								})
							})
						})
					}
				})

				describe( CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					if( TEST.METHODS.safeTransferFrom ) {
						it( `Should be reverted when requested token does not exist`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
								contract,
								tokenId
							)
						})

						it( `Should be reverted when operator is not approved`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenCallerIsNotApproved(
								contract.connect( users[ USER1 ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Safe transfer of very first minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.FIRST_TOKEN
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Safe transfer of very last minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.LAST_TOKEN
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `${ USER_NAMES[ TOKEN_OWNER ] } safe transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TOKEN_OWNER_FIRST
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						describe( `${ USER_NAMES[ TOKEN_OWNER ] } safe transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
							it( `Should be reverted when transfering to the NULL address`, async function () {
								const from    = users[ TOKEN_OWNER ].address
								const to      = ethers.constants.AddressZero
								const tokenId = TEST.TARGET_TOKEN
								await shouldRevertWhenTransferingToNullAddress(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to non ERC721Receiver contract`, async function () {
								const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
								const non_holder = await non_holder_artifact.deploy()

								const from    = users[ TOKEN_OWNER ].address
								const to      = non_holder.address
								const tokenId = TEST.TARGET_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
								const retval = INTERFACE_ID.IERC165
								const error  = ERC721ReceiverError.None
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN

								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithERC721ReceiverError
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN

								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_ERROR
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithMessage
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN

								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_MESSAGE
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithoutMessage
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN

								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.Panic
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN

								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_PANIC
								)
							})

							it( `To a valid ERC721Receiver contract`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.None
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const holder = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = holder.address
								const tokenId = TEST.TARGET_TOKEN
								await shouldEmitTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
									contract,
									from,
									to,
									tokenId
								)

								expect(
									await contract.ownerOf( tokenId )
								).to.equal( to )

								expect(
									await contract.balanceOf( to )
								).to.equal( 1 )
							})

							describe( `To other user`, function () {
								beforeEach( async function () {
									const from    = users[ TOKEN_OWNER ].address
									const to      = users[ USER1       ].address
									const tokenId = TEST.TARGET_TOKEN
									await shouldEmitTransferEvent(
										contract.connect( users[ TOKEN_OWNER ] )
														.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from, to, tokenId ),
										contract,
										from,
										to,
										tokenId
									)
								})

								it( `Token ${ TEST.TARGET_TOKEN } owner should now be ${ USER_NAMES[ USER1 ] }`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.ownerOf( tokenId )
									).to.equal( users[ USER1 ].address )
								})

								it( `Balance of ${ USER_NAMES[ TOKEN_OWNER ] } should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
									const tokenOwner = users[ TOKEN_OWNER ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
								})

								it( `Balance of ${ USER_NAMES[ USER1 ] } should now be 1`, async function () {
									const tokenOwner = users[ USER1 ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( 1 )
								})

								it( `Approved address for token ${ TEST.TARGET_TOKEN } should be the NULL address`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.getApproved( tokenId )
									).to.equal( ethers.constants.AddressZero )
								})
							})
						})
					}
				})

				describe( CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE, function () {
					if( TEST.METHODS.safeTransferFrom_ol ) {
						it( `Should be reverted when requested token does not exist`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.UNMINTED_TOKEN
							const data    = `0x`
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
								contract,
								tokenId
							)
						})

						it( `Should be reverted when operator is not approved`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TARGET_TOKEN
							const data    = `0x`
							await shouldRevertWhenCallerIsNotApproved(
								contract.connect( users[ USER1 ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Safe transfer of very first minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.FIRST_TOKEN
							const data    = '0x'
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Safe transfer of very last minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.LAST_TOKEN
							const data    = '0x'
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `${ USER_NAMES[ TOKEN_OWNER ] } safe transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TOKEN_OWNER_FIRST
							const data    = `0x`
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
								contract,
								from,
								to,
								tokenId
							)
						})

						describe( `${ USER_NAMES[ TOKEN_OWNER ] } safe transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
							it( `Should be reverted when transfering to the NULL address`, async function () {
								const from    = users[ TOKEN_OWNER ].address
								const to      = ethers.constants.AddressZero
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNullAddress(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to non ERC721Receiver contract`, async function () {
								const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
								const non_holder = await non_holder_artifact.deploy()

								const from    = users[ TOKEN_OWNER ].address
								const to      = non_holder.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
								const retval = INTERFACE_ID.IERC165
								const error  = ERC721ReceiverError.None
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithERC721ReceiverError
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_ERROR
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithMessage
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_MESSAGE
								)
							})

							it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithoutMessage
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to
								)
							})

							it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.Panic
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const invalidReceiver = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = invalidReceiver.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									to,
									CONTRACT.ERRORS.ERC721Receiver_PANIC
								)
							})

							it( `To a valid ERC721Receiver contract`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.None
								const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
								const holder = await holder_artifact.deploy( retval, error )

								const from    = users[ TOKEN_OWNER ].address
								const to      = holder.address
								const tokenId = TEST.TARGET_TOKEN
								const data    = `0x`
								await shouldEmitTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
									contract,
									from,
									to,
									tokenId
								)

								expect(
									await contract.ownerOf( tokenId )
								).to.equal( to )

								expect(
									await contract.balanceOf( to )
								).to.equal( 1 )
							})

							describe( `To other user`, function () {
								beforeEach( async function () {
									const from    = users[ TOKEN_OWNER ].address
									const to      = users[ USER1       ].address
									const tokenId = TEST.TARGET_TOKEN
									const data    = `0x`
									await shouldEmitTransferEvent(
										contract.connect( users[ TOKEN_OWNER ] )
														.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from, to, tokenId, data ),
										contract,
										from,
										to,
										tokenId
									)
								})

								it( `Token ${ TEST.TARGET_TOKEN } owner should now be ${ USER_NAMES[ USER1 ] }`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.ownerOf( tokenId )
									).to.equal( users[ USER1 ].address )
								})

								it( `Balance of ${ USER_NAMES[ TOKEN_OWNER ] } should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
									const tokenOwner = users[ TOKEN_OWNER ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
								})

								it( `Balance of ${ USER_NAMES[ USER1 ] } should now be 1`, async function () {
									const tokenOwner = users[ USER1 ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( 1 )
								})

								it( `Approved address for token ${ TEST.TARGET_TOKEN } should be the NULL address`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.getApproved( tokenId )
									).to.equal( ethers.constants.AddressZero )
								})
							})
						})
					}
				})

				describe( CONTRACT.METHODS.setApprovalForAll.SIGNATURE, function () {
					if( TEST.METHODS.setApprovalForAll ) {
						it( `Should be reverted when trying to allow self`, async function () {
							const operator = users[ USER1 ].address
							const approved = true
							await shouldRevertWhenApprovingTokenOwner(
								contract.connect( users[ USER1 ] )
												.setApprovalForAll( operator, approved ),
								contract,
								operator
							)
						})

						describe( `Allowing another user to trade owned tokens`, function () {
							beforeEach( async function () {
								const owner    = users[ TOKEN_OWNER ].address
								const operator = users[ USER1 ].address
								const approved = true
								await shouldEmitApprovalForAllEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.setApprovalForAll( operator, approved ),
									contract,
									owner,
									operator,
									approved
								)
							})

							it( `${ USER_NAMES[ USER1 ] } should now be allowed to trade tokens owned by ${ USER_NAMES[ TOKEN_OWNER ] }`, async function () {
								tokenOwner = users[ TOKEN_OWNER ].address
								operator   = users[ USER1 ].address
								expect(
									await contract.isApprovedForAll( tokenOwner, operator )
								).to.be.true
							})

							describe( `Removing approval for other user to trade owned tokens`, function () {
								beforeEach( async function () {
									const owner    = users[ TOKEN_OWNER ].address
									const operator = users[ USER1       ].address
									const approved = false
									await shouldEmitApprovalForAllEvent(
										contract.connect( users[ TOKEN_OWNER ] )
														.setApprovalForAll( operator, approved ),
										contract,
										owner,
										operator,
										approved
									)
								})

								it( `${ USER_NAMES[ USER1 ] } should not be allowed to trade tokens owned by ${ USER_NAMES[ TOKEN_OWNER ] } anymore`, async function () {
									const owner    = users[ TOKEN_OWNER ].address
									const operator = users[ USER1       ].address
									expect(
										await contract.isApprovedForAll( owner, operator )
									).to.be.false
								})
							})
						})
					}
				})

				describe( CONTRACT.METHODS.transferFrom.SIGNATURE, function () {
					if( TEST.METHODS.transferFrom ) {
						it( `Should be reverted when requested token does not exist`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.UNMINTED_TOKEN
							await shouldRevertWhenRequestedTokenDoesNotExist(
								contract.connect( users[ TOKEN_OWNER ] )
												.transferFrom( from, to, tokenId ),
								contract,
								tokenId
							)
						})

						it( `Should be reverted when trying to transfer token ${ TEST.TARGET_TOKEN } not owned`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenCallerIsNotApproved(
								contract.connect( users[ USER1 ] )
												.transferFrom( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Transfer of very first minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.FIRST_TOKEN
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.transferFrom( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `Transfer of very last minted token`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.LAST_TOKEN
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.transferFrom( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						it( `${ USER_NAMES[ TOKEN_OWNER ] } transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
							const from    = users[ TOKEN_OWNER ].address
							const to      = users[ USER1       ].address
							const tokenId = TEST.TOKEN_OWNER_FIRST
							await shouldEmitTransferEvent(
								contract.connect( users[ TOKEN_OWNER ] )
												.transferFrom( from, to, tokenId ),
								contract,
								from,
								to,
								tokenId
							)
						})

						describe( `${ USER_NAMES[ TOKEN_OWNER ] } transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
							it( `Should be reverted when transfering to the NULL address`, async function () {
								const from    = users[ TOKEN_OWNER ].address
								const to      = ethers.constants.AddressZero
								const tokenId = TEST.TARGET_TOKEN
								await shouldRevertWhenTransferingToNullAddress(
									contract.connect( users[ TOKEN_OWNER ] )
													.transferFrom( from, to, tokenId ),
									contract,
									to
								)
							})

							describe( `To non ERC721Receiver contract should not be reverted`, async function () {
								const non_holder = await deployContract( users[ CONTRACT_DEPLOYER ], TEST.NON_HOLDER_ARTIFACT, [] )
								const from    = users[ TOKEN_OWNER ].address
								const to      = non_holder.address
								const tokenId = TEST.TARGET_TOKEN
								await contract.connect( users[ TOKEN_OWNER ] )
															.transferFrom( from, to, tokenId )

								expect(
									await contract.ownerOf( TEST.TARGET_TOKEN )
								).to.equal( non_holder.address )
							})

							describe( `To other user`, function () {
								beforeEach( async function () {
									const from    = users[ TOKEN_OWNER ].address
									const to      = users[ USER1       ].address
									const tokenId = TEST.TARGET_TOKEN
									await shouldEmitTransferEvent(
										contract.connect( users[ TOKEN_OWNER ] )
														.transferFrom( from, to, tokenId ),
										contract,
										from,
										to,
										tokenId
									)
								})

								it( `Token ${ TEST.TARGET_TOKEN } owner should now be ${ USER_NAMES[ USER1 ] }`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.ownerOf( tokenId )
									).to.equal( users[ USER1 ].address )
								})

								it( `Balance of ${ USER_NAMES[ TOKEN_OWNER ] } should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
									const tokenOwner = users[ TOKEN_OWNER ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
								})

								it( `Balance of ${ USER_NAMES[ USER1 ] } should now be 1`, async function () {
									const tokenOwner = users[ USER1 ].address
									expect(
										await contract.balanceOf( tokenOwner )
									).to.equal( 1 )
								})

								it( `Approved address for token ${ TEST.TARGET_TOKEN } should be the NULL address`, async function () {
									const tokenId = TEST.TARGET_TOKEN
									expect(
										await contract.getApproved( tokenId )
									).to.equal( ethers.constants.AddressZero )
								})
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
	ERC721ReceiverError,
	shouldEmitApprovalEvent,
	shouldEmitTransferEvent,
	shouldEmitApprovalForAllEvent,
	shouldRevertWhenApprovingTokenOwner,
	shouldRevertWhenCallerIsNotApproved,
	shouldRevertWhenRequestedTokenDoesNotExist,
	shouldRevertWhenTransferingToNonERC721Receiver,
	shouldRevertWhenTransferingToNullAddress,
	shouldBehaveLikeERC721BatchBeforeMint,
	shouldBehaveLikeERC721BatchAfterMint,
}
