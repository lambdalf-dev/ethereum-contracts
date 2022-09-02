const ARTIFACT = require( `../../artifacts/contracts/mocks/utils/Mock_IWhitelistable_MerkleMultiple.sol/Mock_IWhitelistable_MerkleMultiple.json` )
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
	const CONTRACT_INTERFACE = {
		NAME : `Mock_IWhitelistable_MerkleMultiple`,
		METHODS : {
			checkWhitelistAllowance : {
				SIGNATURE             : `checkWhitelistAllowance(address,bytes32[],uint256)`,
				PARAMS                : [ `account_`, `proof_`, `whitelistId_` ],
			},
			consumeWhitelist        : {
				SIGNATURE             : `consumeWhitelist(bytes32[],uint256,uint256)`,
				PARAMS                : [ `proof_`, `qty_`, `whitelistId_` ],
			},
			setWhitelist            : {
				SIGNATURE             : `setWhitelist(bytes32,uint256,uint256)`,
				PARAMS                : [ `root_`, `passMax_`, `whitelistId_` ],
			},
		},
	}

	const WHITELIST_AMOUNT_1 = 3
	const WHITELIST_AMOUNT_2 = 1

	const TEST_DATA = {
		NAME : `IWhitelistable_MerkleMultiple`,
		METHODS : {
			checkWhitelistAllowance : true,
			consumeWhitelist        : true,
			setWhitelist            : true,
		},
		WHITELIST_ID_1 : 1,
		WHITELIST_ID_2 : 2,
		WHITELIST_AMOUNT_1 : WHITELIST_AMOUNT_1,
		WHITELIST_AMOUNT_2 : WHITELIST_AMOUNT_2,
		ACCESS_LIST_1 : {
			"0x0010e29271bbca7abfbbbda1bdec668720cca795": WHITELIST_AMOUNT_1,
			"0x001709b366bb85f0fb2cC4eF18833392EBBA5756": WHITELIST_AMOUNT_1,
			"0x003018F3b836e952775C07E9b7BCde83b519a299": WHITELIST_AMOUNT_1,
			"0x00673506c19116893bdffa587d5ef968affe6a99": WHITELIST_AMOUNT_1,
			"0x009E7c27d5e3A1a4eB94b1ffCB258Eea12E17d1a": WHITELIST_AMOUNT_1,
			"0x00a139733aD9A7D6DEb9e5B7E2C6a01122b17747": WHITELIST_AMOUNT_1
		},
		ACCESS_LIST_2 : {
			"0x0010e29271bbca7abfbbbda1bdec668720cca795": WHITELIST_AMOUNT_2,
			"0x001709b366bb85f0fb2cC4eF18833392EBBA5756": WHITELIST_AMOUNT_2,
			"0x003018F3b836e952775C07E9b7BCde83b519a299": WHITELIST_AMOUNT_2,
			"0x00673506c19116893bdffa587d5ef968affe6a99": WHITELIST_AMOUNT_2,
			"0x009E7c27d5e3A1a4eB94b1ffCB258Eea12E17d1a": WHITELIST_AMOUNT_2,
			"0x00a139733aD9A7D6DEb9e5B7E2C6a01122b17747": WHITELIST_AMOUNT_2
		},
	}

	let accesslist = {}
	let merkleTree = { tree: undefined, root: '0x' }
	let passMax
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

		test_accesslist1 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_1 ) )
		test_accesslist1[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_1
		test_accesslist1[ test_user1.address ] = TEST_DATA.WHITELIST_AMOUNT_1

		test_accesslist2 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_2 ) )
		test_accesslist2[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_2
		test_accesslist1[ test_user2.address ] = TEST_DATA.WHITELIST_AMOUNT_2

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_accesslist1,
			test_accesslist2,
		}
	}

	async function access1Fixture () {
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

		test_accesslist1 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_1 ) )
		test_accesslist1[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_1
		test_accesslist1[ test_user1.address ] = TEST_DATA.WHITELIST_AMOUNT_1

		test_accesslist2 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_2 ) )
		test_accesslist2[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_2
		test_accesslist1[ test_user2.address ] = TEST_DATA.WHITELIST_AMOUNT_2

		test_merkleTree1 = generateRoot( test_accesslist1 )
		test_root1       = `0x${ test_merkleTree1.root }`

		await test_contract.connect( test_contract_deployer )
											 .setWhitelist( test_root1, TEST_DATA.WHITELIST_AMOUNT_1, TEST_DATA.WHITELIST_ID_1 )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_accesslist1,
			test_accesslist2,
		}
	}

	async function access2Fixture () {
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

		test_accesslist1 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_1 ) )
		test_accesslist1[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_1
		test_accesslist1[ test_user1.address ] = TEST_DATA.WHITELIST_AMOUNT_1

		test_accesslist2 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_2 ) )
		test_accesslist2[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_2
		test_accesslist1[ test_user2.address ] = TEST_DATA.WHITELIST_AMOUNT_2

		test_merkleTree2 = generateRoot( test_accesslist2 )
		test_root2       = `0x${ test_merkleTree2.root }`

		await test_contract.connect( test_contract_deployer )
											 .setWhitelist( test_root2, TEST_DATA.WHITELIST_AMOUNT_2, TEST_DATA.WHITELIST_ID_2 )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_accesslist1,
			test_accesslist2,
		}
	}

	async function allAccessFixture () {
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

		test_accesslist1 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_1 ) )
		test_accesslist1[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_1
		test_accesslist1[ test_user1.address ] = TEST_DATA.WHITELIST_AMOUNT_1

		test_accesslist2 = JSON.parse( JSON.stringify( TEST_DATA.ACCESS_LIST_2 ) )
		test_accesslist2[ test_token_owner.address ] = TEST_DATA.WHITELIST_AMOUNT_2
		test_accesslist1[ test_user2.address ] = TEST_DATA.WHITELIST_AMOUNT_2

		test_merkleTree1 = generateRoot( test_accesslist1 )
		test_root1       = `0x${ test_merkleTree1.root }`

		await test_contract.connect( test_contract_deployer )
											 .setWhitelist( test_root1, TEST_DATA.WHITELIST_AMOUNT_1, TEST_DATA.WHITELIST_ID_1 )

		test_merkleTree2 = generateRoot( test_accesslist2 )
		test_root2       = `0x${ test_merkleTree2.root }`

		await test_contract.connect( test_contract_deployer )
											 .setWhitelist( test_root2, TEST_DATA.WHITELIST_AMOUNT_2, TEST_DATA.WHITELIST_ID_2 )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			test_accesslist1,
			test_accesslist2,
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
						test_accesslist1,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist     = JSON.parse( JSON.stringify( test_accesslist1 ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer

					const merkleProof = []
					merkleTree = generateRoot( accesslist )
					passMax    = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

					defaultArgs = {}
					defaultArgs [ CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE ] = {
						err  : null,
						args : [
							users[ TOKEN_OWNER ].address,
							merkleProof,
							TEST.WHITELIST_ID_1,
						]
					}
					defaultArgs [ CONTRACT.METHODS.consumeWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
							merkleProof,
							TEST.WHITELIST_AMOUNT_1,
							TEST.WHITELIST_ID_1,
						]
					}
					defaultArgs [ CONTRACT.METHODS.setWhitelist.SIGNATURE ] = {
						err  : null,
						args : [
							`0x${ merkleTree.root }`,
							TEST.WHITELIST_AMOUNT_1,
							TEST.WHITELIST_ID_1,
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

	async function shouldBehaveLikeMock_IWhitelistable_MerkleMultipleBeforeSettingWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_MerkleMultiple before setting whitelist`, function () {
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
						test_accesslist1,
						test_accesslist2,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist1    = JSON.parse( JSON.stringify( test_accesslist1 ) )
					accesslist2    = JSON.parse( JSON.stringify( test_accesslist2 ) )
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
							const account = users[ TOKEN_OWNER ].address
							const merkleProof1 = []
							const merkleProof2 = []

							let merkleTree1 = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree1.tree, users[ TOKEN_OWNER ].address, merkleProof1 )

							await shouldRevertWhenWitelistIsNotSet(
								contract.checkWhitelistAllowance( account, merkleProof1, TEST.WHITELIST_ID_1 ),
								contract
							)

							let merkleTree2 = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree2.tree, users[ TOKEN_OWNER ].address, merkleProof2 )

							await shouldRevertWhenWitelistIsNotSet(
								contract.checkWhitelistAllowance( account, merkleProof2, TEST.WHITELIST_ID_2 ),
								contract
							)
						})
					}
				})

				describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.consumeWhitelist ) {
						it( `Should revert when whitelist is not set`, async function () {
							const account = users[ TOKEN_OWNER ].address
							const merkleProof1 = []
							const merkleProof2 = []

							let merkleTree1 = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree1.tree, users[ TOKEN_OWNER ].address, merkleProof1 )

							await shouldRevertWhenWitelistIsNotSet(
								contract.connect( users[ TOKEN_OWNER ] )
												.consumeWhitelist( merkleProof1, TEST.WHITELIST_AMOUNT_1, TEST.WHITELIST_ID_1 ),
								contract
							)

							let merkleTree2 = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree2.tree, users[ TOKEN_OWNER ].address, merkleProof2 )

							await shouldRevertWhenWitelistIsNotSet(
								contract.connect( users[ TOKEN_OWNER ] )
												.consumeWhitelist( merkleProof2, TEST.WHITELIST_AMOUNT_2, TEST.WHITELIST_ID_2 ),
								contract
							)
						})
					}
				})

				describe( CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.setWhitelist ) {
						it( `Setting up a whitelist`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const root = `0x${ merkleTree.root }`
							// const root = merkleTree.root
							await expect(
								contract.connect( users[ CONTRACT_DEPLOYER ] )
												.setWhitelist( root, passMax, TEST.WHITELIST_ID_1 )
							).to.be.fulfilled
						})
					}
				})
			}
		})
	}

	async function shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSettingWhitelist1 ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_MerkleMultiple after setting whitelist 1`, function () {
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
						test_accesslist1,
						test_accesslist2,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist1    = JSON.parse( JSON.stringify( test_accesslist1 ) )
					accesslist2    = JSON.parse( JSON.stringify( test_accesslist2 ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					if ( TEST.METHODS.checkWhitelistAllowance ) {
						it( `User cannot access with invalid proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ OTHER_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `User cannot access with someone else proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `User cannot access with proof for a different whitelist`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `Whitelisted user can access`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ TOKEN_OWNER ].address
							const proof   = merkleProof
							expect(
								await contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_1 )
							).to.equal( passMax )
						})
					}
				})

				describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.consumeWhitelist ) {
						it( `User cannot access with invalid proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ OTHER_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `User cannot access with someone else proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `User cannot access with proof for a different whitelist`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						it( `Whitelisted user cannot access more than allowed in one transaction`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = TEST.WHITELIST_AMOUNT_1 + 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
								contract,
								account
							)
						})

						describe( `Whitelisted user can access`, function () {
							beforeEach( async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist1 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ TOKEN_OWNER ].address
								const qty     = 1
								const proof   = merkleProof
								await contract.connect( users[ TOKEN_OWNER ] )
															.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 )
							})

							it( `Whitelisted user cannot access more than allowed in several transactions`, async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist1 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ OTHER_OWNER ].address
								const qty     = TEST.WHITELIST_AMOUNT_1
								const proof   = merkleProof
								await shouldRevertWhenNotWhitelisted(
									contract.connect( users[ OTHER_OWNER ] )
													.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
									contract,
									account
								)
							})
						})

						describe( `Whitelisted user consumes their entire whitelist allowance`, function () {
							beforeEach( async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist1 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ TOKEN_OWNER ].address
								const qty     = TEST.WHITELIST_AMOUNT_1
								const proof   = merkleProof
								await contract.connect( users[ TOKEN_OWNER ] )
															.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 )
							})

							it( `Whitelisted user cannot access more after consuming their whitelist allowance`, async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist1 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ TOKEN_OWNER ].address
								const qty     = 1
								const proof   = merkleProof
								await shouldRevertWhenWhitelistIsConsumed(
									contract.connect( users[ TOKEN_OWNER ] )
													.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_1 ),
									contract,
									account
								)
							})
						})
					}
				})
			}
		})
	}

	async function shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSettingWhitelist2 ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_MerkleMultiple after setting whitelist 2`, function () {
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
						test_accesslist1,
						test_accesslist2,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist1    = JSON.parse( JSON.stringify( test_accesslist1 ) )
					accesslist2    = JSON.parse( JSON.stringify( test_accesslist2 ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				describe( CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					if ( TEST.METHODS.checkWhitelistAllowance ) {
						it( `User cannot access with invalid proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ OTHER_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `User cannot access with someone else proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `User cannot access with proof for a different whitelist`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `Whitelisted user can access`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ TOKEN_OWNER ].address
							const proof   = merkleProof
							expect(
								await contract.checkWhitelistAllowance( account, proof, TEST.WHITELIST_ID_2 )
							).to.equal( passMax )
						})
					}
				})

				describe( CONTRACT.METHODS.consumeWhitelist.SIGNATURE, function () {
					if ( TEST.METHODS.consumeWhitelist ) {
						it( `User cannot access with invalid proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ OTHER_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `User cannot access with someone else proof`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `User cannot access with proof for a different whitelist`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist1 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						it( `Whitelisted user cannot access more than allowed in one transaction`, async function () {
							const merkleProof = []
							merkleTree = generateRoot( accesslist2 )
							passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

							const account = users[ OTHER_OWNER ].address
							const qty     = TEST.WHITELIST_AMOUNT_1 + 1
							const proof   = merkleProof
							await shouldRevertWhenNotWhitelisted(
								contract.connect( users[ OTHER_OWNER ] )
												.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 ),
								contract,
								account
							)
						})

						describe( `Whitelisted user can access`, function () {
							beforeEach( async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist2 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ TOKEN_OWNER ].address
								const qty     = 1
								const proof   = merkleProof
								await contract.connect( users[ TOKEN_OWNER ] )
															.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 )
							})

							it( `Whitelisted user cannot access more after consuming their whitelist allowance`, async function () {
								const merkleProof = []
								merkleTree = generateRoot( accesslist2 )
								passMax = getProof ( merkleTree.tree, users[ TOKEN_OWNER ].address, merkleProof )

								const account = users[ TOKEN_OWNER ].address
								const qty     = 1
								const proof   = merkleProof
								await shouldRevertWhenWhitelistIsConsumed(
									contract.connect( users[ TOKEN_OWNER ] )
													.consumeWhitelist( proof, qty, TEST.WHITELIST_ID_2 ),
									contract,
									account
								)
							})
						})
					}
				})
			}
		})
	}

	async function shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSetting2Whitelists ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_IWhitelistable_MerkleMultiple after setting 2 whitelists`, function () {
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
						test_accesslist1,
						test_accesslist2,
					} = await loadFixture( fixture )

					contract       = test_contract
					accesslist1    = JSON.parse( JSON.stringify( test_accesslist1 ) )
					accesslist2    = JSON.parse( JSON.stringify( test_accesslist2 ) )
					users[ USER1             ] = test_user1
					users[ USER2             ] = test_user2
					users[ PROXY_USER        ] = test_proxy_user
					users[ TOKEN_OWNER       ] = test_token_owner
					users[ OTHER_OWNER       ] = test_other_owner
					users[ CONTRACT_DEPLOYER ] = test_contract_deployer
				})

				it( `Whitelisted user can only access the whitelist they are on`, async function () {
					const merkleProof1 = []
					merkleTree1 = generateRoot( accesslist1 )
					passMax = getProof ( merkleTree1.tree, users[ USER1 ].address, merkleProof1 )

					let account = users[ USER1 ].address
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( account, merkleProof1, TEST.WHITELIST_ID_2 ),
						contract,
						account
					)

					const merkleProof2 = []
					merkleTree2 = generateRoot( accesslist2 )
					passMax = getProof ( merkleTree2.tree, users[ USER2 ].address, merkleProof2 )

					account = users[ USER2 ].address
					await shouldRevertWhenNotWhitelisted(
						contract.checkWhitelistAllowance( account, merkleProof2, TEST.WHITELIST_ID_1 ),
						contract,
						account
					)
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
		testInvalidInputs( noAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_MerkleMultipleBeforeSettingWhitelist( noAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSettingWhitelist1( access1Fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSettingWhitelist2( access2Fixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_IWhitelistable_MerkleMultipleAfterSetting2Whitelists( allAccessFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
