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
	async function shouldRevertWhenInvalidMaxSupply ( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `NFT_INVALID_SUPPLY` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenQtyIsZero ( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `NFT_INVALID_QTY` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenQtyOverMaxBatch ( promise, contract, qtyRequested, maxBatch, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `NFT_MAX_BATCH` )
				.withArgs( qtyRequested, maxBatch )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenMintedOut ( promise, contract, qtyRequested, remainingSupply, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `NFT_MAX_SUPPLY` )
				.withArgs( qtyRequested, remainingSupply )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenReserveDepleted ( promise, contract, qtyRequested, reserveLeft, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `NFT_MAX_RESERVE` )
				.withArgs( qtyRequested, reserveLeft )
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
	shouldRevertWhenInvalidMaxSupply,
	shouldRevertWhenQtyIsZero,
	shouldRevertWhenQtyOverMaxBatch,
	shouldRevertWhenMintedOut,
	shouldRevertWhenReserveDepleted,
}
