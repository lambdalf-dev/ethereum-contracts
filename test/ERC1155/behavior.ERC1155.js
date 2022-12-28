// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		USER2,
		TOKEN_OWNER,
		OTHER_OWNER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../utils/behavior.ERC165` )

	const {
		shouldRevertWhenArrayLengthsDontMatch
	} = require( `../utils/behavior.Arrays` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}

	// Custom ERC721ReceiverError type for testing the transfer to ERC721Receiver ( copied from Open Zeppelin )
	const ERC1155ReceiverError = {
		None                 : 0,
		RevertWithError      : 1,
		RevertWithMessage    : 2,
		RevertWithoutMessage : 3,
		Panic                : 4
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// Events
	async function shouldEmitApprovalForAllEvent( promise, contract, owner, operator, approved ) {
		await expect( promise )
			.to.emit( contract, `ApprovalForAll` )
			.withArgs( owner, operator, approved )
	}
	async function shouldEmitTransferSingleEvent( promise, contract, operator, from, to, id, amount ) {
		await expect( promise )
			.to.emit( contract, `TransferSingle` )
			.withArgs( operator, from, to, id, amount )
	}
	async function shouldEmitTransferBatchEvent( promise, contract, operator, from, to, ids, amounts, logNumber = 0 ) {
		const tx = await promise
		const receipt = await ethers.provider.getTransactionReceipt( tx.hash )
		const interface = new ethers.utils.Interface( [ `event TransferBatch( address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values )` ] )
		const data = receipt.logs[ logNumber ].data
		const topics = receipt.logs[ logNumber ].topics
		const event = interface.decodeEventLog( `TransferBatch`, data, topics )
		const len = ids.length
		expect( event.operator ).to.equal( operator )
		expect( event.from ).to.equal( from )
		expect( event.to ).to.equal( to )
		expect( event.ids[ 0 ] ).to.equal( ids[ 0 ] )
		expect( event.ids[ len - 1 ] ).to.equal( ids[ len - 1 ] )
	}
	async function shouldEmitURIEvent( promise, contract, value, id ) {
		await expect( promise )
			.to.emit( contract, `URI` )
			.withArgs( value, id )
	}

	// Errors
	async function shouldRevertWhenApprovingTokenOwner( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_INVALID_CALLER_APPROVAL` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenCallerIsNotApproved( promise, contract, from, operator, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_CALLER_NOT_APPROVED` )
				.withArgs( from, operator )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenERC1155ReceiverRejectsTransfer( promise, contract, receiverContract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_REJECTED_TRANSFER` )
		}
		else {
			if ( error == ERC1155ReceiverError.RevertWithError ) {
				await expect( promise )
					.to.be.revertedWithCustomError( receiverContract, `ERC1155ReceiverError` )
			}
			else if ( error == ERC1155ReceiverError.Panic ) {
				await expect( promise )
					.to.be.reverted
			}
			else if ( error == ERC1155ReceiverError.RevertWithMessage ) {
				await expect( promise )
					.to.be.revertedWith( 'Mock_ERC1155Receiver: reverting' )
			}
			else {
				await expect( promise )
					.to.be.revertedWith( error )
			}
		}
	}
	async function shouldRevertWhenNewSeriesAlreadyExist( promise, contract, id, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_EXISTANT_TOKEN` )
				.withArgs( id )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenRequestedTokenDoesNotExist( promise, contract, id, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_NON_EXISTANT_TOKEN` )
				.withArgs( id )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens( promise, contract, from, id, amount, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_INSUFFICIENT_BALANCE` )
				.withArgs( from, id, amount )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenTransferingToNonERC1155ReceiverContract( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_REJECTED_TRANSFER` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenTransferingToNullAddress( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `IERC1155_INVALID_TRANSFER` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}

	// Behavior
	async function shouldBehaveLikeIERC1155AtDeployTime( fixture, TEST, CONTRACT ) {
		describe( `Should behave like IERC1155 at deploy`, function () {
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
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Should be reverted When requested token doesn't exist`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const id = TEST.INVALID_SERIES_ID
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.balanceOf( tokenOwner.address, id ),
							contract,
							id
						)
					})
				})
				describe( CONTRACT.METHODS.balanceOfBatch.SIGNATURE, function () {
					it( `Should be reverted when batch includes invalid token ID`, async function () {
						const tokenOwners = [ users[ TOKEN_OWNER ].address ]
						const ids = [ TEST.INVALID_SERIES_ID ]
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.balanceOfBatch( tokenOwners, ids ),
							contract,
							TEST.INVALID_SERIES_ID
						)
					})
					it( `Should be reverted when array lengths don't match`, async function () {
						const tokenOwners = [ 
							users[ TOKEN_OWNER ].address,
							users[ OTHER_OWNER ].address,
						]
						const ids = [ TEST.INIT_SERIES.id_ ]
						await shouldRevertWhenArrayLengthsDontMatch(
							contract.balanceOfBatch( tokenOwners, ids ),
							contract
						)
					})
				})
				describe( CONTRACT.METHODS.isApprovedForAll.SIGNATURE, function () {
					it( `Default approval status should be false`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const operator = users[ OTHER_OWNER ]
						expect(
							await contract.isApprovedForAll( tokenOwner.address, operator.address )
						).to.be.false
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					it( `Should be reverted When requested token doesn't exist`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const id = TEST.INVALID_SERIES_ID
						const amount = TEST.TARGET_AMOUNT
						const data = "0x"
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( operator )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							id
						)
					})
				})
				describe( CONTRACT.METHODS.setApprovalForAll.SIGNATURE, function () {
					it( `Should be reverted when trying to approve self`, async function () {
						const operator = users[ TOKEN_OWNER ]
						await shouldRevertWhenApprovingTokenOwner(
							contract
								.connect( operator )
								.setApprovalForAll( operator.address, true ),
							contract
						)
					})
					it( `Should successfully approve, then disapprove address`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const operator = users[ OTHER_OWNER ]
						await expect(
							contract
								.connect( tokenOwner )
								.setApprovalForAll( operator.address, true )
						).to.be.fulfilled
						expect(
							await contract.isApprovedForAll( tokenOwner.address, operator.address )
						).to.be.true

						await expect(
							contract
								.connect( tokenOwner )
								.setApprovalForAll( operator.address, false )
						).to.be.fulfilled
						expect(
							await contract.isApprovedForAll( tokenOwner.address, operator.address )
						).to.be.false
					})
				})
			// **************************************
		})
	}
	async function shouldBehaveLikeIERC1155AfterCreatingSeries( fixture, TEST, CONTRACT ) {
		describe( `Should behave like IERC1155 after creating series`, function () {
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
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Initial balance should be ${TEST.INIT_SUPPLY}`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const id = TEST.INIT_SERIES.id_
						expect(
							await contract.balanceOf( tokenOwner.address, id )
						).to.equal(	TEST.INIT_SUPPLY )
					})
				})
				describe( CONTRACT.METHODS.balanceOfBatch.SIGNATURE, function () {
					it( `Initial balance of batch should be ${TEST.INIT_SUPPLY}`, async function () {
						const tokenOwners = [ 
							users[ TOKEN_OWNER ].address,
							users[ OTHER_OWNER ].address,
						]
						const ids = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( tokenOwners, ids )
						expect( res[ 0 ] ).to.equal( TEST.INIT_SUPPLY )
						expect( res[ 1 ] ).to.equal( TEST.INIT_SUPPLY )
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.safeBatchTransferFrom.SIGNATURE, function () {
					it( `Should be reverted when transfering from address with no balance`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ TEST.TARGET_AMOUNT ]
						const data = "0x"
						await shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							from.address,
							TEST.INIT_SERIES.id_,
							TEST.INIT_SUPPLY
						)
					})
				})
				describe( CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					it( `Should be reverted when transfering from address with no balance`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const id = TEST.INIT_SERIES.id_
						const amount = TEST.TARGET_AMOUNT
						const data = "0x"
						await shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							from.address,
							TEST.INIT_SERIES.id_,
							TEST.INIT_SUPPLY
						)
					})
				})
			// **************************************
		})
	}
	async function shouldBehaveLikeIERC1155AfterMint( fixture, TEST, CONTRACT ) {
		describe( `Should behave like IERC1155 after minting some tokens`, function () {
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
				describe( CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it( `Should update balances correctly`, async function () {
						const tokenOwner = users[ TOKEN_OWNER ]
						const otherOwner = users[ OTHER_OWNER ]
						const id = TEST.INIT_SERIES.id_
						expect( await contract.balanceOf( tokenOwner.address, id ) ).to.equal(
							TEST.TOKEN_OWNER_SUPPLY
						)
						expect( await contract.balanceOf( otherOwner.address, id ) ).to.equal(
							TEST.OTHER_OWNER_SUPPLY
						)
					})
				})
				describe( CONTRACT.METHODS.balanceOfBatch.SIGNATURE, function () {
					it( `Should update balance of batch correctly`, async function () {
						const tokenOwners = [ 
							users[ TOKEN_OWNER ].address,
							users[ OTHER_OWNER ].address,
						]
						const ids = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( tokenOwners, ids )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY )
						expect( res[ 1 ] ).to.equal( TEST.OTHER_OWNER_SUPPLY )
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.safeBatchTransferFrom.SIGNATURE, function () {
					it( `Should be reverted when batch includes invalid token ID`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_, TEST.INVALID_SERIES_ID ]
						const amounts = [ TEST.TOKEN_OWNER_INIT_SUPPLY, TEST.TARGET_AMOUNT ]
						const data = "0x"
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							TEST.INVALID_SERIES_ID
						)
					})
					it( `Should be reverted when transfering from address with insufficient balance`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ TEST.TARGET_AMOUNT + TEST.TOKEN_OWNER_INIT_SUPPLY ]
						const data = "0x"
						await shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							from.address,
							TEST.INIT_SERIES.id_,
							TEST.TOKEN_OWNER_SUPPLY
						)
					})
					it( `Should be reverted when array lengths don't match`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ TEST.TARGET_AMOUNT, TEST.TARGET_AMOUNT ]
						const data = "0x"
						await shouldRevertWhenArrayLengthsDontMatch(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract
						)
					})
					it( `Should be reverted when transfering to the NULL address`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = ethers.constants.AddressZero
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ TEST.TARGET_AMOUNT ]
						const data = "0x"
						await shouldRevertWhenTransferingToNullAddress(
							contract
								.connect( from )
								.safeBatchTransferFrom( from.address, to, ids, amounts, data ),
							contract
						)
					})
					it( `Should be reverted when caller is not owner or approved`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							from.address,
							to.address
						)
					})
					it( `Should be reverted when transfering to non ERC1155Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory(
							"Mock_NonERC1155Receiver"
						)
						const non_holder = await non_holder_artifact.deploy()

						const from = users[ TOKEN_OWNER ]
						const to = non_holder
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"
						await shouldRevertWhenTransferingToNonERC1155ReceiverContract(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract
						)
					})
					it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC1155ReceiverError.None
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							to
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC1155BatchReceiver
						const error = ERC1155ReceiverError.RevertWithError
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							to,
							error
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC1155BatchReceiver
						const error = ERC1155ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							to,
							error
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC1155BatchReceiver
						const error = ERC1155ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							to
						)
					})
					it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC1155BatchReceiver
						const error = ERC1155ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ OTHER_OWNER ]
						const to = invalidReceiver
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							to,
							error
						)
					})
					it( `To a valid ERC1155Receiver contract`, async function () {
						const retval = INTERFACE_ID.IERC1155BatchReceiver
						const error = ERC1155ReceiverError.None
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const holder = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = holder
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldEmitTransferBatchEvent(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							from.address,
							from.address,
							to.address,
							ids,
							amounts
						)

						const owners = [ from.address, to.address ]
						const balanceIds = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( owners, balanceIds )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
						expect( res[ 1 ] ).to.equal( 1 )
					})
					it( `To other user`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await shouldEmitTransferBatchEvent(
							contract
								.connect( from )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							from.address,
							from.address,
							to.address,
							ids,
							amounts
						)

						const owners = [ from.address, to.address ]
						const balanceIds = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( owners, balanceIds )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
						expect( res[ 1 ] ).to.equal( TEST.OTHER_OWNER_SUPPLY + 1 )
					})
					it( `Approved user can transfer`, async function () {
						const operator = users[ USER2 ]
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const ids = [ TEST.INIT_SERIES.id_ ]
						const amounts = [ 1 ]
						const data = "0x"

						await
							contract
								.connect( from )
								.setApprovalForAll( operator.address, true )
						await shouldEmitTransferBatchEvent(
							contract
								.connect( operator )
								.safeBatchTransferFrom(
									from.address,
									to.address,
									ids,
									amounts,
									data
								),
							contract,
							operator.address,
							from.address,
							to.address,
							ids,
							amounts
						)

						const owners = [ from.address, to.address ]
						const balanceIds = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( owners, balanceIds )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY - 1 )
						expect( res[ 1 ] ).to.equal( TEST.OTHER_OWNER_SUPPLY + 1 )
					})
				})
				describe( CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					it( `Should be reverted when transfering from address with insufficient balance`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const id = TEST.INIT_SERIES.id_
						const amount = TEST.TARGET_AMOUNT + TEST.TOKEN_OWNER_INIT_SUPPLY
						const data = "0x"
						await shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							from.address,
							TEST.INIT_SERIES.id_,
							TEST.TOKEN_OWNER_SUPPLY
						)
					})
					it( `Should be reverted when transfering to the NULL address`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = ethers.constants.AddressZero
						const id = TEST.INIT_SERIES.id_
						const amount = TEST.TARGET_AMOUNT
						const data = "0x"
						await shouldRevertWhenTransferingToNullAddress(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to, id, amount, data ),
							contract
						)
					})
					it( `Should be reverted when caller is not owner or approved`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect( to )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							from.address,
							to.address
						)
					})
					it( `Should be reverted when transfering to non ERC1155Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory(
							"Mock_NonERC1155Receiver"
						)
						const non_holder = await non_holder_artifact.deploy()

						const from = users[ TOKEN_OWNER ]
						const to = non_holder
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"
						await shouldRevertWhenTransferingToNonERC1155ReceiverContract(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract
						)
					})
					it( `Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC1155ReceiverError.None
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							to
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC1155SingleReceiver
						const error = ERC1155ReceiverError.RevertWithError
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							to,
							error
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC1155SingleReceiver
						const error = ERC1155ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							to,
							error
						)
					})
					it( `Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC1155SingleReceiver
						const error = ERC1155ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							to
						)
					})
					it( `Should be reverted when transfering to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC1155SingleReceiver
						const error = ERC1155ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = invalidReceiver
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldRevertWhenERC1155ReceiverRejectsTransfer(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							to,
							error
						)
					})
					it( `To a valid ERC1155Receiver contract`, async function () {
						const retval = INTERFACE_ID.IERC1155SingleReceiver
						const error = ERC1155ReceiverError.None
						const holder_artifact = await ethers.getContractFactory(
							"Mock_ERC1155Receiver"
						)
						const holder = await holder_artifact.deploy( retval, error )

						const from = users[ TOKEN_OWNER ]
						const to = holder
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldEmitTransferSingleEvent(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							from.address,
							from.address,
							to.address,
							id,
							amount
						)

						const owners = [ from.address, to.address ]
						const balanceIds = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( owners, balanceIds )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY - amount )
						expect( res[ 1 ] ).to.equal( amount )
					})
					it( `To other user`, async function () {
						const from = users[ TOKEN_OWNER ]
						const to = users[ OTHER_OWNER ]
						const id = TEST.INIT_SERIES.id_
						const amount = 1
						const data = "0x"

						await shouldEmitTransferSingleEvent(
							contract
								.connect( from )
								.safeTransferFrom( from.address, to.address, id, amount, data ),
							contract,
							from.address,
							from.address,
							to.address,
							id,
							amount
						)

						const owners = [ from.address, to.address ]
						const balanceIds = [ TEST.INIT_SERIES.id_, TEST.INIT_SERIES.id_ ]
						const res = await contract.balanceOfBatch( owners, balanceIds )
						expect( res[ 0 ] ).to.equal( TEST.TOKEN_OWNER_SUPPLY - amount )
						expect( res[ 1 ] ).to.equal( TEST.OTHER_OWNER_SUPPLY + amount )
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
	ERC1155ReceiverError,
	shouldEmitTransferSingleEvent,
	shouldEmitTransferBatchEvent,
	shouldEmitApprovalForAllEvent,
	shouldEmitURIEvent,
	shouldRevertWhenApprovingTokenOwner,
	shouldRevertWhenArrayLengthsDontMatch,
	shouldRevertWhenCallerIsNotApproved,
	shouldRevertWhenERC1155ReceiverRejectsTransfer,
	shouldRevertWhenNewSeriesAlreadyExist,
	shouldRevertWhenRequestedTokenDoesNotExist,
	shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens,
	shouldRevertWhenTransferingToNonERC1155ReceiverContract,
	shouldRevertWhenTransferingToNullAddress,
	shouldBehaveLikeIERC1155AtDeployTime,
	shouldBehaveLikeIERC1155AfterCreatingSeries,
	shouldBehaveLikeIERC1155AfterMint,
}
