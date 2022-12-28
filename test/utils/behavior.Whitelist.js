// **************************************
// *****           IMPORT           *****
// **************************************
	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
	const { ethers } = require( `hardhat` )
	const {
		keccak256,
		toBuffer,
		ecsign,
		bufferToHex,
		privateToAddress,
	} = require( `ethereumjs-utils` )
	const crypto = require( `crypto` )
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
  // Merkle Proof Whitelist
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
    if ( maxQty ) {
      const hashed = ethers.utils.keccak256( account )
      proof.push( ...merkle.getHexProof( hashed ) )
      return maxQty
    }
    else {
      return false
    }
  }
	// Signature Whitelist
	function getSignerWallet () {
		const pvtKey    = crypto.randomBytes( 32 )
		const pvtKeyStr = pvtKey.toString( 'hex' )
		const signerAddress = normalize( privateToAddress( pvtKey ).toString( 'hex' ) )
		return {
			address    : signerAddress,
			privateKey : pvtKeyStr
		}
	}
	function createProof ( hashBuffer, signer ) {
		const signerKey = typeof signer.privateKey !== 'undefined' ? signer.privateKey : ''
		const bufferKey = Buffer.from( signerKey, 'hex' )
		return ecsign( hashBuffer, bufferKey )
	}
	function generateHashBuffer ( typesArray, valuesArray ) {
		return keccak256(
			toBuffer(
				ethers.utils.defaultAbiCoder.encode( typesArray, valuesArray )
			)
		)
	}
	function serializeProof ( proof ) {
		return {
			r: bufferToHex( proof.r ),
			s: bufferToHex( proof.s ),
			v: proof.v
		}
	}
	// Errors
	async function shouldRevertWhenWitelistIsNotSet ( promise, contract, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `Whitelist_NOT_SET` )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	} 
	async function shouldRevertWhenWhitelistIsConsumed ( promise, contract, account, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `Whitelist_CONSUMED` )
				.withArgs( account )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
	async function shouldRevertWhenNotWhitelisted ( promise, contract, account, error ) {
		if ( typeof error === 'undefined' ) {
			await expect( promise )
				.to.be.revertedWithCustomError( contract, `Whitelist_FORBIDDEN` )
				.withArgs( account )
		}
		else {
			await expect( promise )
				.to.be.revertedWith( error )
		}
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	normalize,
	generateRoot,
	getSignerWallet,
	getProof,
	createProof,
	generateHashBuffer,
	serializeProof,
	shouldRevertWhenWitelistIsNotSet,
	shouldRevertWhenWhitelistIsConsumed,
	shouldRevertWhenNotWhitelisted,
}
