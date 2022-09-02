const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IWhitelistable_ECDSA.sol/Mock_IWhitelistable_ECDSA.json` )
// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
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

	const { ethers } = require( `hardhat` )
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

	const { MerkleTree } = require( `merkletreejs` )

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
	} = require( `../utils/behavior.IWhitelistable` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT_INTERFACE = {
		NAME : `Mock_IWhitelistable_ECDSA`,
		METHODS : {
			checkWhitelistAllowance : {
				SIGNATURE             : `checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))`,
				PARAMS                : [ `account_`, `whitelistType_`, `alloted_`, `proof_` ],
			},
			consumeWhitelist        : {
				SIGNATURE             : `consumeWhitelist(uint8,uint256,tuple(bytes32,bytes32,uint8),uint256)`,
				PARAMS                : [ `alloted_`, `proof_`, `qty_` ],
			},
			setWhitelist            : {
				SIGNATURE             : `setWhitelist(address)`,
				PARAMS                : [ `adminSigner_` ],
			},
		},
	}

	const WHITELIST_AMOUNT_1 = 3
	const WHITELIST_AMOUNT_2 = 1

	const TEST_DATA = {
		NAME : `IWhitelistable_ECDSA`,
		METHODS : {
			checkWhitelistAllowance : true,
			consumeWhitelist        : true,
			setWhitelist            : true,
		},
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
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		// test_contract_params = []
		// test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
		await test_contract.deployed()

		test_signer_wallet = getSignerWallet()
		test_fake_signer   = getSignerWallet()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_signer_wallet,
			test_fake_signer,
		}
	}

	async function accessFixture () {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
		// test_contract_params = []
		// test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
		await test_contract.deployed()

		test_signer_wallet = getSignerWallet()
		test_fake_signer   = getSignerWallet()

		await test_contract.connect( test_contract_deployer )
											 .setWhitelist( test_signer_wallet.address )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_signer_wallet,
			test_fake_signer,
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
						test_signer_wallet,
						test_fake_signer,
					} = await loadFixture( fixture )

					contract       = test_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
					users[ 'SIGNER_WALLET'   ] = test_signer_wallet
					users[ 'FAKE_SIGNER'     ] = test_fake_signer

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

	async function shouldBehaveLikeMock_IWhitelistable_ECDSABeforeSettingWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_ECDSA before setting whitelist`, function () {
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
						test_signer_wallet,
						test_fake_signer,
					} = await loadFixture( fixture )

					contract       = test_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
					users[ 'SIGNER_WALLET'   ] = test_signer_wallet
					users[ 'FAKE_SIGNER'     ] = test_fake_signer
				})

				describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					if ( TEST.METHODS.checkWhitelistAllowance ) {
						it( `Should revert when whitelist is not set`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenWitelistIsNotSet(
								contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
								contract
							)
						})
					}
				})

				describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.consumeWhitelist ) {
						it( `Should revert when whitelist is not set`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const qty           = 1
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenWitelistIsNotSet(
								contract.connect( account )
												.consumeWhitelist( whitelistType, alloted, proof, qty ),
								contract
							)
						})
					}
				})

				describe( CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.setWhitelist ) {
						it( `Setting up a whitelist`, async function () {
							await expect(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.setWhitelist( users[ 'SIGNER_WALLET' ].address )
							).to.be.fulfilled
						})
					}
				})
			}
		})
	}

	async function shouldBehaveLikeMock_IWhitelistable_ECDSAAfterSettingWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_ECDSA after setting whitelist`, function () {
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
						test_signer_wallet,
						test_fake_signer,
					} = await loadFixture( fixture )

					contract       = test_contract
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
					users[ 'SIGNER_WALLET'   ] = test_signer_wallet
					users[ 'FAKE_SIGNER'     ] = test_fake_signer
				})

				describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					if ( TEST.METHODS.checkWhitelistAllowance ) {
						it( `User cannot access with someone else's proof`, async function () {
							const account       = users[ OTHER_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
								contract,
								account.address
							)
						})

						it( `User cannot forge their own proof`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'FAKE_SIGNER' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
								contract,
								account.address
							)
						})

						it( `Whitelisted user cannot access a different whitelist`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_2

							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
								contract,
								account.address
							)
						})

						it( `Whitelisted user cannot access more than they are alloted`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1 + 1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof ),
								contract,
								account.address
							)
						})

						it( `Whitelisted user can access`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const whitelistType = TEST.WHITELIST_TYPE_1

							expect(
								await contract.checkWhitelistAllowance( account.address, whitelistType, alloted, proof )
							).to.equal( alloted )
						})
					}
				})

				describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.consumeWhitelist ) {
						it( `User cannot access with someone else's proof`, async function () {
							const account       = users[ OTHER_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const qty           = 1
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.connect( account )
												.consumeWhitelist( whitelistType, alloted, proof, qty ),
								contract,
								account.address
							)
						})

						it( `User cannot forge their own proof`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'FAKE_SIGNER' ] )
							)
							const qty           = 1
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.connect( account )
												.consumeWhitelist( whitelistType, alloted, proof, qty ),
								contract,
								account.address
							)
						})

						it( `User cannot access a different whitelist`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const qty           = 1
							const whitelistType = TEST.WHITELIST_TYPE_2

							await shouldRevertWhenNotWhitelisted(
								contract.connect( account )
												.consumeWhitelist( whitelistType, alloted, proof, qty ),
								contract,
								account.address
							)
						})

						it( `Whitelisted user cannot access more than they are alloted`, async function () {
							const account       = users[ TOKEN_OWNER ]
							const hashBuffer    = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
							)
							const alloted       = TEST.WHITELIST_AMOUNT_1
							const proof         = serializeProof(
								createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
							)
							const qty           = 1 + TEST.WHITELIST_AMOUNT_1
							const whitelistType = TEST.WHITELIST_TYPE_1

							await shouldRevertWhenNotWhitelisted(
								contract.connect( account )
												.consumeWhitelist( whitelistType, alloted, proof, qty ),
								contract,
								account.address
							)
						})

						describe( `Whitelisted user can access`, function () {
							beforeEach( async function () {
								const account       = users[ TOKEN_OWNER ]
								const hashBuffer    = generateHashBuffer(
									[ 'uint8', 'uint256', 'address' ],
									[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
								)
								const alloted       = TEST.WHITELIST_AMOUNT_1
								const proof         = serializeProof(
									createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
								)
								const qty           = 1
								const whitelistType = TEST.WHITELIST_TYPE_1

								await contract.connect( account )
															.consumeWhitelist( whitelistType, alloted, proof, qty )
							})

							it( `Whitelisted user cannot access more than alloted in several transactions`, async function () {
								const account       = users[ TOKEN_OWNER ]
								const hashBuffer    = generateHashBuffer(
									[ 'uint8', 'uint256', 'address' ],
									[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
								)
								const alloted       = TEST.WHITELIST_AMOUNT_1
								const proof         = serializeProof(
									createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
								)
								const qty           = TEST.WHITELIST_AMOUNT_1
								const whitelistType = TEST.WHITELIST_TYPE_1

								await shouldRevertWhenNotWhitelisted(
									contract.connect( account )
													.consumeWhitelist( whitelistType, alloted, proof, qty ),
									contract,
									account.address
								)
							})
						})

						describe( `Whitelisted user consumes their entire whitelist allowance`, function () {
							beforeEach( async function () {
								const account       = users[ TOKEN_OWNER ]
								const hashBuffer    = generateHashBuffer(
									[ 'uint8', 'uint256', 'address' ],
									[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
								)
								const alloted       = TEST.WHITELIST_AMOUNT_1
								const proof         = serializeProof(
									createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
								)
								const qty           = TEST.WHITELIST_AMOUNT_1
								const whitelistType = TEST.WHITELIST_TYPE_1

								await contract.connect( account )
															.consumeWhitelist( whitelistType, alloted, proof, qty )
							})

							it( `Whitelisted user cannot access more after consuming their whitelist allowance`, async function () {
								const account       = users[ TOKEN_OWNER ]
								const hashBuffer    = generateHashBuffer(
									[ 'uint8', 'uint256', 'address' ],
									[ TEST.WHITELIST_TYPE_1, TEST.WHITELIST_AMOUNT_1, users[ TOKEN_OWNER ].address ]
								)
								const alloted       = TEST.WHITELIST_AMOUNT_1
								const proof         = serializeProof(
									createProof( hashBuffer, users[ 'SIGNER_WALLET' ] )
								)
								const qty           = 1
								const whitelistType = TEST.WHITELIST_TYPE_1

								await shouldRevertWhenWhitelistIsConsumed(
									contract.connect( account )
													.consumeWhitelist( whitelistType, alloted, proof, qty ),
									contract,
									account.address
								)
							})
						})
					}
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
		// testInvalidInputs( noAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_ECDSABeforeSettingWhitelist( noAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_ECDSAAfterSettingWhitelist( accessFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
