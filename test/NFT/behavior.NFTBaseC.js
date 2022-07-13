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

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require( `../utils/behavior.ERC165` )

	const {
		ERC721ReceiverError,
		shouldEmitApprovalEvent,
		shouldEmitApprovalForAllEvent,
		shouldEmitTransferEvent,
		shouldRevertWhenCallerIsNotApproved,
		shouldRevertWhenRequestedTokenDoesNotExist,
		shouldRevertWhenTransferingToNonERC721Receiver,
		shouldRevertWhenApprovingTokenOwner,
		shouldRevertWhenTransferingToNullAddress,
		shouldBehaveLikeERC721BatchBeforeMint,
		shouldBehaveLikeERC721BatchAfterMint,
	} = require( `../ERC721/behavior.ERC721Batch` )

	const {
		shouldEmitConsecutiveTransferEvent,
	} = require( `../ERC721/behavior.ERC2309` )

	const {
		shouldBehaveLikeERC721BatchMetadata,
	} = require( `../ERC721/behavior.ERC721BatchMetadata` )

	const {
		shouldBehaveLikeERC721BatchEnumerableBeforeMint,
		shouldBehaveLikeERC721BatchEnumerableAfterMint,
	} = require( `../ERC721/behavior.ERC721BatchEnumerable` )

	const {
		shouldBehaveLikeERC2981Base,
	} = require( '../utils/behavior.ERC2981Base' )

	const {
		shouldBehaveLikeIOwnable,
		shouldRevertWhenCallerIsNotContractOwner,
	} = require( `../utils/behavior.IOwnable` )

	const {
		CONTRACT_STATE,
		shouldBehaveLikeIPausable,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.IPausable` )

	const {
		shouldRevertWhenArrayLengthsDontMatch,
		shouldRevertWhenIncorrectAmountPaid,
		shouldRevertWhenInputAddressIsContract,
		shouldRevertWhenQtyIsZero,
		shouldRevertWhenMintedOut,
		shouldRevertWhenReserveDepleted,
		shouldRevertWhenSumOfSharesIncorrect,
		shouldRevertWhenContractHasNoBalance,
		shouldRevertWhenEtherTransferFails,
		shouldEmitPaymentReleasedEvent,
		shouldBehaveLikeNFTAtDeploy,
		shouldBehaveLikeNFTAfterSettingProxy,
		shouldBehaveLikeNFTAfterSettingStateToOpen,
		shouldBehaveLikeNFTAfterMint,
		shouldBehaveLikeNFTAfterMintingOut,
	} = require( `../NFT/behavior.NFT` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let non_holder_artifact
	let holder_artifact
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeNFTBaseCAtDeploy ( fixture, TEST, CONTRACT  ) {
		shouldBehaveLikeNFTAtDeploy( fixture, TEST, CONTRACT )

		describe( `Should behave like NFTBaseC at deploy`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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
					describe( CONTRACT.METHODS.airdrop.SIGNATURE, function () {
						if ( TEST.METHODS.airdrop ) {
							describe( `Airdrop tokens should emit a ConsecutiveTransfer event`, async function () {
								const accounts = [
									users[ USER1 ].address,
									users[ USER2 ].address,
								]
								const amounts = [
									TEST.AIRDROP1,
									TEST.AIRDROP2,
								]
								const fromToken = TEST.INIT_SUPPLY + TEST.FIRST_TOKEN + TEST.AIRDROP1
								const toToken   = TEST.INIT_SUPPLY + TEST.AIRDROP1 + TEST.AIRDROP2
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ USER2 ].address
								await shouldEmitConsecutiveTransferEvent(
									contract.connect( users[ CONTRACT_DEPLOYER ] )
													.airdrop( accounts, amounts ),
									contract,
									fromToken,
									toToken,
									fromAddr,
									toAddr,
									1
								)
							})
						}
					})
				// **************************************
			}
		})
	}

	function shouldBehaveLikeNFTBaseCAfterSettingStateToOpen ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeNFTAfterSettingStateToOpen( fixture, TEST, CONTRACT )

		describe( `Should behave like NFTBaseC after setting state to OPEN`, function () {
			if ( TEST_ACTIVATION.CORRECT_INPUT ) {
				beforeEach( async function () {
					const {
						test_team1,
						test_team2,
						test_team3,
						test_team4,
						test_user1,
						test_user2,
						test_contract,
						test_proxy_user,
						test_token_owner,
						test_other_owner,
						test_proxy_contract,
						test_contract_deployer,
					} = await loadFixture( fixture )

					contract       = test_contract
					proxy_contract = test_proxy_contract
					users[ `TEAM1`           ] = test_team1
					users[ `TEAM2`           ] = test_team2
					users[ `TEAM3`           ] = test_team3
					users[ `TEAM4`           ] = test_team4
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
					describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
						if ( TEST.METHODS.mintPublic ) {
							it( `Minting 1 token should emit a ConsecutiveTransfer event`, async function() {
								const qty       = 1
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldEmitConsecutiveTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									contract,
									fromToken,
									toToken,
									fromAddr,
									toAddr
								)
							})

							it( `Minting 2 tokens should emit a ConsecutiveTransfer event`, async function() {
								const qty       = 2
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldEmitConsecutiveTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									contract,
									fromToken,
									toToken,
									fromAddr,
									toAddr
								)
							})

							it( `Minting ${ TEST.PARAMS.maxBatch_ } tokens should emit a ConsecutiveTransfer event`, async function() {
								const qty       = TEST.PARAMS.maxBatch_
								const fromAddr  = ethers.constants.AddressZero
								const toAddr    = users[ TOKEN_OWNER ].address
								const fromToken = TEST.FIRST_TOKEN
								const toToken   = TEST.INIT_SUPPLY + qty
								const value     = TEST.PARAMS.salePrice_.mul( qty )
								const tx_params = {
									value : value
								}
								await shouldEmitConsecutiveTransferEvent(
									contract.connect( users[ TOKEN_OWNER ] )
													.mintPublic( qty, tx_params ),
									contract,
									fromToken,
									toToken,
									fromAddr,
									toAddr
								)
							})
						}
					})
				// **************************************
			}
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldRevertWhenArrayLengthsDontMatch,
	shouldRevertWhenIncorrectAmountPaid,
	shouldRevertWhenInputAddressIsContract,
	shouldRevertWhenMintedOut,
	shouldRevertWhenReserveDepleted,
	shouldRevertWhenSumOfSharesIncorrect,
	shouldRevertWhenContractHasNoBalance,
	shouldRevertWhenEtherTransferFails,
	shouldEmitPaymentReleasedEvent,
	shouldBehaveLikeNFTAtDeploy,
	shouldBehaveLikeNFTAfterSettingProxy,
	shouldBehaveLikeNFTAfterSettingStateToOpen,
	shouldBehaveLikeNFTAfterMint,
	shouldBehaveLikeNFTAfterMintingOut,
	shouldBehaveLikeNFTBaseCAtDeploy,
	shouldBehaveLikeNFTBaseCAfterSettingStateToOpen,
}
