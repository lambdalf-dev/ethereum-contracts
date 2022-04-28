// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		CST,
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
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	async function shouldEmitConsecutiveTransferEvent ( promise, contract, fromTokenId, toTokenId, fromAddress, toAddress ) {
		await expect( promise ).to.emit( contract, `ConsecutiveTransfer` ).withArgs( fromTokenId, toTokenId, fromAddress, toAddress )
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldEmitConsecutiveTransferEvent,
}
