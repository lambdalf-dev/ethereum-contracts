// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( '../test-activation-module' )
	const {
		THROW,
		ERROR,
		USER1,
		USER2,
		USER_NAMES,
		PROXY_USER,
		TOKEN_OWNER,
		OTHER_OWNER,
		CONTRACT_DEPLOYER,
	} = require( '../test-var-module' )

	const chai = require( 'chai' )
	const chaiAsPromised = require( 'chai-as-promised' )
	chai.use( chaiAsPromised )
	const expect = chai.expect

	const { ethers, waffle } = require( 'hardhat' )
	const { loadFixture, deployContract } = waffle
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// INTERFACE ID
	const INTERFACE_ID = {
		IERC1155               : '0xd9b67a26',
		IERC1155MetadataURI    : '0x0e89341c',
		IERC1155SingleReceiver : '0xf23a6e61',
		IERC1155BatchReceiver  : '0xbc197c81',
		IERC165                : '0x01ffc9a7',
		IERC2981               : '0x2a55205a',
		IERC721                : '0x80ac58cd',
		IERC721Metadata        : '0x5b5e139f',
		IERC721Enumerable      : '0x780e9d63',
		IERC721Receiver        : '0x150b7a02',
		INVALID                : '0xffffffff',
		NULL                   : '0x00000000',
	}

	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldSupportInterface ( fixture, interfaces ) {
		describe( `supportsInterface(bytes4)`, function () {
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

				it( 'Contract should not support invalid interface ID', async function () {
					const interfaceId = INTERFACE_ID.INVALID
					expect(
						await contract.supportsInterface( interfaceId )
					).to.be.false
				})

				it( 'Contract should not support zero interface ID', async function () {
					const interfaceId = INTERFACE_ID.NULL
					expect(
						await contract.supportsInterface( interfaceId )
					).to.be.false
				})

				interfaces.forEach( async function( interface ) {
					it( 'Contract should support ' + interface, async function () {
						const interfaceId = INTERFACE_ID[ interface ]
						expect(
							await contract.supportsInterface( interfaceId )
						).to.be.true
					})
				})
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	INTERFACE_ID,
	shouldSupportInterface,
}
