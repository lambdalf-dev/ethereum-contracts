// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// Errors
	async function shouldRevertWhenEtherTransferFails ( promise, contract, to, amount, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `ETHER_TRANSFER_FAIL` )
				.withArgs( to, amount )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenIncorrectAmountPaid ( promise, contract, amountReceived, amountExpected, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `ETHER_INCORRECT_PRICE` )
				.withArgs( amountReceived, amountExpected )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenContractHasNoBalance ( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `ETHER_NO_BALANCE` )
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
	shouldRevertWhenEtherTransferFails,
	shouldRevertWhenIncorrectAmountPaid,
	shouldRevertWhenContractHasNoBalance,
}
