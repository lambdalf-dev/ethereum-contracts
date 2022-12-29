// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		USER1,
		USER2,
		TREASURY,
		PROXY_USER,
		TOKEN_OWNER,
		OTHER_OWNER,
		FAKE_SIGNER,
		SIGNER_WALLET,
		ROYALTY_RECIPIENT,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )

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
		shouldEmitConsecutiveTransferEvent,
	} = require( `../ERC721/behavior.ERC2309` )

	const {
		shouldBehaveLikeERC721BatchEnumerableBeforeMint,
		shouldBehaveLikeERC721BatchEnumerableAfterMint,
	} = require( `../ERC721/behavior.ERC721BatchEnumerable` )

	const {
		shouldBehaveLikeERC721BatchMetadata,
	} = require( `../ERC721/behavior.ERC721BatchMetadata` )

	const {
		CONTRACT_STATE,
		shouldBehaveLikeContractState,
		shouldEmitContractStateChangedEvent,
		shouldRevertWhenContractStateIsIncorrect,
		shouldRevertWhenContractStateIsInvalid,
	} = require( `../utils/behavior.ContractState` )
	CONTRACT_STATE.PRIVATE_SALE = 1
	CONTRACT_STATE.PUBLIC_SALE = 2

	const {
		shouldBehaveLikeERC173,
		shouldRevertWhenCallerIsNotContractOwner,
	} = require( `../utils/behavior.ERC173` )

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

	const {
		shouldBehaveLikeERC2981,
		shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase,
	} = require( '../utils/behavior.ERC2981' )

	const {
		shouldRevertWhenEtherTransferFails,
		shouldRevertWhenIncorrectAmountPaid,
		shouldRevertWhenContractHasNoBalance,
	} = require( `../utils/behavior.Price` )

	const {
		shouldRevertWhenInvalidMaxSupply,
		shouldRevertWhenQtyIsZero,
		shouldRevertWhenQtyOverMaxBatch,
		shouldRevertWhenMintedOut,
		shouldRevertWhenReserveDepleted,
	} = require( `../utils/behavior.NFTSupply` )

	const {
		shouldRevertWhenArrayLengthsDontMatch,
	} = require( `../utils/behavior.Arrays` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	function shouldBehaveLikeTemplate721AtDeploy ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC721BatchBeforeMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableBeforeMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeContractState( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC173( fixture, TEST, CONTRACT )

		describe( `Should behave like Template721 at deployment time`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.DEFAULT_SUBSCRIPTION.SIGNATURE, function () {
					it( `Should return the default subscription address`, async function () {
						expect(
							await contract.DEFAULT_SUBSCRIPTION()
						).to.equal( TEST.DEFAULT_SUBSCRIPTION )
					})
				})
				describe( CONTRACT.METHODS.DEFAULT_OPERATOR_FILTER_REGISTRY.SIGNATURE, function () {
					it( `Should return the default operator filter registry address`, async function () {
						expect(
							await contract.DEFAULT_OPERATOR_FILTER_REGISTRY()
						).to.equal( TEST.DEFAULT_OPERATOR_FILTER_REGISTRY )
					})
				})
				describe( CONTRACT.METHODS.MAX_BATCH.SIGNATURE, function () {
					it( `Should return the max amount that can be minted in PUBLIC_SALE`, async function () {
						expect(
							await contract.MAX_BATCH()
						).to.equal( TEST.MAX_BATCH )
					})
				})
				describe( CONTRACT.METHODS.maxSupply.SIGNATURE, function () {
					it( `Should return the max supply that can exist`, async function () {
						expect(
							await contract.maxSupply()
						).to.equal( TEST.MAX_SUPPLY )
					})
				})
				describe( CONTRACT.METHODS.PRIVATE_SALE.SIGNATURE, function () {
					it( `Should return the value of the PRIVATE_SALE identifier`, async function () {
						expect(
							await contract.PRIVATE_SALE()
						).to.equal( CONTRACT_STATE.PRIVATE_SALE )
					})
				})
				describe( CONTRACT.METHODS.PUBLIC_SALE.SIGNATURE, function () {
					it( `Should return the value of the PUBLIC_SALE identifier`, async function () {
						expect(
							await contract.PUBLIC_SALE()
						).to.equal( CONTRACT_STATE.PUBLIC_SALE )
					})
				})
				describe( CONTRACT.METHODS.salePrice.SIGNATURE, function () {
					it( `Should return the sale price of the PRIVATE_SALE`, async function () {
						const contractState = CONTRACT_STATE.PRIVATE_SALE
						const expectedPrice = TEST.SALE_PRICE.PRIVATE_SALE
						expect(
							await contract.salePrice( contractState )
						).to.equal( expectedPrice )
					})
					it( `Should return the sale price of the PUBLIC_SALE`, async function () {
						const contractState = CONTRACT_STATE.PUBLIC_SALE
						const expectedPrice = TEST.SALE_PRICE.PUBLIC_SALE
						expect(
							await contract.salePrice( contractState )
						).to.equal( expectedPrice )
					})
				})
				describe( CONTRACT.METHODS.supplyMinted.SIGNATURE, function () {
					it( `Should return the initial supply`, async function () {
						expect(
							await contract.supplyMinted()
						).to.equal( TEST.INIT_SUPPLY )
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mintPrivate.SIGNATURE, function () {
					it( `Should be reverted when contract state is PAUSED`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PAUSED
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenContractStateIsIncorrect(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							currentState
						)
					})
				})
				describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
					it( `Should be reverted when contract state is PAUSED`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PAUSED
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldRevertWhenContractStateIsIncorrect(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							currentState
						)
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				describe( CONTRACT.METHODS.airdrop.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const accounts = [
							users[ TOKEN_OWNER ].address,
							users[ OTHER_OWNER ].address,
						]
						const amounts = [
							TEST.AIRDROP1,
							TEST.AIRDROP2,
						]
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.airdrop( accounts, amounts ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when arrays lengths don't match`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const accounts = [
							users[ TOKEN_OWNER ].address,
							users[ OTHER_OWNER ].address,
						]
						const amounts = [
							TEST.AIRDROP1,
						]
						await shouldRevertWhenArrayLengthsDontMatch(
							contract
								.connect( operator )
								.airdrop( accounts, amounts ),
							contract
						)
					})
					it( `Should airdrop successfully under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const firstAccount = users[ TOKEN_OWNER ]
						const secondAccount = users[ OTHER_OWNER ]
						const firstAmount = TEST.AIRDROP1
						const secondAmount = TEST.AIRDROP2
						const accounts = [
							firstAccount.address,
							secondAccount.address,
						]
						const amounts = [
							firstAmount,
							secondAmount,
						]
						await shouldEmitTransferEvent(
							contract
								.connect( operator )
								.airdrop( accounts, amounts ),
							contract,
							ethers.constants.AddressZero,
							firstAccount.address,
							firstAmount
						)
						expect(
							await contract.balanceOf( firstAccount )
						).to.equal( firstAmount )
						expect(
							await contract.balanceOf( secondAccount )
						).to.equal( secondAmount )
					})
				})
				describe( CONTRACT.METHODS.reduceSupply.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newSupply = TEST.NEW_MAX_SUPPLY
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.reduceSupply( newSupply ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when new supply is invalid`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newSupply = TEST.INVALID_SUPPLY
						await shouldRevertWhenInvalidMaxSupply(
							contract
								.connect( operator )
								.reduceSupply( newSupply ),
							contract
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newSupply = TEST.NEW_MAX_SUPPLY
						await expect(
							contract
								.connect( operator )
								.reduceSupply( newSupply )
						).to.be.fulfilled
						expect(
							await contract.maxSupply()
						).to.equal( newSupply )
					})
				})
				describe( CONTRACT.METHODS.setBaseURI.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newURI = TEST.NEW_BASE_URI
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setBaseURI( newURI ),
							contract,
							operator.address
						)
					})
				})
				describe( CONTRACT.METHODS.setContractState.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const previousState = CONTRACT_STATE.PAUSED
						const newState = CONTRACT_STATE.PUBLIC_SALE
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setContractState( newState ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when new state is invalid`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const previousState = CONTRACT_STATE.PAUSED
						const newState = CONTRACT_STATE.PUBLIC_SALE + 1
						await shouldRevertWhenContractStateIsInvalid(
							contract
								.connect( operator )
								.setContractState( newState ),
							contract,
							newState
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const previousState = CONTRACT_STATE.PAUSED
						const newState = CONTRACT_STATE.PUBLIC_SALE
						await shouldEmitContractStateChangedEvent(
							contract
								.connect( operator )
								.setContractState( newState ),
							contract,
							previousState,
							newState
						)
						expect(
							await contract.getContractState()
						).to.equal( newState )
					})
				})
				describe( CONTRACT.METHODS.setPrices.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newPrivatePrice = TEST.NEW_SALE_PRICE.PRIVATE_SALE
						const newPublicPrice = TEST.NEW_SALE_PRICE.PUBLIC_SALE
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setPrices( newPrivatePrice, newPublicPrice ),
							contract,
							operator.address
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newPrivatePrice = TEST.NEW_SALE_PRICE.PRIVATE_SALE
						const newPublicPrice = TEST.NEW_SALE_PRICE.PUBLIC_SALE
						await expect(
							contract
								.connect( operator )
								.setPrices( newPrivatePrice, newPublicPrice )
						).to.be.fulfilled
						expect(
							await contract.salePrice( CONTRACT_STATE.PRIVATE_SALE )
						).to.equal( newPrivatePrice )
						expect(
							await contract.salePrice( CONTRACT_STATE.PUBLIC_SALE )
						).to.equal( newPublicPrice )
					})
				})
				describe( CONTRACT.METHODS.setRoyaltyInfo.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newRecipient = operator.address
						const newRate = TEST.NEW_ROYALTY_RATE
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setRoyaltyInfo( newRecipient, newRate ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when new royalty rate is higher than ${ TEST.ROYALTY_BASE }`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newRecipient = operator.address
						const newRate = TEST.INVALID_ROYALTY_RATE
						await shouldRevertWhenRoyaltyRateHigherThanRoyaltyBase(
							contract
								.connect( operator )
								.setRoyaltyInfo( newRecipient, newRate ),
							contract,
							newRate,
							TEST.ROYALTY_BASE
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newRecipient = operator.address
						const newRate = TEST.NEW_ROYALTY_RATE
						await expect(
							contract
								.connect( operator )
								.setRoyaltyInfo( newRecipient, newRate )
						).to.be.fulfilled
					})
				})
				describe( CONTRACT.METHODS.setTreasury.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newTreasury = operator.address
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setTreasury( newTreasury ),
							contract,
							operator.address
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newTreasury = users[ TOKEN_OWNER ].address
						await expect(
							contract
								.connect( operator )
								.setTreasury( newTreasury )
						).to.be.fulfilled
					})
				})
				describe( CONTRACT.METHODS.setWhitelist.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const newSigner = users[ SIGNER_WALLET ]
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.setWhitelist( newSigner.address ),
							contract,
							operator.address
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newSigner = users[ SIGNER_WALLET ]
						await expect(
							contract
								.connect( operator )
								.setWhitelist( newSigner.address )
						).to.be.fulfilled
					})
				})
				describe( CONTRACT.METHODS.withdraw.SIGNATURE, function () {
					it( `Should be reverted when caller is not contract owner`, async function () {
						const operator = users[ TOKEN_OWNER ]
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect( operator )
								.withdraw(),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when contract balance is 0`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						await shouldRevertWhenContractHasNoBalance(
							contract
								.connect( operator )
								.withdraw(),
							contract
						)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721NoWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Template721 after setting state to PRIVATE_SALE`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mintPrivate.SIGNATURE, function () {
					it( `Should be reverted when whitelist is not set`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenWitelistIsNotSet(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract
						)
					})
				})
				describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
					it( `Should be reverted when contract state is PRIVATE_SALE`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldRevertWhenContractStateIsIncorrect(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							currentState
						)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721WithWhitelist ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Template721 after setting the whitelist`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mintPrivate.SIGNATURE, function () {
					it( `Should be reverted when trying to mint 0 tokens`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = 0
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenQtyIsZero(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract
						)
					})
					it( `Should be reverted when trying to use an invalid proof`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ FAKE_SIGNER ] )
						)
						await shouldRevertWhenNotWhitelisted(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when trying to mint more than alloted`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT + 1
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenNotWhitelisted(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							operator.address
						)
					})
					it( `Should be reverted when trying to mint without paying enough`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = 0
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenIncorrectAmountPaid(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							price,
							expected
						)
					})
					it( `Should be reverted when paying too much`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected + 1
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenIncorrectAmountPaid(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							price,
							expected
						)
					})
					describe( `Should be fulfilled under normal conditions`, function () {
						beforeEach( async function () {
							const operator = users[ TOKEN_OWNER ]
							const currentState = CONTRACT_STATE.PRIVATE_SALE
							const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
							const qty = TEST.WHITELIST_AMOUNT
							const newToken = TEST.FIRST_TOKEN
							const account = users[ TOKEN_OWNER ]
							const alloted = TEST.WHITELIST_AMOUNT
							const expected = tokenPrice.mul( qty )
							const price = expected
							const tx_params = { value : price }
							const hashBuffer = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
							)
							const proof = serializeProof(
								createProof( hashBuffer, users[ SIGNER_WALLET ] )
							)
							await shouldEmitTransferEvent(
								contract
									.connect( operator )
									.mintPrivate( qty, alloted, proof, tx_params ),
								contract,
								ethers.constants.AddressZero,
								operator.address,
								newToken
							)
							expect(
								await contract.balanceOf( operator.address )
							).to.equal( qty )
							expect(
								await contract.ownerOf( newToken )
							).to.equal( operator.address )
							expect(
								await contract.supplyMinted()
							).to.equal( qty )
						})
						it( `Should be reverted when whitelist has been consumed`, async function () {
							const operator = users[ TOKEN_OWNER ]
							const currentState = CONTRACT_STATE.PRIVATE_SALE
							const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
							const qty = TEST.WHITELIST_AMOUNT
							const account = users[ TOKEN_OWNER ]
							const alloted = TEST.WHITELIST_AMOUNT
							const expected = tokenPrice.mul( qty )
							const price = expected
							const tx_params = { value : price }
							const hashBuffer = generateHashBuffer(
								[ 'uint8', 'uint256', 'address' ],
								[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
							)
							const proof = serializeProof(
								createProof( hashBuffer, users[ SIGNER_WALLET ] )
							)
							await shouldRevertWhenWhitelistIsConsumed(
								contract
									.connect( operator )
									.mintPrivate( qty, alloted, proof, tx_params ),
								contract,
								operator.address
							)
						})
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721PublicSale ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Template721 after setting state to PUBLIC_SALE`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mintPrivate.SIGNATURE, function () {
					it( `Should be reverted when contract state is PUBLIC_SALE`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await shouldRevertWhenContractStateIsIncorrect(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							currentState
						)
					})
				})
				describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
					it( `Should be reverted when trying to mint 0 tokens`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = 0
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldRevertWhenQtyIsZero(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract
						)
					})
					it( `Should be reverted when trying to mint more tokens than the max allowed per transaction`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.MAX_BATCH + 1
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldRevertWhenQtyOverMaxBatch(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							qty,
							TEST.MAX_BATCH
						)
					})
					it( `Should be reverted when trying to mint without paying enough`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = 0
						const tx_params = { value : price }
						await shouldRevertWhenIncorrectAmountPaid(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							price,
							expected
						)
					})
					it( `Should be reverted when paying too much`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected + 1
						const tx_params = { value : price }
						await shouldRevertWhenIncorrectAmountPaid(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							price,
							expected
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const newToken = TEST.FIRST_TOKEN
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldEmitTransferEvent(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							ethers.constants.AddressZero,
							operator.address,
							newToken
						)
						expect(
							await contract.balanceOf( operator.address )
						).to.equal( qty )
						expect(
							await contract.ownerOf( newToken )
						).to.equal( operator.address )
						expect(
							await contract.supplyMinted()
						).to.equal( qty )
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721AfterMint ( fixture, TEST, CONTRACT ) {
		shouldBehaveLikeERC721BatchAfterMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchEnumerableAfterMint( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC721BatchMetadata( fixture, TEST, CONTRACT )
		shouldBehaveLikeERC2981( fixture, TEST, CONTRACT )

		describe( `Should behave like Template721 after some tokens have been minted`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.supplyMinted.SIGNATURE, function () {
					it( `Should be ${ TEST.MINTED_SUPPLY }`, async function () {
						expect(
							await contract.supplyMinted()
						).to.equal( TEST.MINTED_SUPPLY )
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				describe( CONTRACT.METHODS.reduceSupply.SIGNATURE, function () {
					it( `Should be reverted when new supply is smaller than current supply`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newSupply = TEST.MINTED_SUPPLY - 1
						await shouldRevertWhenInvalidMaxSupply(
							contract
								.connect( operator )
								.reduceSupply( newSupply ),
							contract
						)
					})
				})
				describe( CONTRACT.METHODS.setBaseURI.SIGNATURE, function () {
					it( `Should be fulfilled under normal conditions`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const newURI = TEST.NEW_BASE_URI
						const tokenId = TEST.TARGET_TOKEN
						await expect(
							contract
								.connect( operator )
								.setBaseURI( newURI )
						).to.be.fulfilled
						expect(
							await contract.tokenURI( tokenId )
						).to.equal( `${ newURI }${ tokenId }` )
					})
				})
				describe( CONTRACT.METHODS.withdraw.SIGNATURE, function () {
					it( `Should be reverted when treasury is unable to receive eth`, async function () {
						const non_eth_receiver_artifact = await ethers.getContractFactory( 'Mock_Invalid_Eth_Receiver' )
						const non_eth_receiver = await non_eth_receiver_artifact.deploy( contract.address )
						const newTreasury = non_eth_receiver.address
						const totalAmount = TEST.SALE_PRICE.PUBLIC_SALE.mul( TEST.MINTED_SUPPLY )
						const operator = users[ CONTRACT_DEPLOYER ]
						await contract
							.connect( operator )
							.setTreasury( newTreasury )
						await shouldRevertWhenEtherTransferFails(
							contract
								.connect( operator )
								.withdraw(),
							contract,
							newTreasury,
							totalAmount
						)
					})
					it( `Should be fulfilled under normal conditions`, async function () {
						const totalAmount = TEST.SALE_PRICE.PUBLIC_SALE.mul( TEST.MINTED_SUPPLY )
						const operator = users[ CONTRACT_DEPLOYER ]
						const treasury = users[ TREASURY ]
						const accounts = [
							contract,
							treasury,
						]
						const amounts = [
							ethers.constants.Zero.sub( totalAmount ),
							totalAmount,
						]
						await expect(
							contract
								.connect( operator )
								.withdraw()
						).to.changeEtherBalances( accounts, amounts )
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeTemplate721AfterMintingOut ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like Template721 after the collection is sold out`, function () {
			beforeEach( async function () {
				const {
					test_user1,
					test_user2,
					test_treasury,
					test_contract,
					test_token_owner,
					test_other_owner,
					test_fake_signer,
					test_signer_wallet,
					test_royalty_recipient,
					test_contract_deployer,
				} = await loadFixture( fixture )

				contract = test_contract
				users[ USER1 ] = test_user1
				users[ USER2 ] = test_user2
				users[ TREASURY ] = test_treasury
				users[ TOKEN_OWNER ] = test_token_owner
				users[ OTHER_OWNER ] = test_other_owner
				users[ FAKE_SIGNER ] = test_fake_signer
				users[ SIGNER_WALLET ] = test_signer_wallet
				users[ ROYALTY_RECIPIENT ] = test_royalty_recipient
				users[ CONTRACT_DEPLOYER ] = test_contract_deployer
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe( CONTRACT.METHODS.supplyMinted.SIGNATURE, function () {
					it( `Should be ${ TEST.MAX_SUPPLY }`, async function () {
						expect(
							await contract.supplyMinted()
						).to.equal( TEST.MAX_SUPPLY )
					})
				})
			// **************************************

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe( CONTRACT.METHODS.mintPrivate.SIGNATURE, function () {
					it( `Should be reverted when minting with no remaining supply`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PRIVATE_SALE
						const tokenPrice = TEST.SALE_PRICE.PRIVATE_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const account = users[ TOKEN_OWNER ]
						const alloted = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						const hashBuffer = generateHashBuffer(
							[ 'uint8', 'uint256', 'address' ],
							[ CONTRACT_STATE.PRIVATE_SALE, TEST.WHITELIST_AMOUNT, account.address ]
						)
						const proof = serializeProof(
							createProof( hashBuffer, users[ SIGNER_WALLET ] )
						)
						await contract
							.connect( users[ CONTRACT_DEPLOYER ] )
							.setContractState( currentState )
						await shouldRevertWhenMintedOut(
							contract
								.connect( operator )
								.mintPrivate( qty, alloted, proof, tx_params ),
							contract,
							qty,
							0
						)
					})
				})
				describe( CONTRACT.METHODS.mintPublic.SIGNATURE, function () {
					it( `Should be reverted when minting with no remaining supply`, async function () {
						const operator = users[ TOKEN_OWNER ]
						const currentState = CONTRACT_STATE.PUBLIC_SALE
						const tokenPrice = TEST.SALE_PRICE.PUBLIC_SALE
						const qty = TEST.WHITELIST_AMOUNT
						const expected = tokenPrice.mul( qty )
						const price = expected
						const tx_params = { value : price }
						await shouldRevertWhenMintedOut(
							contract
								.connect( operator )
								.mintPublic( qty, tx_params ),
							contract,
							qty,
							0
						)
					})
				})
			// **************************************

			// **************************************
			// *****       CONTRACT_OWNER       *****
			// **************************************
				describe( CONTRACT.METHODS.airdrop.SIGNATURE, function () {
					it( `Should be reverted when minting with no remaining supply`, async function () {
						const operator = users[ CONTRACT_DEPLOYER ]
						const accounts = [
							users[ TOKEN_OWNER ].address,
						]
						const amounts = [
							TEST.AIRDROP1,
						]
						await shouldRevertWhenReserveDepleted(
							contract
								.connect( operator )
								.airdrop( accounts, amounts ),
							contract,
							TEST.AIRDROP1,
							0
						)
					})
				})
			// **************************************
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	CONTRACT_STATE,
	shouldBehaveLikeTemplate721AtDeploy,
	shouldBehaveLikeTemplate721NoWhitelist,
	shouldBehaveLikeTemplate721WithWhitelist,
	shouldBehaveLikeTemplate721PublicSale,
	shouldBehaveLikeTemplate721AfterMint,
	shouldBehaveLikeTemplate721AfterMintingOut,
}
