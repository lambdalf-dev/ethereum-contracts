const ARTIFACT = require( '../../artifacts/contracts/mocks/utils/Mock_ERC2981Base.sol/Mock_ERC2981Base.json' )
// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( '../test-activation-module' )
	const {
		CST,
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

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( '../fail-test-module' )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( '../utils/behavior.ERC165' )

	const {
		shouldBehaveLikeERC2981Base,
	} = require( '../utils/behavior.ERC2981Base' )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : 'Mock_ERC2981Base',
		METHODS : {
			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setRoyaltyInfo       : {
					SIGNATURE          : 'setRoyaltyInfo(address,uint256)',
					PARAMS             : [ 'recipient_', 'royaltyRate_' ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				royaltyInfo          : {
					SIGNATURE          : 'royaltyInfo(uint256,uint256)',
					PARAMS             : [ 'tokenId_', 'salePrice_' ],
				},
				supportsInterface    : {
					SIGNATURE          : 'supportsInterface(bytes4)',
					PARAMS             : [ 'interfaceId_' ],
				},
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY             = 0
	// TARGET TOKEN
	const FIRST_TOKEN             = 1
	const SECOND_TOKEN            = 2
	const TARGET_TOKEN            = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	const TOKEN_OWNER_SUPPLY      = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY
	const TOKEN_OWNER_FIRST       = FIRST_TOKEN
	const TOKEN_OWNER_LAST        = TOKEN_OWNER_FIRST + TOKEN_OWNER_INIT_SUPPLY - 1
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY      = 1
	const OTHER_OWNER_FIRST       = TOKEN_OWNER_LAST + 1
	const OTHER_OWNER_LAST        = OTHER_OWNER_FIRST + OTHER_OWNER_SUPPLY - 1
	// NON EXISTENT
	const LAST_TOKEN              = FIRST_TOKEN + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY -1
	const UNMINTED_TOKEN          = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY + 10
	// ROYALTIES
	const ROYALTY_BASE            = 10000

	const TEST_DATA = {
		NAME : 'ERC2981Base',
		METHODS : {
			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setRoyaltyInfo    : true,
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				royaltyInfo       : true,
				supportsInterface : true,
			// **************************************
		},
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN                 : INIT_SUPPLY + FIRST_TOKEN,
		SECOND_TOKEN                : INIT_SUPPLY + SECOND_TOKEN,
		TARGET_TOKEN                : INIT_SUPPLY + TARGET_TOKEN,
		UNMINTED_TOKEN              : INIT_SUPPLY + UNMINTED_TOKEN,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY     : TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY     : TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY          : TOKEN_OWNER_SUPPLY,
		TOKEN_OWNER_FIRST           : INIT_SUPPLY + FIRST_TOKEN,
		TOKEN_OWNER_LAST            : INIT_SUPPLY + LAST_TOKEN,
		TOKEN_OWNER_INDEX_SECOND    : FIRST_TOKEN + TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY + 1,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY          : OTHER_OWNER_SUPPLY,
		OTHER_OWNER_FIRST           : INIT_SUPPLY + OTHER_OWNER_FIRST,
		OTHER_OWNER_LAST            : INIT_SUPPLY + OTHER_OWNER_LAST,
		// ROYALTIES
		ROYALTY_BASE                : ROYALTY_BASE,
		// CONSTRUCTOR PARAMETERS
		PARAMS : {
			royaltyRate_ : 1000,
		},
		// INTERFACES
		INTERFACES : [
			'IERC165',
			'IERC2981',
		],
	}

	let test_qty
	let test_contract_params

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function fixture() {
		[
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		const params = [
			test_contract_deployer.address,
			TEST_DATA.PARAMS.royaltyRate_
		]
		let test_contract = await deployContract( test_contract_deployer, ARTIFACT, params )
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
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

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.royaltyInfo.SIGNATURE ] = {
						err  : null,
						args : [
							CONTRACT.TARGET_TOKEN,
							CST.ONE_ETH,
						],
					}
					defaultArgs[ CONTRACT.METHODS.supportsInterface.SIGNATURE ] = {
						err  : null,
						args : [
							INTERFACE_ID.IERC165,
						]
					}
					defaultArgs [ CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE ] = {
						err  : null,
						args : [
							users[ CONTRACT_DEPLOYER ].address,
							test_data.PARAMS.royaltyRate_,
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
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		// testInvalidInputs( fixture, TEST_DATA )
		shouldSupportInterface( fixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE )
		shouldBehaveLikeERC2981Base( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
