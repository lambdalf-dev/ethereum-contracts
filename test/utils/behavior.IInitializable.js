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
	async function shouldRevertWhenAlreadyInitialized ( promise, error = `IInitializable_ALREADY_INITIALIZED` ) {
		await expect( promise ).to.be.revertedWith( `${ error }()` )
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldRevertWhenAlreadyInitialized,
}
