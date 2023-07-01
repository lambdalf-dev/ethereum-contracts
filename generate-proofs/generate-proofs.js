require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
const fs = require( 'fs' )
const {
	keccak256,
	toBuffer,
	ecsign,
	bufferToHex,
	privateToAddress,
} = require( `ethereumjs-utils` )
const crypto = require( `crypto` )
const whitelist = require( `./whitelist` )

const normalize = ( account ) => {
	try {
		return { addr: ethers.utils.getAddress( account ), pass: true }
	}
	catch( err ) {
    console.warn( err )
    return { addr: account, pass: false }
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

const recordProofCSV = async ( account, whitelistType, maxQty, proof ) => {
	fs.appendFile( `proofs.csv`, 'NULL,' + whitelistType + ',' + account + ',' + maxQty + ',' + writeProof( proof ) + '\n', function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
}

const recordProofJSON = async ( account, whitelistType, maxQty, proof ) => {
	fs.appendFileSync( `proofs.js`, `\t"${ account }":{\n\t\talloted:${ maxQty },\n\t\twhitelistType:${ whitelistType },\n\t\tproof:${ printProof( proof ) }\n\t},\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
}

const generateProofs = async ( accesslist, signer ) => {
	let _normalized_ = {}
	fs.appendFileSync( `proofs.js`, `const whitelist = {\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
	const values = Object.entries( accesslist ).map(
		async ( [ account, whitelistInfo ] ) => {
			const { addr, pass } = normalize( account )
			if ( pass ) {
				const _hashBuffer_ = generateHashBuffer(
					[ 'uint8', 'uint256', 'address' ],
					[ whitelistInfo.type, whitelistInfo.amount, addr ]
				)
				const _proof_ = serializeProof(
					createProof( _hashBuffer_, signer )
				)

				_normalized_[ addr ] = _proof_
				console.log( addr + ',' + printProof( _proof_ ) )
				await recordProofJSON( addr, whitelistInfo.type, whitelistInfo.amount, _proof_ )
			}
			// await recordProofCSV( addr, whitelistInfo.type, whitelistInfo.amount, _proof_ )
			return addr
		}
	)
	fs.appendFileSync( `proofs.js`, `}\n`, function ( err ) {
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

		const signer = typeof signerkey === 'undefined' || typeof signeraddress === 'undefined' ? getSignerWallet() : { privateKey: signerkey, address: signeraddress}

		await generateProofs( whitelist, signer )

		console.log( 'SIGNER:' )
		console.log( signer.privateKey )
		console.log( signer.address )
	})
