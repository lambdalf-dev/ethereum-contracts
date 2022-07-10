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
	
	const { MerkleTree } = require( `merkletreejs` )
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
	let contract
	let users = {}
	let normalized = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
  function normalize ( account ) {
    try {
      return ethers.utils.getAddress( account )
    }
    catch( err ) {
      // console.warn( err )
      return account
    }
  }

  function generateRoot ( accesslist ) {
    let _normalized_ = {}
    const _values_ = Object.entries( accesslist ).map(
      ( [ account, maxQty ] ) => {
        account = normalize( account )
        _normalized_[ account ] = maxQty
        return account
      }
    )
    _values_.sort()
    normalized = _normalized_

    const _hashes_ = _values_.map( account => ethers.utils.keccak256( account ) )
    const _merkleTree_ = new MerkleTree( _hashes_, ethers.utils.keccak256, { sortPairs: true } )
    const _merkleRoot_ = _merkleTree_.getRoot().toString( `hex` )
    return { root: _merkleRoot_, tree: _merkleTree_ }
  }

  function getProof ( merkle, account, proof ) {
    account = normalize( account )
    const maxQty = normalized[ account ]
    // console.debug( `MaxQty ${ maxQty }`)
    if ( maxQty ) {
      const hashed = ethers.utils.keccak256( account )
      proof.push( ...merkle.getHexProof( hashed ) )
      return maxQty
    }
    else {
      return false
    }
  }

	async function shouldRevertWhenWitelistIsNotSet ( promise, error = `IWhitelistable_NOT_SET` ) {
		await expect( promise ).to.be.revertedWith( `${ error }()` )
	} 

	async function shouldRevertWhenWhitelistIsConsumed ( promise, account, error = `IWhitelistable_CONSUMED` ) {
		await expect( promise ).to.be.revertedWith( `${ error }("${ account }")` )
	}

	async function shouldRevertWhenNotWhitelisted ( promise, account, error = `IWhitelistable_FORBIDDEN` ) {
		await expect( promise ).to.be.revertedWith( `${ error }("${ account }")` )
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	normalize,
	generateRoot,
	getProof,
	shouldRevertWhenWitelistIsNotSet,
	shouldRevertWhenWhitelistIsConsumed,
	shouldRevertWhenNotWhitelisted,
}
