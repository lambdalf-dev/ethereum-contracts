// **************************************
// *****           IMPORT           *****
// **************************************
	const { TEST_ACTIVATION } = require( `../test-activation-module` )
	const {
		USER1,
		USER2,
		TOKEN_OWNER,
		OTHER_OWNER,
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
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( '../utils/behavior.ERC165' )

	const {
		ERC721ReceiverError,
		shouldEmitApprovalEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferEvent,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenTransferingToNullAddress,
		shouldRevertWhenTransferingFromNonOwner,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenTransferingToNonERC721Receiver,
		shouldBehaveLikeERC721BatchBeforeMint,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require( `../ERC721/behavior.ERC721Batch` )

	const {
		shouldBehaveLikeERC721BatchBurnableBeforeBurn,
		shouldBehaveLikeERC721BatchBurnableAfterBurn,
	} = require( `../ERC721/behavior.ERC721BatchBurnable` )

	const {
		shouldEmitConsecutiveTransferEvent,
	} = require( `../ERC721/behavior.ERC2309` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME : `Mock_ERC721BatchBurnable`,
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				mint : {
					SIGNATURE : `mint(address,uint256)`,
					PARAMS    : [ `to_`, `qty_` ],
				},
				mint2309 : {
					SIGNATURE : `mint2309(address,uint256)`,
					PARAMS    : [ `to_`, `qty_` ],
				},
				burn : {
					SIGNATURE : `burn(uint256)`,
					PARAMS    : [ `tokenId_` ],
				},
				// IERC721
				approve : {
					SIGNATURE : `approve(address,uint256)`,
					PARAMS    : [ `to_`, `tokenId_` ],
				},
				safeTransferFrom : {
					SIGNATURE : `safeTransferFrom(address,address,uint256)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_` ],
				},
				safeTransferFrom_ol : {
					SIGNATURE : `safeTransferFrom(address,address,uint256,bytes)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_`, `data_` ],
				},
				setApprovalForAll : {
					SIGNATURE : `setApprovalForAll(address,bool)`,
					PARAMS    : [ `operator_`, `approved_` ],
				},
				transferFrom : {
					SIGNATURE : `transferFrom(address,address,uint256)`,
					PARAMS    : [ `from_`, `to_`, `tokenId_` ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				supplyMinted : {
					SIGNATURE : `supplyMinted()`,
					PARAMS    : [],
				},
				// IERC721
				balanceOf : {
					SIGNATURE : `balanceOf(address)`,
					PARAMS    : [ `tokenOwner_` ],
				},
				getApproved : {
					SIGNATURE : `getApproved(uint256)`,
					PARAMS    : [ `tokenId_` ],
				},
				isApprovedForAll : {
					SIGNATURE : `isApprovedForAll(address,address)`,
					PARAMS    : [ `tokenOwner_`, `operator_` ],
				},
				ownerOf : {
					SIGNATURE : `ownerOf(uint256)`,
					PARAMS    : [ `tokenId_` ],
				},
				// IERC165
				supportsInterface : {
					SIGNATURE : `supportsInterface(bytes4)`,
					PARAMS    : [ `interfaceId_` ],
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

	const TEST_DATA = {
		// TEST NAME
		NAME : `ERC721BatchBurnable`,
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY,
		// TARGET TOKEN
		FIRST_TOKEN                 : FIRST_TOKEN,
		SECOND_TOKEN                : SECOND_TOKEN,
		LAST_TOKEN                  : LAST_TOKEN,
		TARGET_TOKEN                : INIT_SUPPLY + TARGET_TOKEN,
		INVALID_TOKEN               : 0,
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
		// INTERFACES
		INTERFACES : [
			`IERC165`,
			`IERC721`,
		],
	}

	let test_to
	let test_qty
	let test_contract_params

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		[
			test_contract_deployer,
			test_user1,
			test_user2,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		const test_contract = await contract_artifact.deploy()
		await test_contract.deployed()

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		}
	}
	async function mintFixture() {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		} = await loadFixture( deployFixture )

		test_qty = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.mint( test_to, test_qty )

		test_qty = TEST_DATA.OTHER_OWNER_SUPPLY
		test_to  = test_other_owner.address
		await test_contract.mint( test_to, test_qty )

		test_qty = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_to  = test_token_owner.address
		await test_contract.mint( test_to, test_qty )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		}
	}
	async function burnFixture() {
		const {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
			test_contract_deployer,
		} = await loadFixture( mintFixture )

		test_tokenId = TEST_DATA.TARGET_TOKEN
		await test_contract
			.connect( test_token_owner )
			.burn( test_tokenId )

		return {
			test_user1,
			test_user2,
			test_contract,
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
						test_token_owner,
						test_other_owner,
					} = await loadFixture( fixture )

					contract = test_contract
					users[ USER1 ] = test_user1
					users[ USER2 ] = test_user2
					users[ TOKEN_OWNER ] = test_token_owner
					users[ OTHER_OWNER ] = test_other_owner

					defaultArgs = {}
					// **************************************
					// *****           PUBLIC           *****
					// **************************************
						defaultArgs [ CONTRACT.METHODS.burn.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.TARGET_TOKEN,
							],
						}
						defaultArgs [ CONTRACT.METHODS.mint.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
								5,
							],
						}
						defaultArgs [ CONTRACT.METHODS.mint2309.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
								5,
							],
						}
						// IERC721
						defaultArgs[ CONTRACT.METHODS.approve.SIGNATURE ] = {
							err  : null,
							args : [
								users[ USER1 ].address,
								TEST.FIRST_TOKEN,
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
					// *****            VIEW            *****
					// **************************************
						defaultArgs[ CONTRACT.METHODS.supplyMinted.SIGNATURE ] = {
							err  : null,
							args : [],
						}
						// IERC721
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
						defaultArgs[ CONTRACT.METHODS.ownerOf.SIGNATURE ] = {
							err  : null,
							args : [
								TEST.FIRST_TOKEN,
							],
						}
						// IERC165
						defaultArgs[ CONTRACT.METHODS.supportsInterface.SIGNATURE ] = {
							err  : null,
							args : [
								INTERFACE_ID.IERC165,
							]
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
	function shouldBehaveLikeMock_ERC721BatchBurnableAtDeploy ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC721BatchBeforeMint( fixture, TEST, CONTRACT )

		describe( `Should behave like Mock_ERC721BatchBurnable before any token is minted`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mint.SIGNATURE, function () {
					it( `Should be reverted when minting to the NULL address`, async function () {
						const qty = 1
						const from = ethers.constants.AddressZero
						const to = ethers.constants.AddressZero
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNullAddress(
							contract.mint( to, qty ),
							contract
						)
					})
					it( `Should be reverted when minting to non ERC721Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
						const non_holder = await non_holder_artifact.deploy()

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = non_holder.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithERC721ReceiverError
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to,
							ERC721ReceiverError.RevertWithERC721ReceiverError
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to,
							ERC721ReceiverError.RevertWithMessage
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint( to, qty ),
							contract,
							to,
							ERC721ReceiverError.Panic
						)
					})
					it( `To a valid ERC721Receiver contract`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const holder = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = holder.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract.mint( to, qty ),
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
					it( `Token owner should own ${ TEST.TOKEN_OWNER_INIT_SUPPLY } tokens`, async function() {
						const qty = TEST.TOKEN_OWNER_INIT_SUPPLY
						const from = ethers.constants.AddressZero
						const to = users[ TOKEN_OWNER ].address
						const tokenId = qty
						await shouldEmitTransferEvent(
							contract.mint( to, qty ),
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
				})
				describe( CONTRACT.METHODS.mint2309.SIGNATURE, function () {
					it( `Should be reverted when minting to the NULL address`, async function () {
						const qty = 1
						const from = ethers.constants.AddressZero
						const to = ethers.constants.AddressZero
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNullAddress(
							contract.mint2309( to, qty ),
							contract
						)
					})
					it( `Should be reverted when minting to non ERC721Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory( 'Mock_NonERC721Receiver' )
						const non_holder = await non_holder_artifact.deploy()

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = non_holder.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithERC721ReceiverError
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to,
							ERC721ReceiverError.RevertWithERC721ReceiverError
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to,
							ERC721ReceiverError.RevertWithMessage
						)
					})
					it( `Should be reverted when minting to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to
						)
					})
					it( `Should be reverted when minting to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const invalidReceiver = await holder_artifact.deploy( retval, error )

						const qty = 1
						const from = ethers.constants.AddressZero
						const to = invalidReceiver.address
						const tokenId = TEST.FIRST_TOKEN
						await shouldRevertWhenTransferingToNonERC721Receiver(
							contract.mint2309( to, qty ),
							contract,
							to,
							ERC721ReceiverError.Panic
						)
					})
					it( `To a valid ERC721Receiver contract`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory( 'Mock_ERC721Receiver' )
						const holder = await holder_artifact.deploy( retval, error )

						const qty = 1
						const to = holder.address
						const fromTokenId = TEST.FIRST_TOKEN
						const toTokenId = TEST.INIT_SUPPLY + qty
						const fromAddress = ethers.constants.AddressZero
						await shouldEmitConsecutiveTransferEvent(
							contract.mint2309( to, qty ),
							contract,
							fromTokenId,
							toTokenId,
							fromAddress,
							to,
							1
						)

						expect(
							await contract.ownerOf( toTokenId )
						).to.equal( to )

						expect(
							await contract.ownerOf( fromTokenId )
						).to.equal( to )

						expect(
							await contract.balanceOf( to )
						).to.equal( 1 )
					})
					it( `Token owner should own ${ TEST.TOKEN_OWNER_INIT_SUPPLY } tokens`, async function() {
						const qty = TEST.TOKEN_OWNER_INIT_SUPPLY
						const to = users[ TOKEN_OWNER ].address
						const fromTokenId = TEST.FIRST_TOKEN
						const toTokenId = TEST.INIT_SUPPLY + qty
						const fromAddress = ethers.constants.AddressZero
						await shouldEmitConsecutiveTransferEvent(
							contract.mint2309( to, qty ),
							contract,
							fromTokenId,
							toTokenId,
							fromAddress,
							to
						)

						expect(
							await contract.ownerOf( toTokenId )
						).to.equal( to )

						expect(
							await contract.ownerOf( fromTokenId )
						).to.equal( to )

						const tokenOwner = users[ TOKEN_OWNER ].address
						expect(
							await contract.balanceOf( tokenOwner )
						).to.equal( TEST.TOKEN_OWNER_INIT_SUPPLY )
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeMock_ERC721BatchBurnableAfterMint ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC721BatchAfterMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchBurnableBeforeBurn( fixture, TEST, CONTRACT )
	}
	function shouldBehaveLikeMock_ERC721BatchBurnableAfterBurn ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC721BatchBurnableAfterBurn( fixture, TEST, CONTRACT )
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( TEST_ACTIVATION.ERC721BatchBurnable ) {
		if ( true ) {
			testInvalidInputs( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldSupportInterface( deployFixture, TEST_DATA.INTERFACES, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_ERC721BatchBurnableAtDeploy( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_ERC721BatchBurnableAfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
		if ( true ) {
			shouldBehaveLikeMock_ERC721BatchBurnableAfterBurn( burnFixture, TEST_DATA, CONTRACT_INTERFACE )
		}
	}
})
