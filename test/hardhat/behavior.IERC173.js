// **************************************
// *****           IMPORT           *****
// **************************************
  const chai = require(`chai`)
  const chaiAsPromised = require(`chai-as-promised`)
  chai.use(chaiAsPromised)
  const expect = chai.expect
  const {loadFixture} = require(`@nomicfoundation/hardhat-network-helpers`)
  const {ethers} = require(`hardhat`)
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
	// Events
	async function shouldEmitOwnershipTransferredEvent (promise, contract, previousOwner, newOwner) {
		await expect(promise)
			.to.emit(contract, `OwnershipTransferred`)
			.withArgs(previousOwner, newOwner)
	}

	// Errors
	async function shouldRevertWhenCallerIsNotContractOwner (promise, contract, operator, error) {
		if (typeof error === 'undefined') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, `IERC173_NOT_OWNER`)
				.withArgs(operator)
		}
		else if (error == 'custom') {
			await expect(promise)
				.to.be.revertedWithCustomError(contract, 'OnlyOwner')
		}
		else {
			await expect(promise)
				.to.be.revertedWith(error)
		}
	}

	// Behavior
	function shouldBehaveLikeERC173 (fixture, TEST, CONTRACT) {
		describe(`Should behave like ERC173`, function () {
			beforeEach(async function () {
				const {
					test_user1,
					test_contract,
					test_contract_deployer,
				} = await loadFixture(fixture)

				contract = test_contract
				users["USER1"] = test_user1
				users["CONTRACT_DEPLOYER"] = test_contract_deployer
			})

			// **************************************
			// *****       CONTRACT OWNER       *****
			// **************************************
				describe(CONTRACT.METHODS.transferOwnership.SIGNATURE, function () {
					it(`Should be reverted when caller is not contract owner`, async function () {
						const operator = users["USER1"]
						const newOwner = users["USER1"].address
						await shouldRevertWhenCallerIsNotContractOwner(
							contract
								.connect(operator)
								.transferOwnership(newOwner),
							contract,
							newOwner
						)
					})
					it(`Should be fulfilled when caller is contract owner`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newOwner = users["USER1"].address
						await shouldEmitOwnershipTransferredEvent(
							contract
								.connect(operator)
								.transferOwnership(newOwner),
							contract,
							operator.address,
							newOwner
						)
						expect(
							await contract.owner()
						).to.equal(newOwner)
					})
					it(`Should allow contract owner to renounce ownership`, async function () {
						const operator = users["CONTRACT_DEPLOYER"]
						const newOwner = ethers.constants.AddressZero
						await shouldEmitOwnershipTransferredEvent(
							contract
								.connect(operator)
								.transferOwnership(newOwner),
							contract,
							operator.address,
							newOwner
						)
						expect(
							await contract.owner()
						).to.equal(newOwner)
					})
				})
			// **************************************

			// **************************************
			// *****            VIEW            *****
			// **************************************
				describe(CONTRACT.METHODS.owner.SIGNATURE, function () {
					it(`Contract owner should be contract deployer`, async function () {
						const expected = users["CONTRACT_DEPLOYER"].address
						expect(
							await contract.owner()
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
	shouldEmitOwnershipTransferredEvent,
	shouldRevertWhenCallerIsNotContractOwner,
	shouldBehaveLikeERC173,
}
