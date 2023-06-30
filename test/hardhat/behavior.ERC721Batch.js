// **************************************
// *****           IMPORT           *****
// **************************************
  const chai = require(`chai`)
  const chaiAsPromised = require(`chai-as-promised`)
  chai.use(chaiAsPromised)
  const expect = chai.expect
  const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
  const {ethers} = require(`hardhat`)

	const {
		INTERFACE_ID,
		shouldSupportInterface,
	} = require(`./behavior.IERC165`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}

	// Custom ERC721ReceiverError type for testing the transfer to ERC721Receiver (copied from Open Zeppelin)
	const ERC721ReceiverError = [`None`, `RevertWithERC721ReceiverError`, `RevertWithMessage`, `RevertWithoutMessage`, `Panic`]
		.reduce((acc, entry, idx) => Object.assign({[entry]: idx}, acc), {})
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
	// Events
	// IERC721
	async function shouldEmitApprovalEvent (promise, contract, owner, approved, tokenId) {
		await expect(promise)
			.to.emit(contract, `Approval`)
			.withArgs(owner, approved, tokenId)
	}
	async function shouldEmitApprovalForAllEvent (promise, contract, owner, operator, approved) {
		await expect(promise)
			.to.emit(contract, `ApprovalForAll`)
			.withArgs(owner, operator, approved)
	}
	async function shouldEmitTransferEvent (promise, contract, from, to, tokenId) {
		await expect(promise)
			.to.emit(contract, `Transfer`)
			.withArgs(from, to, tokenId)
	}
	// IERC2309
	async function shouldEmitConsecutiveTransferEvent (promise, contract, fromTokenId, toTokenId, fromAddress, toAddress, logNumber = 0) {
		const tx = await promise
		const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
		const interface = new ethers.utils.Interface([`event ConsecutiveTransfer(uint256 indexed fromTokenId, uint256 toTokenId, address indexed fromAddress, address indexed toAddress)`])
		const data = receipt.logs[logNumber].data
		const topics = receipt.logs[logNumber].topics
		const event = interface.decodeEventLog(`ConsecutiveTransfer`, data, topics)
		expect(event.fromTokenId.toString()).to.equal(fromTokenId.toString())
		expect(event.toTokenId.toString()).to.equal(toTokenId.toString())
		expect(event.fromAddress).to.equal(fromAddress)
		expect(event.toAddress).to.equal(toAddress)
	}

	// Errors
	// IERC721
	async function shouldRevertWhenCallerIsNotApproved (promise, contract, operator, tokenId, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721_CALLER_NOT_APPROVED`)
				.withArgs(operator, tokenId)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenApprovingTokenOwner (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721_INVALID_APPROVAL`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenTransferingToInvalidReceiver (promise, contract, receiver, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721_INVALID_RECEIVER`)
				.withArgs(receiver)
		}
		else {
			if (error == ERC721ReceiverError.RevertWithERC721ReceiverError) {
				const receiverContract = new ethers.Contract(receiver, '[{"inputs": [{"internalType": "bytes4","name": "retval","type": "bytes4"},{"internalType": "enum Mock_ERC721Receiver.Error","name": "error","type": "uint8"}],"stateMutability": "nonpayable","type": "constructor"},{"inputs": [],"name": "ERC721ReceiverError","type": "error"}]', contract.provider)
				await expect(promise)
					.to.be.revertedWithCustomError(receiverContract, `ERC721ReceiverError`)
			}
			else if (error == ERC721ReceiverError.Panic) {
				await expect(promise)
					.to.be.reverted
			}
			else {
				await expect(promise)
					.to.be.revertedWith(`Mock_ERC721Receiver: reverting`)
			}
		}
	}
	async function shouldRevertWhenCheckingInvalidTokenOwner (promise, contract, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721_INVALID_TOKEN_OWNER`)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenRequestedTokenDoesNotExist (promise, contract, tokenId, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721_NONEXISTANT_TOKEN`)
				.withArgs(tokenId)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	// IERC721Enumerable
	async function shouldRevertWhenIndexOutOfBounds (promise, contract, index, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721Enumerable_INDEX_OUT_OF_BOUNDS`)
				.withArgs(index)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}
	async function shouldRevertWhenOwnerIndexOutOfBounds (promise, contract, index, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC721Enumerable_OWNER_INDEX_OUT_OF_BOUNDS`)
				.withArgs(index)
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}

	// Behavior
	function shouldBehaveLikeIERC721 (fixture, TEST, CONTRACT) {
		describe(`Should behave like IERC721`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****           PUBLIC           *****
			// **************************************
				describe(CONTRACT.METHODS.approve.SIGNATURE, function () {
					it(`Should be reverted when requested token does not exist`, async function () {
						const operator = users["USER1"]
						const to = users["USER2"].address
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract,
							tokenId
						)
					})
					it(`Should be reverted when caller is not approved operator`, async function () {
						const operator = users["USER1"]
						const to = operator.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract,
							operator.address,
							tokenId
						)
					})
					it(`Should be reverted when approving current token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const to = operator.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenApprovingTokenOwner(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract
						)
					})
					it(`Should be fulfilled when caller is token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const to = users["USER1"].address
						const tokenId = TEST.TARGET_TOKEN
						await shouldEmitApprovalEvent(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract,
							operator.address,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(to)
					})
					it(`Should be fulfilled when caller is individually approved operator`, async function () {
						const operator = users["USER1"]
						const to = users["USER2"].address
						const tokenId = TEST.TARGET_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.approve(operator.address, tokenId)
						await shouldEmitApprovalEvent(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract,
							users["TOKEN_OWNER"].address,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(to)
					})
					it(`Should be fulfilled when caller is approved to manage all of the token owner's tokens`, async function () {
						const operator = users["USER1"]
						const to = users["USER2"].address
						const tokenId = TEST.TARGET_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.setApprovalForAll(operator.address, true)
						await shouldEmitApprovalEvent(
							contract
								.connect(operator)
								.approve(to, tokenId),
							contract,
							users["TOKEN_OWNER"].address,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(to)
					})
				})
				describe(CONTRACT.METHODS.safeTransferFrom.SIGNATURE, function () {
					it(`Should be reverted when requested token does not exist`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							tokenId
						)
					})
					it(`Should be reverted when transfering to the Zero address`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = ethers.constants.AddressZero
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering from another address than the token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["USER1"].address
						const to = from
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCheckingInvalidTokenOwner(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract
						)
					})
					it(`Should be reverted when operator is not approved`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = operator.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							operator.address,
							tokenId
						)
					})
					it(`Should be reverted when transfering to non ERC721Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory('Mock_NonERC721Receiver')
						const non_holder = await non_holder_artifact.deploy()

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = non_holder.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithERC721ReceiverError
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to,
							error
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to,
							error
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							to,
							error
						)
					})
					it(`Should be fulfilled when caller is token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should be fulfilled when caller is individually approved operator`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.approve(operator.address, tokenId)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(ethers.constants.AddressZero)
					})
					it(`Should be fulfilled when caller is approved to manage all of the token owner's tokens`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.setApprovalForAll(operator.address, true)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should appropriately update token balances`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await expect(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom.SIGNATURE](from, to, tokenId)
						).to.changeTokenBalances(
							contract,
							[operator, users["USER1"]],
							[-1, 1]
						)
					})
				})
				describe(CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE, function () {
					it(`Should be reverted when requested token does not exist`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.UNMINTED_TOKEN
						const data = "0x"
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							tokenId
						)
					})
					it(`Should be reverted when transfering to the Zero address`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = ethers.constants.AddressZero
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering from another address than the token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["USER1"].address
						const to = from
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenCheckingInvalidTokenOwner(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract
						)
					})
					it(`Should be reverted when operator is not approved`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = operator.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							operator.address,
							tokenId
						)
					})
					it(`Should be reverted when transfering to non ERC721Receiver contract`, async function () {
						const non_holder_artifact = await ethers.getContractFactory('Mock_NonERC721Receiver')
						const non_holder = await non_holder_artifact.deploy()

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = non_holder.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract returning unexpected value`, async function () {
						const retval = INTERFACE_ID.IERC165
						const error = ERC721ReceiverError.None
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts with custom error`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithERC721ReceiverError
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to,
							error
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts with message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithMessage
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to,
							error
						)
					})
					it(`Should be reverted when transfering to a receiver contract that reverts without message`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.RevertWithoutMessage
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering to a receiver contract that panics`, async function () {
						const retval = INTERFACE_ID.IERC721Receiver
						const error = ERC721ReceiverError.Panic
						const holder_artifact = await ethers.getContractFactory('Mock_ERC721Receiver')
						const invalidReceiver = await holder_artifact.deploy(retval, error)

						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = invalidReceiver.address
						const tokenId = TEST.TARGET_TOKEN
						const data = "0x"
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							to,
							error
						)
					})
					it(`Should be fulfilled when caller is token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						const data = "0x"
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should be fulfilled when caller is individually approved operator`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						const data = "0x"
						await contract
							.connect(users["TOKEN_OWNER"])
							.approve(operator.address, tokenId)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							from,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(ethers.constants.AddressZero)
					})
					it(`Should be fulfilled when caller is approved to manage all of the token owner's tokens`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						const data = "0x"
						await contract
							.connect(users["TOKEN_OWNER"])
							.setApprovalForAll(operator.address, true)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should appropriately update token balances`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						const data = "0x"
						await expect(
							contract
								.connect(operator)
								.functions[CONTRACT.METHODS.safeTransferFrom_ol.SIGNATURE](from, to, tokenId, data)
						).to.changeTokenBalances(
							contract,
							[operator, users["USER1"]],
							[-1, 1]
						)
					})
				})
				describe(CONTRACT.METHODS.setApprovalForAll.SIGNATURE, function () {
					it(`Should be reverted when trying to allow self`, async function () {
						const operator = users["USER1"]
						const approvedOperator = users["USER1"].address
						const approved = true
						await shouldRevertWhenApprovingTokenOwner(
							contract
								.connect(operator)
								.setApprovalForAll(approvedOperator, approved),
							contract
						)
					})
					it(`Should be fulfilled when approving other address`, async function () {
						const operator = users["TOKEN_OWNER"]
						const approvedOperator = users["USER1"].address
						const approved = true
						await shouldEmitApprovalForAllEvent(
							contract
								.connect(operator)
								.setApprovalForAll(approvedOperator, approved),
							contract,
							operator.address,
							approvedOperator,
							approved
						)
						expect(
							await contract.isApprovedForAll(operator.address, approvedOperator)
						).to.be.true
					})
					it(`Should be fulfilled when disapproving other address`, async function () {
						const operator = users["TOKEN_OWNER"]
						const approvedOperator = users["USER1"].address
						const approved = false
						await contract
							.connect(operator)
							.setApprovalForAll(approvedOperator, true)
						await shouldEmitApprovalForAllEvent(
							contract
								.connect(operator)
								.setApprovalForAll(approvedOperator, approved),
							contract,
							operator.address,
							approvedOperator,
							approved
						)
						expect(
							await contract.isApprovedForAll(operator.address, approvedOperator)
						).to.be.false
					})
				})
				describe(CONTRACT.METHODS.transferFrom.SIGNATURE, function () {
					it(`Should be reverted when requested token does not exist`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							tokenId
						)
					})
					it(`Should be reverted when transfering to the Zero address`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["TOKEN_OWNER"].address
						const to = ethers.constants.AddressZero
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenTransferingToInvalidReceiver(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							to
						)
					})
					it(`Should be reverted when transfering from another address than the token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = users["USER1"].address
						const to = from
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCheckingInvalidTokenOwner(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract
						)
					})
					it(`Should be reverted when operator is not approved`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = operator.address
						const tokenId = TEST.TARGET_TOKEN
						await shouldRevertWhenCallerIsNotApproved(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							operator.address,
							tokenId
						)
					})
					it(`Should be fulfilled when caller is token owner`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should be fulfilled when caller is individually approved operator`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.approve(operator.address, tokenId)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
						expect(
							await contract.getApproved(tokenId)
						).to.equal(ethers.constants.AddressZero)
					})
					it(`Should be fulfilled when caller is approved to manage all of the token owner's tokens`, async function () {
						const operator = users["USER1"]
						const from = users["TOKEN_OWNER"].address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await contract
							.connect(users["TOKEN_OWNER"])
							.setApprovalForAll(operator.address, true)
						await shouldEmitTransferEvent(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId),
							contract,
							from,
							to,
							tokenId
						)
					})
					it(`Should appropriately update token balances`, async function () {
						const operator = users["TOKEN_OWNER"]
						const from = operator.address
						const to = users["USER1"].address
						const tokenId = TEST.FIRST_TOKEN
						await expect(
							contract
								.connect(operator)
								.transferFrom(from, to, tokenId)
						).to.changeTokenBalances(
							contract,
							[operator, users["USER1"]],
							[-1, 1]
						)
					})
				})
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.balanceOf.SIGNATURE, function () {
					it(`Should be reverted when checking the balance of the Zero address`, async function () {
						const tokenOwner = ethers.constants.AddressZero
						await shouldRevertWhenCheckingInvalidTokenOwner(
							contract.balanceOf(tokenOwner),
							contract
						)
					})
					it(`Default balance of a user should be 0`, async function () {
						const expected = 0
						const tokenOwner = users["USER1"].address
						expect(
							await contract.balanceOf(tokenOwner)
						).to.equal(expected)
					})
					it(`Balance of token owner should be ${TEST.TOKEN_OWNER_SUPPLY}`, async function () {
						const expected = TEST.TOKEN_OWNER_SUPPLY
						const tokenOwner = users["TOKEN_OWNER"].address
						expect(
							await contract.balanceOf(tokenOwner)
						).to.equal(expected)
					})
					it(`Balance of other owner should be ${TEST.OTHER_OWNER_SUPPLY}`, async function () {
						const expected = TEST.OTHER_OWNER_SUPPLY
						const tokenOwner = users["OTHER_OWNER"].address
						expect(
							await contract.balanceOf(tokenOwner)
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.getApproved.SIGNATURE, function () {
					it(`Should be reverted when requested token does not exist`, async function () {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.getApproved(tokenId),
							contract,
							tokenId
						)
					})
					it(`Should be the Zero address when requested token has not been approved`, async function () {
						const expected = ethers.constants.AddressZero
						const tokenId = TEST.TARGET_TOKEN
						expect(
							await contract.getApproved(tokenId)
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.isApprovedForAll.SIGNATURE, function () {
					it(`Should be FALSE by default`, async function () {
						const tokenOwner = users["USER1"].address
						const operator = users["USER2"].address
						expect(
							await contract.isApprovedForAll(tokenOwner, operator)
						).to.be.false
					})
				})
				describe(CONTRACT.METHODS.ownerOf.SIGNATURE, function () {
					it(`Should be reverted when requesting token number 0`, async function () {
						const tokenId = TEST.INVALID_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.ownerOf(tokenId),
							contract,
							tokenId
						)
					})
					it(`Should be reverted when requested token does not exist`, async function () {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.ownerOf(tokenId),
							contract,
							tokenId
						)
					})
					it(`Owner of token ${TEST.TARGET_TOKEN} should be accurate`, async function () {
						const expected = users["TOKEN_OWNER"].address
						const tokenId = TEST.TARGET_TOKEN
						expect(
							await contract.ownerOf(tokenId)
						).to.equal(expected)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeIERC721EnumerableAtDeploy (fixture, TEST, CONTRACT) {
		describe(`Should behave like IERC721Enumerable after deployment`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.totalSupply.SIGNATURE, function() {
					it(`Total supply should be ${TEST.INIT_SUPPLY} by default`, async function() {
						const expected = TEST.INIT_SUPPLY
						expect(
							await contract.totalSupply()
						).to.equal(expected)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeIERC721EnumerableAfterMint (fixture, TEST, CONTRACT) {
		describe(`Should behave like IERC721Enumerable after minting some tokens`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.tokenByIndex.SIGNATURE, function() {
					it(`Should be reverted when trying to get unminted token index`, async function() {
						const index = TEST.OUT_OF_BOUNDS_INDEX
						await shouldRevertWhenIndexOutOfBounds(
							contract.tokenByIndex(index),
							contract,
							index
						)
					})
					it(`Token at index ${TEST.TARGET_INDEX} should be token ${TEST.TARGET_INDEX + 1}`, async function() {
						const expected = TEST.TARGET_INDEX + 1
						const index = TEST.TARGET_INDEX
						expect(
							await contract.tokenByIndex(index)
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.tokenOfOwnerByIndex.SIGNATURE, function() {
					it(`Should be reverted when checking the balance of the Zero address`, async function () {
						const tokenOwner = ethers.constants.AddressZero
						const index = 0
						await shouldRevertWhenCheckingInvalidTokenOwner(
							contract.tokenOfOwnerByIndex(tokenOwner, index),
							contract
						)
					})
					it(`Should be reverted when trying to get token index of non token owner`, async function() {
						const tokenOwner = users["USER1"].address
						const index = TEST.TARGET_INDEX
						await shouldRevertWhenOwnerIndexOutOfBounds(
							contract.tokenOfOwnerByIndex(tokenOwner, index),
							contract,
							index
						)
					})
					it(`Should be reverted when trying to get unminted token index`, async function() {
						const tokenOwner = users["TOKEN_OWNER"].address
						const index = TEST.OUT_OF_BOUNDS_INDEX
						await shouldRevertWhenOwnerIndexOutOfBounds(
							contract.tokenOfOwnerByIndex(tokenOwner, index),
							contract,
							index
						)
					})
					it(`Token of token owner at index ${TEST.INDEX_ZERO} should be token ${TEST.TOKEN_OWNER_FIRST}`, async function() {
						const expected = TEST.TOKEN_OWNER_FIRST
						const tokenOwner = users["TOKEN_OWNER"].address
						const index = TEST.INDEX_ZERO
						expect(
							await contract.tokenOfOwnerByIndex(tokenOwner, index)
						).to.equal(expected)
					})
					it(`Token of token owner at index ${TEST.TARGET_INDEX} should be token ${(TEST.TOKEN_OWNER_FIRST + TEST.TARGET_INDEX).toString()}`, async function() {
						const expected = TEST.TOKEN_OWNER_FIRST + TEST.TARGET_INDEX
						const tokenOwner = users["TOKEN_OWNER"].address
						const index = TEST.TARGET_INDEX
						expect(
							await contract.tokenOfOwnerByIndex(tokenOwner, index)
						).to.equal(expected)
					})
					it(`Token of token owner at index ${TEST.INDEX_SECOND} should be token ${(TEST.TOKEN_OWNER_INDEX_SECOND).toString()}`, async function() {
						const expected = TEST.TOKEN_OWNER_INDEX_SECOND
						const tokenOwner = users["TOKEN_OWNER"].address
						const index = TEST.INDEX_SECOND
						expect(
							await contract.tokenOfOwnerByIndex(tokenOwner, index)
						).to.equal(expected)
					})
					it(`Token of other owner at index ${TEST.INDEX_ZERO} should be token ${(TEST.OTHER_OWNER_FIRST + TEST.INDEX_ZERO).toString()}`, async function() {
						const expected = TEST.OTHER_OWNER_FIRST + TEST.INDEX_ZERO
						const tokenOwner = users["OTHER_OWNER"].address
						const index = TEST.INDEX_ZERO
						expect(
							await contract.tokenOfOwnerByIndex(tokenOwner, index)
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.totalSupply.SIGNATURE, function() {
					it(`Total supply should be ${TEST.MINTED_SUPPLY}`, async function() {
						const expected = TEST.MINTED_SUPPLY
						expect(
							await contract.totalSupply()
						).to.equal(expected)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeIERC721Metadata (fixture, TEST, CONTRACT) {
		describe(`Should behave like IERC721Metadata`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_user2,
					test_contract,
					test_token_owner,
					test_other_owner,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["USER2"] = test_user2
				users["TOKEN_OWNER"] = test_token_owner
				users["OTHER_OWNER"] = test_other_owner
			})

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.name.SIGNATURE, function () {
					it(`Name should be "${TEST.TOKEN_NAME}"`, async function () {
						const expected = TEST.TOKEN_NAME
						expect(
							await contract.name()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.symbol.SIGNATURE, function () {
					it(`Symbol should be "${TEST.TOKEN_SYMBOL}"`, async function () {
						const expected = TEST.TOKEN_SYMBOL
						expect(
							await contract.symbol()
						).to.equal(expected)
					})
				})
				describe(CONTRACT.METHODS.tokenURI.SIGNATURE, function () {
					it(`Should be reverted when requesting an unminted token`, async function () {
						const tokenId = TEST.UNMINTED_TOKEN
						await shouldRevertWhenRequestedTokenDoesNotExist(
							contract.tokenURI(tokenId),
							contract,
							tokenId
						)
					})
					it(`First token URI should be "${TEST.INIT_BASE_URI}${TEST.FIRST_TOKEN}"`, async function () {
						const expected = `${TEST.INIT_BASE_URI}${TEST.FIRST_TOKEN}`
						const tokenId = TEST.FIRST_TOKEN
						expect(
							await contract.tokenURI(tokenId)
						).to.equal(expected)
					})
					it(`Second token URI should be "${TEST.INIT_BASE_URI}${TEST.SECOND_TOKEN}"`, async function () {
						const expected = `${TEST.INIT_BASE_URI}${TEST.SECOND_TOKEN}`
						const tokenId = TEST.SECOND_TOKEN
						expect(
							await contract.tokenURI(tokenId)
						).to.equal(expected)
					})
				})
			// **************************************
		})
	}
	function shouldBehaveLikeERC721BatchAtDeploy (fixture, TEST, CONTRACT) {
		shouldBehaveLikeIERC721EnumerableAtDeploy(fixture, TEST, CONTRACT)
	}
	function shouldBehaveLikeERC721BatchAfterMint (fixture, TEST, CONTRACT) {
		shouldBehaveLikeIERC721(fixture, TEST, CONTRACT)
		shouldBehaveLikeIERC721EnumerableAfterMint(fixture, TEST, CONTRACT)
		shouldBehaveLikeIERC721Metadata(fixture, TEST, CONTRACT)
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	ERC721ReceiverError,
	shouldEmitApprovalEvent,
	shouldEmitApprovalForAllEvent,
	shouldEmitTransferEvent,
	shouldEmitConsecutiveTransferEvent,
	shouldRevertWhenCallerIsNotApproved,
	shouldRevertWhenApprovingTokenOwner,
	shouldRevertWhenTransferingToInvalidReceiver,
	shouldRevertWhenCheckingInvalidTokenOwner,
	shouldRevertWhenRequestedTokenDoesNotExist,
	shouldRevertWhenIndexOutOfBounds,
	shouldRevertWhenOwnerIndexOutOfBounds,
	shouldBehaveLikeIERC721,
	shouldBehaveLikeIERC721EnumerableAtDeploy,
	shouldBehaveLikeIERC721EnumerableAfterMint,
	shouldBehaveLikeIERC721Metadata,
	shouldBehaveLikeERC721BatchAtDeploy,
	shouldBehaveLikeERC721BatchAfterMint,
}
