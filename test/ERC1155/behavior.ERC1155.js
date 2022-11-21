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
		shouldRevertWhenArrayLengthsDontMatch
	} = require( `../utils/behavior.Arrays` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}

	// Custom ERC721ReceiverError type for testing the transfer to ERC721Receiver (copied from Open Zeppelin)
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
		const interface = new ethers.utils.Interface( [ `event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)` ] )
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
			if ( error == 'custom error' ) {
				await expect( promise )
					.to.be.revertedWithCustomError( receiverContract, `ERC1155ReceiverError` )
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
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
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
}
