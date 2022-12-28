// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		USER2,
		TOKEN_OWNER,
		OTHER_OWNER,
	} = require( `../../test/test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../../test/utils/behavior.ERC165` )

	const {
		shouldRevertWhenArrayLengthsDontMatch,
	} = require( `../../test/utils/behavior.Arrays` )

	const {
		ERC1155ReceiverError,
		shouldEmitTransferSingleEvent,
		shouldEmitTransferBatchEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitURIEvent,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenERC1155ReceiverRejectsTransfer,
		shouldRevertWhenNewSeriesAlreadyExist,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens,
		shouldRevertWhenTransferingToNonERC1155ReceiverContract,
		shouldRevertWhenTransferingToNullAddress,
		shouldBehaveLikeIERC1155AtDeployTime,
		shouldBehaveLikeIERC1155AfterCreatingSeries,
		shouldBehaveLikeIERC1155AfterMint,
	} = require( `../../test/ERC1155/behavior.ERC1155` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	// For contract interface
	const CONTRACT_INTERFACE = {
		NAME : `Mock_ERC1155`,
		METHODS : {
			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				mint : {
					SIGNATURE : `mint(address,uint256,uint256)`,
					PARAMS    : [ `toAddress_`, `id_`, `qty_` ],
				},
				// ERC1155
				safeBatchTransferFrom : {
					SIGNATURE : `safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)`,
					PARAMS    : [ `from_`, `to_`, `ids_`, `amounts_`, `data_` ],
				},
				safeTransferFrom : {
					SIGNATURE : `safeTransferFrom(address,address,uint256,uint256,bytes)`,
					PARAMS    : [ `from_`, `to_`, `id_`, `amount_`, `data_` ],
				},
				setApprovalForAll : {
					SIGNATURE : `setApprovalForAll(address,bool)`,
					PARAMS    : [ `operator_`, `approved_` ],
				},
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				DEFAULT_SERIES : {
					SIGNATURE : `DEFAULT_SERIES()`,
					PARAMS    : [],
				},
				// ERC1155
				balanceOf : {
					SIGNATURE : `balanceOf(address,uint256)`,
					PARAMS    : [ `owner_`, `id_` ], 
				},
				balanceOfBatch : {
					SIGNATURE : `balanceOfBatch(address[],uint256[])`,
					PARAMS    : [ `owners_`, `ids_` ],
				},
				isApprovedForAll : {
					SIGNATURE : `isApprovedForAll(address,address)`,
					PARAMS    : [ `tokenOwner_`, `operator_` ],
				},
				// ERC165
				supportsInterface : {
					SIGNATURE : `supportsInterface(bytes4)`,
					PARAMS    : [ `interfaceId_` ],
				},
			// **************************************
		},
	}

	// INIT
	const INIT_SUPPLY             = 0
	// TARGET AMOUNT
	const TARGET_AMOUNT           = 4
	// TOKEN OWNER
	const TOKEN_OWNER_INIT_SUPPLY = 6
	const TOKEN_OWNER_MORE_SUPPLY = 3
	// OTHER OWNER
	const OTHER_OWNER_SUPPLY      = 1
	// AIRDROP
	const AIRDROP1                = 1
	const AIRDROP2                = 2
	// WHITELIST
	const WHITELIST_AMOUNT_1      = 3
	const WHITELIST_AMOUNT_2      = 1

	const TEST_DATA = {
		// TEST NAME
		NAME : `ERC1155`,
		INVALID_SERIES_ID           : 0,
		// SUPPLY
		INIT_SUPPLY                 : INIT_SUPPLY,
		MINTED_SUPPLY               : INIT_SUPPLY + TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY + OTHER_OWNER_SUPPLY,
		MAX_BATCH                   : 10,
		// TARGET AMOUNT
		TARGET_TOKEN                : 2,
		TARGET_AMOUNT               : INIT_SUPPLY + TARGET_AMOUNT,
		// TOKEN OWNER
		TOKEN_OWNER_INIT_SUPPLY     : TOKEN_OWNER_INIT_SUPPLY,
		TOKEN_OWNER_MORE_SUPPLY     : TOKEN_OWNER_MORE_SUPPLY,
		TOKEN_OWNER_SUPPLY          : TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY,
		// OTHER OWNER
		OTHER_OWNER_SUPPLY          : OTHER_OWNER_SUPPLY,
		// INTERFACES
		INTERFACES : [
			`IERC165`,
			`IERC1155`,
		],
		// FIRST SERIES
		INIT_SERIES : {
			id_ : 1,
		},
	}

	let test_qty

	let users = {}
	let contract
// **************************************

// **************************************
// *****          FIXTURES          *****
// **************************************
	async function deployFixture() {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			test_token_owner,
			test_other_owner,
			...addrs
		] = await ethers.getSigners()

		const contract_artifact = await ethers.getContractFactory( CONTRACT_INTERFACE.NAME )
		test_contract = await contract_artifact.deploy()
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

		const test_id = TEST_DATA.INIT_SERIES.id_
		test_qty = TEST_DATA.TOKEN_OWNER_INIT_SUPPLY
		test_account = test_token_owner
		await test_contract.mint( test_account.address, test_id, test_qty )

		test_qty = TEST_DATA.OTHER_OWNER_SUPPLY
		test_account = test_other_owner
		await test_contract.mint( test_account.address, test_id, test_qty )

		test_qty = TEST_DATA.TOKEN_OWNER_MORE_SUPPLY
		test_account = test_token_owner
		await test_contract.mint( test_account.address, test_id, test_qty )

		return {
			test_user1,
			test_user2,
			test_contract,
			test_token_owner,
			test_other_owner,
		}
	}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	async function shouldBehaveLikeERC1155AtDeployTime ( fixture, TEST, CONTRACT  ) {
		shouldBehaveLikeIERC1155AtDeployTime( fixture, TEST, CONTRACT )
		shouldBehaveLikeIERC1155AfterCreatingSeries( fixture, TEST, CONTRACT )

		describe( `Should behave like IERC1155 at deploy`, function () {
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
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.DEFAULT_SERIES.SIGNATURE, function () {
					it( `Should be 1`, async function () {
						expect(
							await contract.DEFAULT_SERIES()
						).to.equal( TEST.INIT_SERIES.id_ )
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mint.SIGNATURE, function () {
					it( `Should be reverted when minting to the NULL address`, async function () {
						const id = TEST.INIT_SERIES.id_
						const account = ethers.constants.AddressZero
						const qty = 1

						await shouldRevertWhenTransferingToNullAddress(
							contract.mint( account, id, qty ),
							contract
						)
					})
				})
			// **************************************
		})
	}
	async function shouldBehaveLikeERC1155AfterMint ( fixture, TEST, CONTRACT  ) {
		shouldBehaveLikeIERC1155AfterMint( fixture, TEST, CONTRACT )
	}
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe( TEST_DATA.NAME, function () {
	if ( true ) {
		shouldSupportInterface( deployFixture, TEST_DATA.INTERFACES )
	}
	if ( true ) {
		shouldBehaveLikeERC1155AtDeployTime( deployFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
	if ( true ) {
		shouldBehaveLikeERC1155AfterMint( mintFixture, TEST_DATA, CONTRACT_INTERFACE )
	}
})
