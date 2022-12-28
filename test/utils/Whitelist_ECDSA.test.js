// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		TOKEN_OWNER,
		OTHER_OWNER,
		FAKE_SIGNER,
		SIGNER_WALLET,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )

	const {
		normalize,
		getSignerWallet,
		createProof,
		generateHashBuffer,
		serializeProof,
		shouldRevertWhenWitelistIsNotSet,
		shouldRevertWhenWhitelistIsConsumed,
		shouldRevertWhenNotWhitelisted,
	} = require( `../utils/behavior.Whitelist` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_Whitelist_ECDSA`,
		METHODS : {
			checkWhitelistAllowance : {
				SIGNATURE : `checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))`,
				PARAMS    : [ `account_`, `whitelistType_`, `alloted_`, `proof_` ],
			},
			consumeWhitelist : {
				SIGNATURE : `consumeWhitelist(uint8,uint256,tuple(bytes32,bytes32,uint8),uint256)`,
				PARAMS    : [ `alloted_`, `proof_`, `qty_` ],
			},
			setWhitelist : {
				SIGNATURE : `setWhitelist(address)`,
				PARAMS    : [ `adminSigner_` ],
			},
		},
	}

	const WHITELIST_AMOUNT_1 = 3
	const WHITELIST_AMOUNT_2 = 1

	const TEST_DATA = {
		NAME : `Whitelist_ECDSA`,
		WHITELIST_AMOUNT_1 : WHITELIST_AMOUNT_1,
		WHITELIST_AMOUNT_2 : WHITELIST_AMOUNT_2,
		WHITELIST_TYPE_1 : 1,
		WHITELIST_TYPE_2 : 2,
	}

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function noAccessFixture () {
		const [
			test_contract_deployer,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		test_signer_wallet = getSignerWallet()
		test_fake_signer   = getSignerWallet()

		return {
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
		}
	}
	async function accessFixture () {
		const {
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
		} = await loadFixture( noAccessFixture )

		await test_contract.setWhitelist( test_signer_wallet.address )

		return {
			test_contract,
			test_token_owner,
			test_other_owner,
			test_fake_signer,
			test_signer_wallet,
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
						test_contract,
						test_token_owner,
						test_other_owner,
						test_fake_signer,
						test_signer_wallet,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ TOKEN_OWNER ] = test_token_owner
					users[ OTHER_OWNER ] = test_other_owner
					users[ FAKE_SIGNER ] = test_fake_signer
					users[ SIGNER_WALLET ] = test_signer_wallet

					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE ] = {
						err  : null,
						args : [
							users[ TOKEN_OWNER ].address,
						]
					}
					defaultArgs [ CONTRACT.METHODS.consumeWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
						]
					}
					defaultArgs [ CONTRACT.METHODS.setWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
						]
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
	async function shouldBehaveLikeMock_Whitelist_ECDSABeforeSettingWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_Whitelist_ECDSA before setting whitelist`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
			})

			describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
				it( `Should revert when whitelist is not set`, async function () {
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenWitelistIsNotSet(
						contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
						contract
					)
				})
			})
			describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
				it( `Should revert when whitelist is not set`, async function () {
          const qty = TEST.WHITELIST_AMOUNT_1
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenWitelistIsNotSet(
						contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty ),
						contract
					)
				})
			})
			describe( CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
				it( `Setting up a whitelist`, async function () {
					await expect(
						contract.setWhitelist( users[ SIGNER_WALLET ].address )
					).to.be.fulfilled
				})
			})
		})
	}
	async function shouldBehaveLikeMock_Whitelist_ECDSAAfterSettingWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_Whitelist_ECDSA after setting whitelist`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
			})

			describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
				it( `User cannot access with someone else's proof`, async function () {
          const operator = users[ OTHER_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( operator.address, whitelistType, alloted, proof ),
						contract,
						operator.address
					)
				})
				it( `User cannot forge their own proof`, async function () {
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ FAKE_SIGNER ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
						contract,
						account.address
					)
				})
				it( `Whitelisted user cannot access a different whitelist`, async function () {
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_2
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
						contract,
						account.address
					)
				})
				it( `Whitelisted user cannot access more than they are alloted`, async function () {
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1 + 1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
						contract,
						account.address
					)
				})
				it( `Whitelisted user can access`, async function () {
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					expect(
						await contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof )
					).to.equal( alloted )
				})
			})
			describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
				it( `User cannot access with someone else's proof`, async function () {
          const qty = TEST.WHITELIST_AMOUNT_1
          const operator = users[ OTHER_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty ),
						contract,
						operator.address
					)
				})
				it( `User cannot forge their own proof`, async function () {
					const qty = 1
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ FAKE_SIGNER ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty ),
						contract,
						account.address
					)
				})
				it( `User cannot access a different whitelist`, async function () {
					const qty = 1
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1
					const whitelistType = TEST.WHITELIST_TYPE_2
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty ),
						contract,
						account.address
					)
				})
				it( `Whitelisted user cannot access more than they are alloted`, async function () {
					const qty = TEST.WHITELIST_AMOUNT_1 + 1
          const operator = users[ TOKEN_OWNER ]
          const account = users[ TOKEN_OWNER ]
					const alloted = TEST.WHITELIST_AMOUNT_1 + 1
					const whitelistType = TEST.WHITELIST_TYPE_1
					const hashBuffer = generateHashBuffer(
						[ 'uint8', 'uint256', 'address' ],
						[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
					)
          const proof = serializeProof(
            createProof( hashBuffer, users[ SIGNER_WALLET ] )
          )
					await shouldRevertWhenNotWhitelisted(
						contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty ),
						contract,
						account.address
					)
				})
				describe( `Whitelisted user can access`, function () {
					beforeEach( async function () {
						const qty = 1
            const operator = users[ TOKEN_OWNER ]
            const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT_1
						const whitelistType = TEST.WHITELIST_TYPE_1
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
						)
            const proof = serializeProof(
              createProof( hashBuffer, users[ SIGNER_WALLET ] )
            )
						await contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty )
					})
					it( `Whitelisted user cannot access more than alloted in several transactions`, async function () {
						const qty = TEST.WHITELIST_AMOUNT_1
            const operator = users[ TOKEN_OWNER ]
            const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT_1
						const whitelistType = TEST.WHITELIST_TYPE_1
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
						)
            const proof = serializeProof(
              createProof( hashBuffer, users[ SIGNER_WALLET ] )
            )
						await shouldRevertWhenNotWhitelisted(
							contract
								.connect( operator )
								.consumeWhitelist( whitelistType, alloted, proof, qty ),
							contract,
							account.address
						)
					})
				})
				describe( `Whitelisted user consumes their entire whitelist allowance`, function () {
					beforeEach( async function () {
						const qty = TEST.WHITELIST_AMOUNT_1
            const operator = users[ TOKEN_OWNER ]
            const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT_1
						const whitelistType = TEST.WHITELIST_TYPE_1
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
						)
            const proof = serializeProof(
              createProof( hashBuffer, users[ SIGNER_WALLET ] )
            )
						await contract
							.connect( operator )
							.consumeWhitelist( whitelistType, alloted, proof, qty )
					})
					it( `Whitelisted user cannot access more after consuming their whitelist allowance`, async function () {
						const qty = 1
            const operator = users[ TOKEN_OWNER ]
            const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT_1
						const whitelistType = TEST.WHITELIST_TYPE_1
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
						)
            const proof = serializeProof(
              createProof( hashBuffer, users[ SIGNER_WALLET ] )
            )
						await shouldRevertWhenWhitelistIsConsumed(
							contract
								.connect( operator )
								.consumeWhitelist( whitelistType, alloted, proof, qty ),
							contract,
							account.address
						)
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
		shouldBehaveLikeMock_Whitelist_ECDSABeforeSettingWhitelist( noAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_Whitelist_ECDSAAfterSettingWhitelist( accessFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
