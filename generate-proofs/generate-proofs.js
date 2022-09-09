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

const generateProofs = ( accesslist, signer, whitelistType ) => {
  let _normalized_ = {}
  fs.appendFile( `proofs.js`, `const whitelist = {\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
  const values = Object.entries( accesslist ).map(
    ( [ account, maxQty ] ) => {
      account = normalize( account )
      const _hashBuffer_ = generateHashBuffer(
				[ 'uint8', 'uint256', 'address' ],
				[ whitelistType, maxQty, account ]
     	)
     	const _proof_ = serializeProof(
     		createProof( _hashBuffer_, signer )
     	)

      _normalized_[ account ] = _proof_
      console.log( account + ',' + printProof( _proof_ ) )
      recordProofJSON( account, whitelistType, maxQty, proof )
      recordProofCSV( account, whitelistType, maxQty, proof )
      return account
    }
  )
  fs.appendFile( `proofs.js`, `}\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
}

task( 'generate-proofs', 'generate proofs for the signature based whitelist' )
	.addOptionalParam( 'signerkey', 'The signer private key', undefined )
	.addOptionalParam( 'signeraddress', 'The signer address', undefined )
	.setAction( async ( taskArgs ) => {
		const signerkey      = taskArgs.signerkey
		const signeraddress  = taskArgs.signeraddress

		// Mapping from address to max quantity allowed
		const claimList      = {}
		const whitelistTypes = {
			CLAIM : 2,
		}

		const signer = typeof signerkey === 'undefined' || typeof signeraddress === 'undefined' ? getSignerWallet() : { privateKey: signerkey, address: signeraddress}

		await generateProofs( claimList, signer, whitelistTypes.CLAIM )

		console.log( 'SIGNER:' )
		console.log( signer.privateKey )
		console.log( signer.address )
	})
