// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require(`chai`)
	const chaiAsPromised = require(`chai-as-promised`)
	chai.use(chaiAsPromised)
	const expect = chai.expect
	const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
	const {ethers} = require(`hardhat`)
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
	// Events
	async function shouldEmitContractStateChangedEvent (promise, contract, previousState, newState) {
		await expect(promise)
			.to.emit(contract, `ContractStateChanged`)
			.withArgs(previousState, newState)
	}

	// Errors
	async function shouldRevertWhenArrayLengthsDontMatch (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `ARRAY_LENGTH_MISMATCH`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenContractStateIsIncorrect (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `CONTRACT_STATE_INCORRECT`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenContractStateIsInvalid (promise, contract) {
		await expect(promise)
			.to.be.reverted
	}
	async function shouldRevertWhenIncorrectAmountPaid (promise, contract, amountReceived, amountExpected, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `ETHER_INCORRECT_PRICE`)
				.withArgs(amountReceived, amountExpected)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenContractHasNoBalance (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `ETHER_NO_BALANCE`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenEtherTransferFails (promise, contract, to, amount, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `ETHER_TRANSFER_FAIL`)
				.withArgs(to, amount)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenQtyIsZero (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_INVALID_QTY`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenInvalidReserve (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_INVALID_RESERVE`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenInvalidMaxSupply (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_INVALID_SUPPLY`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenQtyOverMaxBatch (promise, contract, qtyRequested, maxBatch, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_MAX_BATCH`)
				.withArgs(qtyRequested, maxBatch)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenReserveDepleted (promise, contract, qtyRequested, reserveLeft, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_MAX_RESERVE`)
				.withArgs(qtyRequested, reserveLeft)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenMintedOut (promise, contract, qtyRequested, remainingSupply, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `NFT_MINTED_OUT`)
				.withArgs(qtyRequested, remainingSupply)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenFunctionDoesNotExist (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `UNKNOWN`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldEmitContractStateChangedEvent,
	shouldRevertWhenArrayLengthsDontMatch,
	shouldRevertWhenContractStateIsIncorrect,
	shouldRevertWhenContractStateIsInvalid,
	shouldRevertWhenIncorrectAmountPaid,
	shouldRevertWhenContractHasNoBalance,
	shouldRevertWhenEtherTransferFails,
	shouldRevertWhenQtyIsZero,
	shouldRevertWhenInvalidReserve,
	shouldRevertWhenInvalidMaxSupply,
	shouldRevertWhenQtyOverMaxBatch,
	shouldRevertWhenReserveDepleted,
	shouldRevertWhenMintedOut,
	shouldRevertWhenFunctionDoesNotExist,
}
