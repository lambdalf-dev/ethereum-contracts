// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( '../test-activation-module' )
	const {
		USER1,
		ROYALTY_RECIPIENT,
	} = require( '../test-var-module' )

	const chai = require( 'chai' )
	const chaiAsPromised = require( 'chai-as-promised' )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( '../fail-test-module' )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( '../utils/behavior.ERC165' )

	const {
		shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase,
		shouldBehaveLikeERC2981,
	} = require( '../utils/behavior.ERC2981' )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : 'Mock_ERC2981',
		METHODS : {
			setRoyaltyInfo       : {
				SIGNATURE          : 'setRoyaltyInfo(address,uint256)',
				PARAMS             : [ 'recipient_', 'royaltyRate_' ],
			},
			royaltyInfo          : {
				SIGNATURE          : 'royaltyInfo(uint256,uint256)',
				PARAMS             : [ 'tokenId_', 'salePrice_' ],
			},
		},
	}

	// ROYALTIES
	const ROYALTY_BASE            = 10000

	const TEST_DATA = {
		NAME : 'ERC2981',
		// TARGET
		TARGET_TOKEN                : 5,
		// ROYALTIES
		ROYALTY_BASE                : ROYALTY_BASE,
		DEFAULT_ROYALTY_RATE        : 1000,
		// INTERFACES
		INTERFACES : [
			'IERC165',
			'IERC2981',
		],
	}

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function fixture() {
		[
			test_contract_deployer,
			test_user1,
			test_royalty_recipient,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		const test_contract = await contract_artifact.deploy(
			test_royalty_recipient.address,
			TEST_DATA.DEFAULT_ROYALTY_RATE
		)
		await test_contract.deployed()

		return {
			test_user1,
			test_contract,
			test_royalty_recipient,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function testInvalidInputs ( fixture, TEST, CONTRACT ) {
		describe( 'Invalid inputs', function () {
			if ( TEST_ACTIVATION.INVALID_INPUT ) {
				beforeEach( async function () {
					const {
						test_user1,
						test_contract,
						test_royalty_recipient,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ USER1 ] = test_user1
					users[ ROYALTY_RECIPIENT ] = test_royalty_recipient

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.royaltyInfo.SIGNATURE ] = {
						err  : null,
						args : [
							CONTRACT.TARGET_TOKEN,
							ethers.constants.WeiPerEther,
						],
					}
					defaultArgs [ CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE ] = {
						err  : null,
						args : [
							users[ USER1 ].address,
							TEST.DEFAULT_ROYALTY_RATE,
						],
					}
				})

				Object.entries( CONTRACT.METHODS ).forEach( function( [ prop, val ] ) {
					describe( val.SIGNATURE, function () {
						const testSuite = getTestCasesByFunction( val.SIGNATURE, val.PARAMS )

						testSuite.forEach( testCase => {
							it( testCase.test_description, async function () {
								await generateTestCase( contract, testCase, defaultArgs, prop, val )
							})
						})
					})
				})
			}
		})
	}
	function shouldBehaveLikeMock_ERC2981 ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC2981 ( fixture, TEST, CONTRACT )

		describe( `Should behave like ERC2981`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
			})

			describe( CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE, function () {
				describe( `Updating royalty rate`, function () {
					it( `Setting royalty rate to more than 100% should revert`, async function () {
						const newRoyaltyRecipient = users[ USER1 ].address
						const newRoyaltyRate = TEST.ROYALTY_BASE + 1
						await shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase(
							contract.setRoyaltyInfo( newRoyaltyRecipient, newRoyaltyRate ),
							contract,
							newRoyaltyRate,
							TEST.ROYALTY_BASE
						)

						const tokenId = TEST.TARGET_TOKEN
						const salePrice = ethers.constants.WeiPerEther
						const expectedRecipient = users[ ROYALTY_RECIPIENT ].address
						const expectedRate = salePrice.mul( TEST.DEFAULT_ROYALTY_RATE ).div( TEST.ROYALTY_BASE )

						const royaltyInfo = await contract.royaltyInfo( tokenId, salePrice )
						expect( royaltyInfo ).to.exist
						expect( royaltyInfo[ 0 ] ).to.equal( expectedRecipient )
						expect( royaltyInfo[ 1 ] ).to.equal( expectedRate )
					})
					it( `Royalty info for price 1 ETH should be accurate`, async function () {
						const newRoyaltyRecipient = users[ USER1 ].address
						const newRoyaltyRate = TEST.DEFAULT_ROYALTY_RATE + 1
						await contract.setRoyaltyInfo( newRoyaltyRecipient, newRoyaltyRate )

						const tokenId = TEST.TARGET_TOKEN
						const salePrice = ethers.constants.WeiPerEther
						const expectedRate = salePrice.mul( newRoyaltyRate ).div( TEST.ROYALTY_BASE )

						const royaltyInfo = await contract.royaltyInfo( tokenId, salePrice )
						expect( royaltyInfo ).to.exist
						expect( royaltyInfo[ 0 ] ).to.equal( newRoyaltyRecipient )
						expect( royaltyInfo[ 1 ] ).to.equal( expectedRate )
					})
				})
			})
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		testInvalidInputs( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_ERC2981( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
