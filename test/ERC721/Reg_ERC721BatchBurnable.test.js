const ARTIFACT = require( `../../artifacts/contracts/mocks/tokens/Mock_Reg_ERC721BatchBurnable.sol/Mock_Reg_ERC721BatchBurnable.json` )
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
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( '../utils/behavior.ERC165' )

	const {
		ERC721ReceiverError,
		HOLDER_ARTIFACT,
		NON_HOLDER_ARTIFACT,
		shouldEmitTransferEvent,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenTransferingToNonERC721Receiver,
		shouldRevertWhenTransferingToNullAddress,
		shouldBehaveLikeERC721BatchBeforeMint,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require( `../ERC721/behavior.ERC721Batch` )

	const {
		shouldBehaveLikeERC721BatchMetadata,
	} = require( `../ERC721/behavior.ERC721BatchMetadata` )

	const {
		shouldBehaveLikeERC721BatchEnumerableBeforeMint,
		shouldBehaveLikeERC721BatchEnumerableAfterMint,
	} = require( `../ERC721/behavior.ERC721BatchEnumerable` )

	const {
		shouldBehaveLikeERC721BatchBurnableBeforeBurn,
		shouldBehaveLikeERC721BatchBurnableAfterBurn,
	} = require( `../ERC721/behavior.ERC721BatchBurnable` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME : `Mock_Reg_ERC721BatchBurnable`,
		ERRORS : {
			IERC721_APPROVE_OWNER                       : `IERC721_APPROVE_OWNER`,
			IERC721_CALLER_NOT_APPROVED                 : `IERC721_CALLER_NOT_APPROVED`,
			IERC721_INVALID_APPROVAL_FOR_ALL            : `IERC721_INVALID_APPROVAL_FOR_ALL`,
			IERC721_INVALID_TRANSFER                    : `IERC721_INVALID_TRANSFER`,
			IERC721_NONEXISTANT_TOKEN                   : `IERC721_NONEXISTANT_TOKEN`,
			IERC721_NON_ERC721_RECEIVER                 : `IERC721_NON_ERC721_RECEIVER`,
			IERC721Enumerable_INDEX_OUT_OF_BOUNDS       : `IERC721Enumerable_INDEX_OUT_OF_BOUNDS`,
			IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS : `IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS`,
			ERC721Receiver_PANIC                        : `panic code`,
			ERC721Receiver_ERROR                        : `custom error`,
			ERC721Receiver_MESSAGE                      : `Mock_ERC721Receiver: reverting`,
		},
		EVENTS : {
			Approval            : `Approval`,
			ApprovalForAll      : `ApprovalForAll`,
			Transfer            : `Transfer`,
		},
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				approve              : {
					SIGNATURE          : `approve(address,uint256)`,
					PARAMS             : [ `to_`, `tokenId_` ],
				},
				burn                 : {
					SIGNATURE          : `burn(uint256)`,
					PARAMS             : [ `tokenId_` ],
				},
				mint                 : {
					SIGNATURE          : `mint(uint256)`,
					PARAMS             : [ `qty_` ],
				},
				safeTransferFrom     : {
					SIGNATURE          : `safeTransferFrom(address,address,uint256)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_` ],
				},
				safeTransferFrom_ol  : {
					SIGNATURE          : `safeTransferFrom(address,address,uint256,bytes)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_`, `data_` ],
				},
				setApprovalForAll    : {
					SIGNATURE          : `setApprovalForAll(address,bool)`,
					PARAMS             : [ `operator_`, `approved_` ],
				},
				transferFrom         : {
					SIGNATURE          : `transferFrom(address,address,uint256)`,
					PARAMS             : [ `from_`, `to_`, `tokenId_` ],
				},
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setBaseURI           : {
					SIGNATURE          : 'setBaseURI(string)',
					PARAMS             : [ 'baseURI' ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				balanceOf            : {
					SIGNATURE          : `balanceOf(address)`,
					PARAMS             : [ `tokenOwner_` ],
				},
				getApproved          : {
					SIGNATURE          : `getApproved(uint256)`,
					PARAMS             : [ `tokenId_` ],
				},
				isApprovedForAll     : {
					SIGNATURE          : `isApprovedForAll(address,address)`,
					PARAMS             : [ `tokenOwner_`, `operator_` ],
				},
				name                 : {
					SIGNATURE          : `name()`,
					PARAMS             : [],
				},
				ownerOf              : {
					SIGNATURE          : `ownerOf(uint256)`,
					PARAMS             : [ `tokenId_` ],
				},
				supportsInterface    : {
					SIGNATURE          : `supportsInterface(bytes4)`,
					PARAMS             : [ `interfaceId_` ],
				},
				symbol               : {
					SIGNATURE          : `symbol()`,
					PARAMS             : [],
				},
				tokenByIndex         : {
					SIGNATURE          : `tokenByIndex(uint256)`,
					PARAMS             : [ `index_` ],
				},
				tokenOfOwnerByIndex  : {
					SIGNATURE          : `tokenOfOwnerByIndex(address,uint256)`,
					PARAMS             : [ `tokenOwner_`, `index_` ],
				},
				tokenURI             : {
					SIGNATURE          : `tokenURI(uint256)`,
					PARAMS             : [ `index_` ],
				},
				totalSupply          : {
					SIGNATURE          : `totalSupply()`,
					PARAMS             : [],
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
	const LAST_TOKEN              = FIRST_TOKEN + INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY - 1
	const UNMINTED_TOKEN          = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY + 10
	// METADATA
	const INIT_BASE_URI           = `https://api.exemple.com/`
	const NEW_BASE_URI            = `https://exemple.com/api/`

	const TEST_DATA = {
		// TEST NAME
		NAME : `Reg_ERC721BatchBurnable`,
		// TEST EVENTS
		EVENTS : {
			Approval       : true,
			ApprovalForAll : true,
			Transfer       : true,
			Transfer       : true,
		},
		// TEST METHODS
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				approve             : true,
				burn                : true,
				mint                : true,
				safeTransferFrom    : true,
				safeTransferFrom_ol : true,
				setApprovalForAll   : true,
				transferFrom        : true,
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				setBaseURI          : true,
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				balanceOf           : true,
				getApproved         : true,
				isApprovedForAll    : true,
				name                : true,
				ownerOf             : true,
				symbol              : true,
				tokenByIndex        : true,
				tokenOfOwnerByIndex : true,
				tokenURI            : true,
				totalSupply         : true,
			// **************************************
		},
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN                 : FIRST_TOKEN,
		SECOND_TOKEN                : SECOND_TOKEN,
		LAST_TOKEN                  : LAST_TOKEN,
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
		// METADATA
		INIT_BASE_URI               : INIT_BASE_URI,
		NEW_BASE_URI                : NEW_BASE_URI,
		// ENUMERABLE
		INDEX_ZERO                  : 0,
		INDEX_SECOND                : TOKEN_OWNER_INIT_SUPPLY + OTHER_OWNER_SUPPLY,
		TARGET_INDEX                : INIT_SUPPLY + TARGET_TOKEN,
		OUT_OF_BOUNDS_INDEX         : INIT_SUPPLY + UNMINTED_TOKEN,
		// CONSTRUCTOR PARAMETERS
		PARAMS : {
			initSupply_ : INIT_SUPPLY,
			baseURI_    : INIT_BASE_URI,
			symbol_     : `NFT`,
			name_       : `NFT Token`,
		},
		// INTERFACES
		INTERFACES : [
			`IERC165`,
			`IERC721`,
			`IERC721Metadata`,
		],
	}

	let test_to
	let test_qty
	let test_tokenId
	let test_contract_params

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function noMintFixture() {
		[
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		test_contract_params = [
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.name_,
		]
		let test_contract = await deployContract(
			test_contract_deployer,
			ARTIFACT,
			test_contract_params
		)
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

	async function mintFixture() {
		[
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		test_contract_params = [
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.name_,
		]
		let test_contract = await deployContract(
			test_contract_deployer,
			ARTIFACT,
			test_contract_params
		)
		await test_contract.deployed()

		test_qty = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.connect( test_token_owner )
											 .mint( test_to, test_qty )

		test_qty = TEST_DATA.OTHER_OWNER_SUPPLY
		test_to  = test_other_owner.address
		await test_contract.connect( test_other_owner )
											 .mint( test_to, test_qty )

		test_qty = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.connect( test_token_owner )
											 .mint( test_to, test_qty )

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

	async function burnFixture() {
		[
			test_user1,
			test_user2,
			test_proxy_user,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
			...addrs
		] = await ethers.getSigners()

		test_contract_params = [
			TEST_DATA.PARAMS.baseURI_,
			TEST_DATA.PARAMS.symbol_,
			TEST_DATA.PARAMS.name_,
		]
		let test_contract = await deployContract(
			test_contract_deployer,
			ARTIFACT,
			test_contract_params
		)
		await test_contract.deployed()

		test_qty = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.connect( test_token_owner )
											 .mint( test_to, test_qty )

		test_qty = TEST_DATA.OTHER_OWNER_SUPPLY
		test_to  = test_other_owner.address
		await test_contract.connect( test_other_owner )
											 .mint( test_to, test_qty )

		test_qty = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.connect( test_token_owner )
											 .mint( test_to, test_qty )

		test_tokenId = TEST_DATA.TARGET_TOKEN
		await test_contract.connect( test_token_owner )
											 .burn( test_tokenId )

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
					// **************************************
					// *****           PUBLIC           *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.approve.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs [ CONTRACT.METHODS.burn.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.TARGET_TOKEN,
							],
						}
						defaultArgs [ CONTRACT.METHODS.mint.SIGNATURE ] = {
							err  : null,
							args : [
								5,
							],
						}
						defaultArgs[ CONTRACT.METHODS.safeTransferFrom.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
								`0x`,
							],
						}
						defaultArgs[ CONTRACT.METHODS.setApprovalForAll.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								true,
							],
						}
						defaultArgs[ CONTRACT.METHODS.transferFrom.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
							],
						}
					// **************************************

					// **************************************
					// *****       CONTRACT_OWNER       *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.setBaseURI.SIGNATURE ] = {
							err  : null,
							args : [
								test_data.NEW_BASE_URI,
							],
						}
					// **************************************

					// **************************************
					// *****            VIEW            *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.balanceOf.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
							],
						}
						defaultArgs[ CONTRACT.METHODS.getApproved.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.isApprovedForAll.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								users[ USER1 ].address,
							],
						}
						defaultArgs[ CONTRACT.METHODS.name.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						defaultArgs[ CONTRACT.METHODS.ownerOf.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.supportsInterface.SIGNATURE ] = {
							err  : null,
							args : [
								INTERFACE_ID.IERC165,
							]
						}
						defaultArgs[ CONTRACT.METHODS.symbol.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						defaultArgs[ CONTRACT.METHODS.tokenURI.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						defaultArgs[ CONTRACT.METHODS.tokenByIndex.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.INDEX_ZERO,
							],
						}
						defaultArgs[ CONTRACT.METHODS.tokenOfOwnerByIndex.SIGNATURE ] = {
							err  : null,
							args : [
								users[ TOKEN_OWNER ].address,
								TEST.INDEX_ZERO,
							],
						}
						defaultArgs[ CONTRACT.METHODS.totalSupply.SIGNATURE ] = {
							err  : null,
							args : [],
						}
					// **************************************
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

	function shouldBehaveLikeMock_Reg_ERC721BatchBurnableBeforeMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_Reg_ERC721Batch before any token is minted`, function () {
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

				// **************************************
				// *****           PUBLIC           *****
				// **************************************
					describe( CONTRACT.METHODS.mint.SIGNATURE, function () {
						if ( TEST.METHODS.mint ) {
							it( `Should be reverted when minting to the NULL address`, async function () {
								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = CST.ADDRESS_ZERO
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNullAddress(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to
								)
							})

							it( `Should be reverted when minting to non ERC721Receiver contract`, async function () {
								const non_holder = await deployContract( users[ CONTRACT_DEPLOYER ], NON_HOLDER_ARTIFACT, [] )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = non_holder.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to
								)
							})

							it( `Should be reverted when minting to a receiver contract returning unexpected value`, async function () {
								const retval = INTERFACE_ID.IERC165
								const error  = ERC721ReceiverError.None
								const holder_params = [
									retval,
									error
								]
								const invalidReceiver = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = invalidReceiver.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to
								)
							})

							it( `Should be reverted when minting to a receiver contract that reverts with custom error`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithERC721ReceiverError
								const holder_params = [
									retval,
									error
								]
								const invalidReceiver = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = invalidReceiver.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to,
									CONTRACT.ERRORS.ERC721Receiver_ERROR
								)
							})

							it( `Should be reverted when minting to a receiver contract that reverts with message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithMessage
								const holder_params = [
									retval,
									error
								]
								const invalidReceiver = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = invalidReceiver.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to,
									CONTRACT.ERRORS.ERC721Receiver_MESSAGE
								)
							})

							it( `Should be reverted when minting to a receiver contract that reverts without message`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.RevertWithoutMessage
								const holder_params = [
									retval,
									error
								]
								const invalidReceiver = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = invalidReceiver.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to
								)
							})

							it( `Should be reverted when minting to a receiver contract that panics`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.Panic
								const holder_params = [
									retval,
									error
								]
								const invalidReceiver = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = invalidReceiver.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldRevertWhenTransferingToNonERC721Receiver(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									to,
									CONTRACT.ERRORS.ERC721Receiver_PANIC
								)
							})

							it( `To a valid ERC721Receiver contract`, async function () {
								const retval = INTERFACE_ID.IERC721Receiver
								const error  = ERC721ReceiverError.None
								const holder_params = [
									retval,
									error
								]
								const holder = await deployContract( users[ CONTRACT_DEPLOYER ], HOLDER_ARTIFACT, holder_params )

								const qty     = 1
								const from    = CST.ADDRESS_ZERO
								const to      = holder.address
								const tokenId = TEST.FIRST_TOKEN
								await shouldEmitTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									contract,
									from,
									to,
									tokenId
								)

								expect(
									await contract.ownerOf( tokenId )
								).to.equal( to )

								expect(
									await contract.balanceOf( to )
								).to.equal( 1 )
							})

							it( `${ USER_NAMES[ TOKEN_OWNER ] } should own ${ TEST.TOKEN_OWNER_INIT_SUPPLY } tokens`, async function() {
								const qty     = TEST.TOKEN_OWNER_INIT_SUPPLY
								const from    = CST.ADDRESS_ZERO
								const to      = users[ TOKEN_OWNER ].address
								const tokenId = qty
								await shouldEmitTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.mint( to, qty ),
									contract,
									from,
									to,
									tokenId
								)

								const tokenOwner = users[ TOKEN_OWNER ].address
								expect(
									await contract.balanceOf( tokenOwner )
								).to.equal( TEST.TOKEN_OWNER_INIT_SUPPLY )
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeMock_Reg_ERC721BatchBurnableAfterMint ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Mock_Reg_ERC721Batch after minting some tokens`, function () {
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

				// **************************************
				// *****       CONTRACT_OWNER       *****
				// **************************************
					describe( CONTRACT.METHODS.setBaseURI.SIGNATURE, function () {
						if ( TEST.METHODS.setBaseURI ) {
							it( `First token URI should now be "${ TEST.NEW_BASE_URI }${ TEST.FIRST_TOKEN }"`, async function () {
								const baseURI = TEST.NEW_BASE_URI
								await contract.connect( users[ CONTRACT_DEPLOYER ] )
															.setBaseURI( baseURI )

								const tokenId = TEST.FIRST_TOKEN
								expect(
									await contract.tokenURI( tokenId )
								).to.equal( baseURI + tokenId )
							})
						}
					})
				// **************************************
			}
		})
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION[ TEST_DATA.NAME ] ) {
		testInvalidInputs( noMintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldSupportInterface( noMintFixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchBeforeMint( noMintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchEnumerableBeforeMint( noMintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_Reg_ERC721BatchBurnableBeforeMint( noMintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchAfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchMetadata( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchEnumerableAfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeMock_Reg_ERC721BatchBurnableAfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchBurnableBeforeBurn( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		shouldBehaveLikeERC721BatchBurnableAfterBurn( burnFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
