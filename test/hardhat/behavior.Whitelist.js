// **************************************
// *****           IMPORT           *****
// **************************************
  const chai = require(`chai`)
  const chaiAsPromised = require(`chai-as-promised`)
  chai.use(chaiAsPromised)
  const expect = chai.expect
  const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
  const {ethers} = require(`hardhat`)
	const crypto = require(`crypto`)
	const {
		keccak256,
		toBuffer,
		ecsign,
		bufferToHex,
		privateToAddress,
	} = require(`ethereumjs-utils`)
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
  function normalize (account) {
    try {
      return ethers.utils.getAddress(account)
    }
    catch(err) {
      // console.warn(err)
      return account
    }
  }
	function getSignerWallet () {
		const pvtKey = crypto.randomBytes(32)
		const pvtKeyStr = pvtKey.toString('hex')
		const signerAddress = normalize(privateToAddress(pvtKey).toString('hex'))
		return {
			address: signerAddress,
			privateKey: pvtKeyStr
		}
	}
	function createProof (hashBuffer, signer) {
		const signerKey = typeof signer.privateKey !== 'undefined' ? signer.privateKey : ''
		const bufferKey = Buffer.from(signerKey, 'hex')
		return ecsign(hashBuffer, bufferKey)
	}
	function generateHashBuffer (typesArray, valuesArray) {
		return keccak256(
			toBuffer(
				ethers.utils.defaultAbiCoder.encode(typesArray, valuesArray)
			)
		)
	}
	function serializeProof (proof) {
		return {
			r: bufferToHex(proof.r),
			s: bufferToHex(proof.s),
			v: proof.v
		}
	}
	function getProof (whitelistId, alloted, accountAddress, signer) {
		const hashBuffer = generateHashBuffer(
			['uint8', 'uint256', 'address'],
			[whitelistId, alloted, accountAddress]
		)
		const proof = serializeProof(
			createProof(hashBuffer, signer)
		)
		return proof
	}

	// Errors
	async function shouldRevertWhenWitelistIsNotSet (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `WHITELIST_NOT_SET`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	} 
	async function shouldRevertWhenNotWhitelisted (promise, contract, account, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `WHITELIST_FORBIDDEN`)
				.withArgs(account)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}

	// Behavior
	function shouldBehaveLikeWhitelistBeforeSettingWhitelist (fixture, TEST, CONTRACT) {
		describe(`Should behave like Whitelist before setting whitelist`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["FAKE_SIGNER"] = test_fake_signer
				users["SIGNER_WALLET"] = test_signer_wallet
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					it(`Should be reverted when whitelist is not set`, async function () {
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						await shouldRevertWhenWitelistIsNotSet(
							contract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
							contract
						)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeWhitelistAfterSettingWhitelist (fixture, TEST, CONTRACT) {
		describe(`Should behave like Whitelist after setting whitelist`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_royalty_recipient,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["FAKE_SIGNER"] = test_fake_signer
				users["SIGNER_WALLET"] = test_signer_wallet
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.checkWhitelistAllowance.SIGNATURE, function () {
					it(`User cannot access with someone else's proof`, async function () {
						const expected = 0
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, users["USER2"].address, users["SIGNER_WALLET"])
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted, proof)
						).to.equal(expected)
					})
					it(`User cannot forge their own proof`, async function () {
						const expected = 0
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["FAKE_SIGNER"])
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
						).to.equal(expected)
					})
					it(`Whitelisted user cannot access a different whitelist`, async function () {
						const expected = 0
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(TEST.WHITELIST_TYPE_2, alloted, account, users["SIGNER_WALLET"])
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
						).to.equal(expected)
					})
					it(`Whitelisted user cannot access more than they are alloted`, async function () {
						const expected = 0
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted + 1, proof)
						).to.equal(expected)
					})
					it(`Whitelisted user can access`, async function () {
						const expected = TEST.WHITELIST_AMOUNT_1
						const account = users["USER1"].address
						const whitelistId = TEST.WHITELIST_TYPE_1
						const alloted = TEST.WHITELIST_AMOUNT_1
						const proof = getProof(whitelistId, alloted, account, users["SIGNER_WALLET"])
						expect(
							await contract.checkWhitelistAllowance(account, whitelistId, alloted, proof)
						).to.equal(expected)
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
	normalize,
	getSignerWallet,
	createProof,
	generateHashBuffer,
	serializeProof,
	getProof,
	shouldRevertWhenWitelistIsNotSet,
	shouldRevertWhenNotWhitelisted,
	shouldBehaveLikeWhitelistBeforeSettingWhitelist,
	shouldBehaveLikeWhitelistAfterSettingWhitelist,
}
