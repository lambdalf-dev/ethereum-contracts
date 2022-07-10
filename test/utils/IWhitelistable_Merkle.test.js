const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IWhitelistable_Merkle.sol/Mock_IWhitelistable_Merkle.json` )
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

	const { ethers, waffle } = require( `hardhat` )
	const { loadFixture, deployContract } = waffle

	const { MerkleTree } = require( `merkletreejs` )

	const {
		getTestCasesByFunction,
		generateTestCase
	} = require( `../fail-test-module` )

	const {
		normalize,
		generateRoot,
		getProof,
		shouldRevertWhenWitelistIsNotSet,
		shouldRevertWhenWhitelistIsConsumed,
		shouldRevertWhenNotWhitelisted,
	} = require( `../utils/behavior.IWhitelistable` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract data
	const CONTRACT = {
		NAME : `Mock_IWhitelistable_Merkle`,
		METHODS : {
			checkWhitelistAllowance : {
				SIGNATURE             : `checkWhitelistAllowance(address,bytes32[])`,
				PARAMS                : [ `account_`, `proof_` ],
			},
			consumeWhitelist        : {
				SIGNATURE             : `consumeWhitelist(bytes32[])`,
				PARAMS                : [ `proof_` ],
			},
			setWhitelist            : {
				SIGNATURE             : `setWhitelist(bytes32)`,
				PARAMS                : [ `root_` ],
			},
			isAccountWhitelisted    : {
				SIGNATURE             : `isAccountWhitelisted(address,bytes32[])`,
				PARAMS                : [ `account_`, `proof_` ],
			},
		},
	}

	const TEST_DATA = {
		NAME : `IWhitelistable_Merkle`,
		METHODS : {
			checkWhitelistAllowance : true,
			consumeWhitelist        : true,
			setWhitelist            : true,
			isAccountWhitelisted    : true,
		},
	  ACCESS_LIST        : {
	    "0x0010e29271bbca7abfbbbda1bdec668720cca795": 1,
	    "0x001709b366bb85f0fb2cC4eF18833392EBBA5756": 1,
	    "0x003018F3b836e952775C07E9b7BCde83b519a299": 1,
	    "0x00673506c19116893bdffa587d5ef968affe6a99": 1,
	    "0x009E7c27d5e3A1a4eB94b1ffCB258Eea12E17d1a": 1,
	    "0x00a139733aD9A7D6DEb9e5B7E2C6a01122b17747": 1
	  },
	}

	let accesslist = {}
	let merkleTree = { tree: undefined, root: '0x' }
	let maxPass
	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function fixture () {
		const [
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		test_contract_params = []
		test_contract = await deployContract( test_contract_deployer, ARTIFACT, test_contract_params )
		await test_contract.deployed()

		test_accesslist = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST ) )
		test_accesslist[ test_token_owner.address ] = 1

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_accesslist,
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
						test_accesslist,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist     = JSON.parse( JSON.stringify( test_accesslist ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

					const merkleProof = []
					merkleTree = generateRoot( accesslist )
					maxPass    = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE ] = {
						err  : null,
						args : [
							users[ TOKEN_OWNER ].address,
							merkleProof,
						]
					}
					defaultArgs [ CONTRACT.METHODS.consumeWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
							merkleProof,
						]
					}
					defaultArgs [ CONTRACT.METHODS.setWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
							merkleTree.root,
						]
					}
					defaultArgs [ CONTRACT.METHODS.isAccountWhitelisted.SIGNATURE ] = {
						err  : null,
						args : [
							users[ TOKEN_OWNER ].address,
							merkleProof,
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

	async function shouldBehaveLikeMock_IWhitelistable_Merkle ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_Merkle`, function () {
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
						test_accesslist,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist     = JSON.parse( JSON.stringify( test_accesslist ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					if ( TEST.METHODS.checkWhitelistAllowance ) {
						it( `Should revert when whitelist is not set`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist )
							maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ TOKEN_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenWitelistIsNotSet(
								contract.checkWhitelistAllowance( account, proof )
							)
						})
					}
				})

				describe( CONTRACT.METHODS.isAccountWhitelisted.SIGNATURE, function () {
					if ( TEST.METHODS.isAccountWhitelisted ) {
						it( `Should revert when whitelist is not set`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist )
							maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ TOKEN_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenWitelistIsNotSet(
								contract.isAccountWhitelisted( account, proof )
							)
						})
					}
				})

				describe( CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.setWhitelist ) {
						describe( `Setting up a whitelist`, function () {
							beforeEach( async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist )
								maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const root = `0x${ merkleTree.root }`
								// const root = merkleTree.root
								await expect(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.setWhitelist( root )
								).to.be.fulfilled
							})

							describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
								if ( TEST.METHODS.checkWhitelistAllowance ) {
									it( `${ USER_NAMES[ TOKEN_OWNER ] } is whitelisted`, async function () {
										const merkleProof = []
										merkleTree = generateRoot( accesslist )
										maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

										const account = users[ TOKEN_OWNER ].address
										const proof   = merkleProof
										// console.debug( `Account ${ account }`)
										// console.debug( accesslist )
										// console.debug( proof )
										expect(
											await contract.checkWhitelistAllowance( account, proof )
										).to.equal( maxPass )
									})

									it( `${ USER_NAMES[ OTHER_OWNER ] } is not whitelisted`, async function () {
										const merkleProof = []
										merkleTree = generateRoot( accesslist )
										maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

										const account = users[ OTHER_OWNER ].address
										const proof   = merkleProof
										await shouldRevertWhenNotWhitelisted(
											contract.checkWhitelistAllowance( account, proof ),
											account
										)
									})
								}
							})

							describe( CONTRACT.METHODS.isAccountWhitelisted.SIGNATURE, function () {
								if ( TEST.METHODS.isAccountWhitelisted ) {
									it( `Should revert when whitelist is not set`, async function () {
										const merkleProof = []
										merkleTree = generateRoot( accesslist )
										maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

										const account = users[ TOKEN_OWNER ].address
										const proof   = merkleProof
										expect(
											await contract.isAccountWhitelisted( account, proof )
										).to.be.true
									})
								}
							})

							describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
								if ( TEST.METHODS.consumeWhitelist ) {
									it( `${ USER_NAMES[ TOKEN_OWNER ] } consumes their whitelist allowance`, async function () {
										const merkleProof = []
										merkleTree = generateRoot( accesslist )
										maxPass = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

										const account = users[ TOKEN_OWNER ].address
										const proof   = merkleProof

										await contract.connect( users[ TOKEN_OWNER ] )
																	.consumeWhitelist( proof )

										await shouldRevertWhenWhitelistIsConsumed(
											contract.checkWhitelistAllowance( account, proof ),
											account
										)

										await shouldRevertWhenWhitelistIsConsumed(
											contract.isAccountWhitelisted( account, proof ),
											account
										)
									})
								}
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
		testInvalidInputs( fixture, TEST_DATA, CONTRACT )
		shouldBehaveLikeMock_IWhitelistable_Merkle( fixture, TEST_DATA, CONTRACT )
	}
})
