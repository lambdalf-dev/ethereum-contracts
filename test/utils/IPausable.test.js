const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IPausable.sol/Mock_IPausable.json` )
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

	const {
		SALE_STATE,
		shouldBehaveLikeIPausable,
		shouldEmitSaleStateChangedEvent,
		shouldRevertWhenSaleStateIsNotClose,
		shouldRevertWhenSaleStateIsNotPreSale,
		shouldRevertWhenSaleStateIsNotSale,
	} = require( `../utils/behavior.IPausable` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_IPausable`,
		METHODS : {
			saleState            : {
				SIGNATURE          : `saleState()`,
				PARAMS             : [],
			},
			setSaleState         : {
				SIGNATURE          : `setSaleState(uint8)`,
				PARAMS             : [ `newState_` ],
			},
			saleIsClosed         : {
				SIGNATURE          : `saleIsClosed()`,
				PARAMS             : [],
			},
			presaleIsOpen        : {
				SIGNATURE          : `presaleIsOpen()`,
				PARAMS             : [],
			},
			saleIsOpen           : {
				SIGNATURE          : `saleIsOpen()`,
				PARAMS             : [],
			},
		},
	}

	const TEST_DATA = {
		NAME : `IPausable`,
		EVENTS : {
			SaleStateChanged : true,
		},
		METHODS : {
			saleState     : true,
			setSaleState  : true,
			saleIsClosed  : true,
			presaleIsOpen : true,
			saleIsOpen    : true,
		},
	}

	let test_contract_params

	let contract
	let users = {}
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

		test_contract_params = []
		let test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
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
		describe( `Invalid inputs`, function () {
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
					defaultArgs [ CONTRACT.METHODS.saleState.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.setSaleState.SIGNATURE ] = {
						err  : null,
						args : [
							SALE_STATE.SALE,
						],
					}
					defaultArgs [ CONTRACT.METHODS.saleIsClosed.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.presaleIsOpen.SIGNATURE ] = {
						err  : null,
						args : [],
					}
					defaultArgs [ CONTRACT.METHODS.saleIsOpen.SIGNATURE ] = {
						err  : null,
						args : [],
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

	function shouldBehaveLikeMock_IPausable ( fixture, TEST, CONTRACT ) {
		if ( TEST_ACTIVATION.CORRECT_INPUT ) {
			beforeEach( async function () {
				const {
					test_contract,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			describe( `Initial state: CLOSED`, function () {
				it( `saleIsClosed() should be fulfilled when sale state is CLOSED`, async function () {
					expect(
						await contract.saleIsClosed()
					).to.be.true
				})

				it( `presaleIsOpen() should be reverted when sale state is CLOSED`, async function () {
					await shouldRevertWhenSaleStateIsNotPreSale(
						contract.presaleIsOpen()
					)
				})

				it( `saleIsOpen() should be reverted when sale state is CLOSED`, async function () {
					await shouldRevertWhenSaleStateIsNotSale(
						contract.saleIsOpen()
					)
				})
			})

			describe( `Switch state: PRESALE`, function () {
				beforeEach( async function () {
					const previousState = SALE_STATE.CLOSE
					const newState      = SALE_STATE.PRESALE
					await shouldEmitSaleStateChangedEvent(
						contract.connect( users[ CONTRACT_DEPLOYER ] )
										.setSaleState( newState ),
						contract,
						previousState,
						newState
					)
				})

				it( `saleIsClosed() should be reverted when sale state is PRESALE`, async function () {
					await shouldRevertWhenSaleStateIsNotClose(
						contract.saleIsClosed()
					)
				})

				it( `presaleIsOpen() should be fulfilled when sale state is PRESALE`, async function () {
					expect(
						await contract.presaleIsOpen()
					).to.be.true
				})

				it( `saleIsOpen() should be reverted when sale state is PRESALE`, async function () {
					await shouldRevertWhenSaleStateIsNotSale(
						contract.saleIsOpen()
					)
				})
			})

			describe( `Switch state: SALE`, function () {
				beforeEach( async function () {
					const previousState = SALE_STATE.CLOSE
					const newState      = SALE_STATE.SALE
					await shouldEmitSaleStateChangedEvent(
						contract.connect( users[ CONTRACT_DEPLOYER ] )
										.setSaleState( newState ),
						contract,
						previousState,
						newState
					)
				})

				it( `saleIsClosed() should be reverted when sale state is SALE`, async function () {
					await shouldRevertWhenSaleStateIsNotClose(
						contract.saleIsClosed()
					)
				})

				it( `presaleIsOpen() should be reverted when sale state is SALE`, async function () {
					await shouldRevertWhenSaleStateIsNotPreSale(
						contract.presaleIsOpen()
					)
				})

				it( `saleIsOpen() should be fulfilled when sale state is SALE`, async function () {
					expect(
						await contract.saleIsOpen()
					).to.be.true
				})
			})
		}
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		testInvalidInputs( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeIPausable( fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IPausable( fixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
