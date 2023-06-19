// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require('chai')
	const chaiAsPromised = require('chai-as-promised')
	chai.use(chaiAsPromised)
	const expect = chai.expect
	const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
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
		IERC173                : '0x7f5828d0',
		IERC2981               : '0x2a55205a',
		IERC721                : '0x80ac58cd',
		IERC721Metadata        : '0x5b5e139f',
		IERC721Enumerable      : '0x780e9d63',
		IERC721Receiver        : '0x150b7a02',
		INVALID                : '0xffffffff',
		NULL                   : '0x00000000',
	}
	let contract
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldSupportInterface (fixture, interfaces) {
		describe(`supportsInterface(bytes4)`, function () {
			beforeEach(async function () {
				const {
					test_contract,
				} = await loadFixture(fixture)

				contract = test_contract
			})
			it('Contract should not support invalid interface ID', async function () {
				const interfaceId = INTERFACE_ID.INVALID
				expect(
					await contract.supportsInterface(interfaceId)
				).to.be.false
			})
			it('Contract should not support zero interface ID', async function () {
				const interfaceId = INTERFACE_ID.NULL
				expect(
					await contract.supportsInterface(interfaceId)
				).to.be.false
			})
			interfaces.forEach(async function(interface) {
				it('Contract should support ' + interface, async function () {
					const interfaceId = INTERFACE_ID[ interface ]
					expect(
						await contract.supportsInterface(interfaceId)
					).to.be.true
				})
			})
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
