require("dotenv").config()
require("@nomiclabs/hardhat-ethers")

const fs = require( 'fs' )
const {
	keccak256,
	toBuffer,
	ecsign,
	bufferToHex,
	privateToAddress,
} = require( `ethereumjs-utils` )
const crypto = require( `crypto` )

const normalize = ( account ) => {
  try {
    return ethers.utils.getAddress( account )
  }
  catch( err ) {
    // console.warn( err )
    return account
  }
}

const getSignerWallet = () => {
	const pvtKey = crypto.randomBytes( 32 )
	const pvtKeyStr = pvtKey.toString( 'hex' )
	const signerAddress = normalize( privateToAddress( pvtKey ).toString( 'hex' ) )
	return {
		address    : signerAddress,
		privateKey : pvtKeyStr
	}
}

const createProof = ( hashBuffer, signer ) => {
	const signerKey = typeof signer.privateKey !== 'undefined' ? signer.privateKey : ''
	const bufferKey = Buffer.from( signerKey, 'hex' )
	return ecsign( hashBuffer, bufferKey )
}

const generateHashBuffer = ( typesArray, valuesArray ) => {
	return keccak256(
		toBuffer(
			ethers.utils.defaultAbiCoder.encode( typesArray, valuesArray )
		)
	)
}

const serializeProof = ( proof ) => {
	return {
		r: bufferToHex( proof.r ),
		s: bufferToHex( proof.s ),
		v: proof.v
	}
}

const printProof = ( proof ) => {
	return `'{"r":"${proof.r}","s":"${proof.s}","v":${proof.v}}'`
}

const writeProof = ( proof ) => {
	return `"${ proof.r }","${ proof.s }",${ proof.v }`
}

const recordProofCSV = ( account, whitelistType, maxQty, proof ) => {
	fs.appendFile( `proofs.csv`, 'NULL,' + whitelistType + ',' + account + ',' + maxQty + ',' + writeProof( _proof_ ) + '\n', function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
}

const recordProofJSON = ( account, whitelistType, maxQty, proof ) => {
	fs.appendFile( `proofs.js`, `\t"${ account }":{\n\t\talloted:${ maxQty },\n\t\tproof:${ printProof( _proof_ ) }\n\t},\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
}

const generateProof = ( signer, whitelistedAddress, allotted, whitelistType ) => {
  whitelistedAddress = normalize( whitelistedAddress )
  const _hashBuffer_ = generateHashBuffer(
		[ 'uint8', 'uint256', 'address' ],
		[ whitelistType, allotted, whitelistedAddress ]
 	)
 	const _proof_ = serializeProof(
 		createProof( _hashBuffer_, signer )
 	)

  console.log( whitelistedAddress + ',' + printProof( _proof_ ) )
}

task( 'generate-single-proof', 'generate a proof for the signature based whitelist' )
	.addParam( 'allotted', 'The amount alloted for the address' )
	.addParam( 'signerAddress', 'The signer address' )
	.addParam( 'signerKey', 'The signer private key' )
	.addParam( 'whitelistType', 'The whitelist ID to generate a proof for' )
	.addParam( 'whitelistedAddress', 'The address to generate a signature for' )
	.setAction( async ( taskArgs ) => {
		const allotted = parseInt( taskArgs.allotted )
		const signerAddress = ethers.utils.getAddress( taskArgs.signerAddress )
		const signerKey = taskArgs.signerKey
		const whitelistType = parseInt( taskArgs.whitelistType )
		const whitelistedAddress = ethers.utils.getAddress( taskArgs.whitelistedAddress )

		const signer = { address: normalize( signerAddress ), privateKey: signerKey }

		await generateProof( signer, normalize( whitelistedAddress ), parseInt( allotted ), parseInt( whitelistType ) )

		console.log( 'SIGNER:' )
		console.log( signer.privateKey )
		console.log( signer.address )
	})

// npx hardhat generate-single-proof --allotted 5 --signer-address 0x2bf1BcBa0483099b07d4BEDb99F7bAaebC9eA7b5 --signer-key 3146ed79cde1e9e41431b9c85f46052c86e2a4c8cd62c382dfb7e0e050da955f --whitelist-type 2 --whitelisted-address 0xC8fC994F5F760b351b976aa0a46eE61416895Cc3 