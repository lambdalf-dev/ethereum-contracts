// **************************************
// *****           IMPORT           *****
// **************************************
  const {
    USER1,
    USER2,
    TOKEN_OWNER,
    OTHER_OWNER,
  } = require(`../test-var-module`)

  const chai = require(`chai`)
  const chaiAsPromised = require(`chai-as-promised`)
  chai.use(chaiAsPromised)
  const expect = chai.expect
  const { loadFixture } = require(`@nomicfoundation/hardhat-network-helpers`)
  const { ethers } = require(`hardhat`)

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../utils/behavior.ERC165` )
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
	// Events
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

	// Errors
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
	async function shouldRevertWhenTransferingToNullAddress ( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_INVALID_TRANSFER` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenTransferingFromNonOwner ( promise, contract, tokenOwner, from, tokenId, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC721_INVALID_TRANSFER_FROM` )
				.withArgs( tokenOwner, from, tokenId )
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
			if ( error == ERC721ReceiverError.RevertWithERC721ReceiverError ) {
				const receiverContract = new ethers.Contract( receiver, '[{"inputs": [{"internalType": "bytes4","name": "retval","type": "bytes4"},{"internalType": "enum Mock_ERC721Receiver.Error","name": "error","type": "uint8"}],"stateMutability": "nonpayable","type": "constructor"},{"inputs": [],"name": "ERC721ReceiverError","type": "error"}]', contract.provider )
				await expect( promise )
					.to.be.revertedWithCustomError( receiverContract, `ERC721ReceiverError` )
			}
			else if ( error == ERC721ReceiverError.Panic ) {
				await expect( promise )
					.to.be.reverted
			}
			else {
				await expect( promise )
					.to.be.revertedWith( `Mock_ERC721Receiver: reverting` )
			}
		}
	}

	// Behavior
	function shouldBehaveLikeERC721BatchBeforeMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721Batch before any token is minted`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.supplyMinted.SIGNATURE, function () {
					it( `Supply minted should be ${ TEST.INIT_SUPPLY }`, async function () {
						expect(
							await contract.supplyMinted()
						).to.equal( TEST.INIT_SUPPLY )
					})
				})
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Default balance of a random user should be 0`, async function () {
						const tokenOwner = users[ USER1 ]
						expect(
							await contract.balanceOf( tokenOwner.address )
						).to.equal( 0 )
					})
					it( `Balance of the NULL address should be 0`, async function () {
						const tokenOwner = ethers.constants.AddressZero
						expect(
							await contract.balanceOf( tokenOwner )
						).to.equal( 0 )
					})
				})
				describe( CONTRACT.METHODS.isApprovedForAll.SIGNATURE, function () {
					it( `A token owner does not need approval to manage their own tokens, expect false`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const operator = users[ TOKEN_OWNER ]
						expect(
							await contract.isApprovedForAll( tokenOwner.address, operator.address )
						).to.be.false
					})
					it( `A random user requires the token owner's approval to manage tokens on their behalf, expect false`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const operator = users[ USER1       ]
						expect(
							await contract.isApprovedForAll( tokenOwner.address, operator.address )
						).to.be.false
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeERC721BatchAfterMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ERC721Batch after minting some tokens`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.approve.SIGNATURE, function () {
					it( `Should be reverted when requested token does not exist`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						let tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( tokenOwner )
								.approve( to.address, tokenId ),
							contract,
							tokenId
						)

						tokenId = TEST.INVALID_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( tokenOwner )
								.approve( to.address, tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when caller is not approved operator`, async function () {
						const to = users[ USER1 ]
						const tokenId = TEST.TARGET_TOKEN
						const tokenOwner = users[ TOKEN_OWNER ]
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.approve( to.address, tokenId ),
							contract,
							tokenOwner.address,
							to.address,
							tokenId
						)
					})
					describe( `Token owner approve management of token ${ TEST.TARGET_TOKEN } owned`, function () {
						beforeEach( async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = users[ USER1       ]
							const tokenId = TEST.TARGET_TOKEN
							await shouldEmitApprovalEvent(
								contract
									.connect( tokenOwner )
									.approve( to.address, tokenId ),
								contract,
								from.address,
								to.address,
								tokenId
							)
						})
						it( `Individually approved user should be approved to manage token ${ TEST.TARGET_TOKEN }`, async function () {
							const tokenId = TEST.TARGET_TOKEN
							expect(
								await contract.getApproved( tokenId )
							).to.equal( users[ USER1 ].address )
						})
						describe( `Individually approved user trying to approve management of token ${ TEST.TARGET_TOKEN }`, function () {
							it( `Should be reverted when approving current token owner`, async function () {
								const operator = users[ USER1 ]
								const to = users[ TOKEN_OWNER ]
								const tokenId = TEST.TARGET_TOKEN
								await shouldRevertWhenApprovingTokenOwner(
									contract
										.connect( operator )
										.approve( to.address, tokenId ),
									contract,
									to.address
								)
							})
							it( `Should be be allowed and clear their approval when approving someone else`, async function () {
								const operator = users[ USER1 ]
								const from = users[ TOKEN_OWNER ]
								const to = users[ USER2 ]
								const tokenId = TEST.TARGET_TOKEN
								await shouldEmitApprovalEvent(
									contract
										.connect( operator )
										.approve( to.address, tokenId ),
									contract,
									from.address,
									to.address,
									tokenId
								)

								expect(
									await contract.getApproved( tokenId )
								).to.equal( users[ USER2 ].address )
							})
						})
					})
				})
				describe( CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					it( `Should be reverted when requested token does not exist`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when operator is not approved`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Safe transfer of very first minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Safe transfer of very last minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.LAST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Safe transfer of individually approved token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const operator = users[ USER1 ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.LAST_TOKEN

						await expect(
							contract
								.connect( tokenOwner )
								.approve( operator.address, tokenId )
						).to.be.fulfilled

						await shouldEmitTransferEvent(
							contract
								.connect( operator )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Token owner safe transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TOKEN_OWNER_FIRST
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					describe( `Token owner safe transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
						it( `Should be reverted when transfering from another address than the token owner`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ OTHER_OWNER ]
							const to = users[ OTHER_OWNER ]
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenTransferingFromNonOwner(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								tokenOwner.address,
								from.address,
								tokenId
							)
						})
						it( `Should be reverted when transfering to the NULL address`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = ethers.constants.AddressZero
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenTransferingToNullAddress(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to, tokenId ),
								contract
							)
						})
						it( `Should be reverted when transfering to non ERC721Receiver contract`, async function () {
							const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
							const non_holder = await non_holder_artifact.deploy()

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = non_holder
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address
							)
						})
						it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
							const retval = INTERFACE_ID.IERC165
							const error = ERC721ReceiverError.None
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN

							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithERC721ReceiverError
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN

							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address,
								error
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithMessage
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN

							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address,
								error
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithoutMessage
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN

							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address
							)
						})
						/*it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.Panic
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN

							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								to.address,
								error
							)
						})*/
						it( `To a valid ERC721Receiver contract`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.None
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const holder = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = holder
							const tokenId = TEST.TARGET_TOKEN
							await shouldEmitTransferEvent(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
								contract,
								from.address,
								to.address,
								tokenId
							)

							expect(
								await contract.ownerOf( tokenId )
							).to.equal( to.address )

							expect(
								await contract.balanceOf( to.address )
							).to.equal( 1 )
						})
						describe( `To other user`, function () {
							beforeEach( async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								const from = users[ TOKEN_OWNER ]
								const to = users[ USER1       ]
								const tokenId = TEST.TARGET_TOKEN
								await shouldEmitTransferEvent(
									contract
										.connect( tokenOwner )
										.functions[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ]( from.address, to.address, tokenId ),
									contract,
									from.address,
									to.address,
									tokenId
								)
							})
							it( `Token ${ TEST.TARGET_TOKEN } owner should be correctly updated`, async function () {
								const tokenId = TEST.TARGET_TOKEN
								expect(
									await contract.ownerOf( tokenId )
								).to.equal( users[ USER1 ].address )
							})
							it( `Balance of initial token owner should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								expect(
									await contract.balanceOf( tokenOwner.address )
								).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
							})
							it( `Balance of new token owner should now be 1`, async function () {
								const tokenOwner = users[ USER1 ]
								expect(
									await contract.balanceOf( tokenOwner.address )
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
				})
				describe( CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE, function () {
					it( `Should be reverted when requested token does not exist`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.UNMINTED_TOKEN
						const data = `0x`
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when operator is not approved`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TARGET_TOKEN
						const data = `0x`
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Safe transfer of very first minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.FIRST_TOKEN
						const data = '0x'
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Safe transfer of very last minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.LAST_TOKEN
						const data = '0x'
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Token owner safe transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TOKEN_OWNER_FIRST
						const data = `0x`
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					describe( `Token owner safe transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
						it( `Should be reverted when transfering from another address than the token owner`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ OTHER_OWNER ]
							const to = users[ OTHER_OWNER ]
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingFromNonOwner(
								contract
									.connect( from )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								tokenOwner.address,
								from.address,
								tokenId
							)
						})
						it( `Should be reverted when transfering to the NULL address`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = ethers.constants.AddressZero
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNullAddress(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to, tokenId, data ),
								contract
							)
						})
						it( `Should be reverted when transfering to non ERC721Receiver contract`, async function () {
							const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
							const non_holder = await non_holder_artifact.deploy()

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = non_holder
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address
							)
						})
						it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
							const retval = INTERFACE_ID.IERC165
							const error = ERC721ReceiverError.None
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithERC721ReceiverError
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address,
								error
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithMessage
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address,
								error
							)
						})
						it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.RevertWithoutMessage
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address
							)
						})
						/*it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.Panic
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const invalidReceiver = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = invalidReceiver
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldRevertWhenTransferingToNonERC721Receiver(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								to.address,
								error
							)
						})*/
						it( `To a valid ERC721Receiver contract`, async function () {
							const retval = INTERFACE_ID.IERC721Receiver
							const error = ERC721ReceiverError.None
							const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
							const holder = await holder_artifact.deploy( retval, error )

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = holder
							const tokenId = TEST.TARGET_TOKEN
							const data = `0x`
							await shouldEmitTransferEvent(
								contract
									.connect( tokenOwner )
									.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
								contract,
								from.address,
								to.address,
								tokenId
							)

							expect(
								await contract.ownerOf( tokenId )
							).to.equal( to.address )

							expect(
								await contract.balanceOf( to.address )
							).to.equal( 1 )
						})
						describe( `To other user`, function () {
							beforeEach( async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								const from = users[ TOKEN_OWNER ]
								const to = users[ USER1       ]
								const tokenId = TEST.TARGET_TOKEN
								const data = `0x`
								await shouldEmitTransferEvent(
									contract
										.connect( tokenOwner )
										.functions[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ]( from.address, to.address, tokenId, data ),
									contract,
									from.address,
									to.address,
									tokenId
								)
							})
							it( `Token ${ TEST.TARGET_TOKEN } owner should be correctly updated`, async function () {
								const tokenId = TEST.TARGET_TOKEN
								expect(
									await contract.ownerOf( tokenId )
								).to.equal( users[ USER1 ].address )
							})
							it( `Balance of initial token owner should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								expect(
									await contract.balanceOf( tokenOwner.address )
								).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
							})
							it( `Balance of new token owner should now be 1`, async function () {
								const tokenOwner = users[ USER1 ]
								expect(
									await contract.balanceOf( tokenOwner.address )
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
				})
				describe( CONTRACT.METHODS.setApprovalForAll.SIGNATURE, function () {
					it( `Should be reverted when trying to allow self`, async function () {
						const operator = users[ USER1 ]
						const approved = true
						await shouldRevertWhenApprovingTokenOwner(
							contract
								.connect( operator )
								.setApprovalForAll( operator.address, approved ),
							contract,
							operator.address
						)
					})
					describe( `Allowing another user to trade owned tokens`, function () {
						beforeEach( async function () {
							const owner = users[ TOKEN_OWNER ]
							const operator = users[ USER1 ]
							const approved = true
							await shouldEmitApprovalForAllEvent(
								contract
									.connect( owner )
									.setApprovalForAll( operator.address, approved ),
								contract,
								owner.address,
								operator.address,
								approved
							)
						})
						it( `Approved user should now be allowed to trade tokens owned by token owner`, async function () {
							tokenOwner = users[ TOKEN_OWNER ]
							operator = users[ USER1 ]
							expect(
								await contract.isApprovedForAll( tokenOwner.address, operator.address )
							).to.be.true
						})
						describe( `Removing approval for other user to trade owned tokens`, function () {
							beforeEach( async function () {
								const owner = users[ TOKEN_OWNER ]
								const operator = users[ USER1       ]
								const approved = false
								await shouldEmitApprovalForAllEvent(
									contract
										.connect( owner )
										.setApprovalForAll( operator.address, approved ),
									contract,
									owner.address,
									operator.address,
									approved
								)
							})
							it( `Approved user should not be allowed to trade tokens owned by token owner anymore`, async function () {
								const owner = users[ TOKEN_OWNER ]
								const operator = users[ USER1       ]
								expect(
									await contract.isApprovedForAll( owner.address, operator.address )
								).to.be.false
							})
						})
					})
				})
				describe( CONTRACT.METHODS.transferFrom.SIGNATURE, function () {
					it( `Should be reverted when requested token does not exist`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( tokenOwner )
								.transferFrom( from.address, to.address, tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when trying to transfer token ${ TEST.TARGET_TOKEN } not owned`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.transferFrom( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Transfer of very first minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.transferFrom( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Transfer of very last minted token`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.LAST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.transferFrom( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					it( `Token owner transfering token ${ TEST.TOKEN_OWNER_FIRST } owned`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ USER1       ]
						const tokenId = TEST.TOKEN_OWNER_FIRST
						await shouldEmitTransferEvent(
							contract
								.connect( tokenOwner )
								.transferFrom( from.address, to.address, tokenId ),
							contract,
							from.address,
							to.address,
							tokenId
						)
					})
					describe( `Token owner transfering token ${ TEST.TARGET_TOKEN } owned`, function () {
						it( `Should be reverted when transfering from another address than the token owner`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ OTHER_OWNER ]
							const to = users[ OTHER_OWNER ]
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenTransferingFromNonOwner(
								contract
									.connect( tokenOwner )
									.transferFrom( from.address, to.address, tokenId ),
								contract,
								tokenOwner.address,
								from.address,
								tokenId
							)
						})
						it( `Should be reverted when transfering to the NULL address`, async function () {
							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = ethers.constants.AddressZero
							const tokenId = TEST.TARGET_TOKEN
							await shouldRevertWhenTransferingToNullAddress(
								contract
									.connect( from )
									.transferFrom( from.address, to, tokenId ),
								contract
							)
						})
						it( `To non ERC721Receiver contract should not be reverted`, async function () {
							const non_holder_artifact = await ethers.getContractFactory( `Mock_NonERC721Receiver` )
							const non_holder = await non_holder_artifact.deploy()

							const tokenOwner = users[ TOKEN_OWNER ]
							const from = users[ TOKEN_OWNER ]
							const to = non_holder
							const tokenId = TEST.TARGET_TOKEN
							await contract
								.connect( tokenOwner )
								.transferFrom( from.address, to.address, tokenId )

							expect(
								await contract.ownerOf( TEST.TARGET_TOKEN )
							).to.equal( non_holder.address )
						})
						describe( `To other user`, function () {
							beforeEach( async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								const from = users[ TOKEN_OWNER ]
								const to = users[ USER1       ]
								const tokenId = TEST.TARGET_TOKEN
								await shouldEmitTransferEvent(
									contract
										.connect( tokenOwner )
										.transferFrom( from.address, to.address, tokenId ),
									contract,
									from.address,
									to.address,
									tokenId
								)
							})
							it( `Token ${ TEST.TARGET_TOKEN } owner should be correctly updated`, async function () {
								const tokenId = TEST.TARGET_TOKEN
								expect(
									await contract.ownerOf( tokenId )
								).to.equal( users[ USER1 ].address )
							})
							it( `Balance of initial token owner should now be ${ ( TEST.TOKEN_OWNER_SUPPLY - 1 ).toString() }`, async function () {
								const tokenOwner = users[ TOKEN_OWNER ]
								expect(
									await contract.balanceOf( tokenOwner.address )
								).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
							})
							it( `Balance of new token owner should now be 1`, async function () {
								const tokenOwner = users[ USER1 ]
								expect(
									await contract.balanceOf( tokenOwner.address )
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
				})
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.supplyMinted.SIGNATURE, function () {
					it( `Supply minted should be ${ TEST.MINTED_SUPPLY }`, async function () {
						expect(
							await contract.supplyMinted()
						).to.equal( TEST.MINTED_SUPPLY )
					})
				})
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Balance of token owner should be ${ TEST.TOKEN_OWNER_SUPPLY }`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						expect(
							await contract.balanceOf( tokenOwner.address )
						).to.equal( TEST.TOKEN_OWNER_SUPPLY )
					})
					it( `Balance of other owner should be ${ TEST.OTHER_OWNER_SUPPLY }`, async function () {
						const tokenOwner = users[ OTHER_OWNER ]
						expect(
							await contract.balanceOf( tokenOwner.address )
						).to.equal( TEST.OTHER_OWNER_SUPPLY )
					})
				})
				describe( CONTRACT.METHODS.getApproved.SIGNATURE, function () {
					it( `Should revert when requested token does not exist`, async function () {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.getApproved( tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be the null address when requested token has not been approved`, async function () {
						const tokenId = TEST.TARGET_TOKEN
						expect(
							await contract.getApproved( tokenId )
						).to.equal( ethers.constants.AddressZero )
					})
				})
				describe( CONTRACT.METHODS.ownerOf.SIGNATURE, function () {
					it( `Should be reverted when requesting token number 0`, async function () {
						const tokenId = TEST.INVALID_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.ownerOf( tokenId ),
							contract,
							tokenId
						)
					})
					it( `Should be reverted when requested token does not exist`, async function () {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.ownerOf( tokenId ),
							contract,
							tokenId
						)
					})
					it( `Owner of token ${ TEST.TARGET_TOKEN } should be accurate`, async function () {
						const tokenId = TEST.TARGET_TOKEN
						expect(
							await contract.ownerOf( tokenId )
						).to.equal( users[ TOKEN_OWNER ].address )
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
	ERC721ReceiverError,
	shouldEmitApprovalEvent,
	shouldEmitApprovalForAllEvent,
	shouldEmitTransferEvent,
	shouldRevertWhenCallerIsNotApproved,
	shouldRevertWhenApprovingTokenOwner,
	shouldRevertWhenTransferingToNullAddress,
	shouldRevertWhenTransferingFromNonOwner,
	shouldRevertWhenRequestedTokenDoesNotExist,
	shouldRevertWhenTransferingToNonERC721Receiver,
	shouldBehaveLikeERC721BatchBeforeMint,
	shouldBehaveLikeERC721BatchAfterMint,
}
