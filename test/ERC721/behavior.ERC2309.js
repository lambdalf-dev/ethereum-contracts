// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { ethers } = require( `hardhat` )
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	async function shouldEmitConsecutiveTransferEvent ( promise, contract, fromTokenId, toTokenId, fromAddress, toAddress, logNumber = 0 ) {
		const tx = await promise
		const receipt = await ethers.provider.getTransactionReceipt( tx.hash )
		const interface = new ethers.utils.Interface( [ `event ConsecutiveTransfer(uint256 indexed fromTokenId, uint256 toTokenId, address indexed fromAddress, address indexed toAddress)` ] )
		const data = receipt.logs[ logNumber ].data
		const topics = receipt.logs[ logNumber ].topics
		const event = interface.decodeEventLog( `ConsecutiveTransfer`, data, topics )
		expect( event.fromTokenId.toString() ).to.equal( fromTokenId.toString() )
		expect( event.toTokenId.toString() ).to.equal( toTokenId.toString() )
		expect( event.fromAddress ).to.equal( fromAddress )
		expect( event.toAddress ).to.equal( toAddress )
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldEmitConsecutiveTransferEvent,
}
