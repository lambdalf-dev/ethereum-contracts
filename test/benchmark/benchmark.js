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
	let user1
	let user2
	let erc721a
	let erc721batch
// **************************************

// **************************************
// *****          TEST RUN          *****
// **************************************
describe("benchmark", function () {
	beforeEach(async function () {
		const [
			test_contract_deployer,
			test_user1,
			test_user2,
			...addrs
		] = await ethers.getSigners()

		const erc721a_artifact = await ethers.getContractFactory("Bench_ERC721A")
		erc721a = await erc721a_artifact.deploy()
		await erc721a.deployed()

		const erc721batch_artifact = await ethers.getContractFactory("Bench_ERC721Batch")
		erc721batch = await erc721batch_artifact.deploy()
		await erc721batch.deployed()

		user1 = test_user1
		user2 = test_user2
	})

	if (true) {
		it("benchmark mint1", async function () {
			await erc721a.connect(user1).mint1()
			await erc721batch.connect(user1).mint1()
			expect(await erc721a.balanceOf(user1.address)).to.equal(1)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(1)
		})
	}

	if (true) {
		it("benchmark mint2", async function () {
			await erc721a.connect(user1).mint2()
			await erc721batch.connect(user1).mint2()
			expect(await erc721a.balanceOf(user1.address)).to.equal(2)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(2)
		})
	}

	if (true) {
		it("benchmark mint3", async function () {
			await erc721a.connect(user1).mint3()
			await erc721batch.connect(user1).mint3()
			expect(await erc721a.balanceOf(user1.address)).to.equal(3)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(3)
		})
	}

	if (true) {
		it("benchmark mint5", async function () {
			await erc721a.connect(user1).mint5()
			await erc721batch.connect(user1).mint5()
			expect(await erc721a.balanceOf(user1.address)).to.equal(5)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(5)
		})
	}

	if (true) {
		it("benchmark mint10", async function () {
			await erc721a.connect(user1).mint10()
			await erc721batch.connect(user1).mint10()
			expect(await erc721a.balanceOf(user1.address)).to.equal(10)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(10)
		})
	}

	if (true) {
		it("benchmark mint20", async function () {
			await erc721a.connect(user1).mint20()
			await erc721batch.connect(user1).mint20()
			expect(await erc721a.balanceOf(user1.address)).to.equal(20)
			expect(await erc721batch.balanceOf(user1.address)).to.equal(20)
		})
	}

	if (true) {
		it("benchmark transfer first", async function () {
			await erc721a.connect(user1).mint20()
			await erc721batch.connect(user1).mint20()
			await erc721a.connect(user1).transferFrom(user1.address, user2.address, 0)
			await erc721batch.connect(user1).transferFrom(user1.address, user2.address, 1)
			expect(await erc721a.balanceOf(user2.address)).to.equal(1)
			expect(await erc721batch.balanceOf(user2.address)).to.equal(1)
		})
	}

	if (true) {
		it("benchmark transfer middle", async function () {
			await erc721a.connect(user1).mint20()
			await erc721batch.connect(user1).mint20()
			await erc721a.connect(user1).transferFrom(user1.address, user2.address, 9)
			await erc721batch.connect(user1).transferFrom(user1.address, user2.address, 10)
			expect(await erc721a.balanceOf(user2.address)).to.equal(1)
			expect(await erc721batch.balanceOf(user2.address)).to.equal(1)
		})
	}

	if (true) {
		it("benchmark transfer last", async function () {
			await erc721a.connect(user1).mint20()
			await erc721batch.connect(user1).mint20()
			await erc721a.connect(user1).transferFrom(user1.address, user2.address, 19)
			await erc721batch.connect(user1).transferFrom(user1.address, user2.address, 20)
			expect(await erc721a.balanceOf(user2.address)).to.equal(1)
			expect(await erc721batch.balanceOf(user2.address)).to.equal(1)
		})
	}
})
