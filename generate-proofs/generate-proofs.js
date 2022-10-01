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

const generateProofs = async ( accesslist, signer, whitelistType, listName = 'whitelist' ) => {
	let _normalized_ = {}
	fs.appendFileSync( `proofs.js`, `const ${ listName } = {\n`, function ( err ) {
		if ( err ) {
			console.debug( err )
		}
	})
	const values = Object.entries( accesslist ).map(
		async ( [ account, maxQty ] ) => {
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
			await recordProofJSON( account, whitelistType, maxQty, _proof_ )
			// await recordProofCSV( account, whitelistType, maxQty, _proof_ )
			return account
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

		// Mapping from address to max quantity allowed
		const whitelist = {
			'0x90f8E65C4b5ABCa0D640564608123b2853365D02': 2,
			'0xb15Cd1FCEB9F647e8bD5f5BA74a5e3b71870D66E': 2,
			'0x7f51898f14A451C37166a8B0A10616745ECBA206': 2,
			'0x7B0056C0b13978a46720B925A9b0fe4273AAE098': 2,
			'0x034367f5c20eb75Df23ed5B1bB77358639105820': 2,
		}
		const waitlist = {
			'0xA6b3De3bca81f08F53f102fB7cC2EcC816f39496': 2,
			'0xb15Cd1FCEB9F647e8bD5f5BA74a5e3b71870D66E': 2,
			'0x7f51898f14A451C37166a8B0A10616745ECBA206': 2,
			'0x7B0056C0b13978a46720B925A9b0fe4273AAE098': 2,
			'0x034367f5c20eb75Df23ed5B1bB77358639105820': 2,
		}
		const claimlist = {
			'0xb15Cd1FCEB9F647e8bD5f5BA74a5e3b71870D66E': 1,
			'0x3Ebec1F343126c4707FCe01afEC03240713aEbb4': 5,
			'0xA6b3De3bca81f08F53f102fB7cC2EcC816f39496': 3,
			'0x7f51898f14A451C37166a8B0A10616745ECBA206': 5,
			'0x7B0056C0b13978a46720B925A9b0fe4273AAE098': 5,
			'0x034367f5c20eb75Df23ed5B1bB77358639105820': 5,
		}
		const whitelistTypes = {
			WHITELIST : 2,
			WAITLIST  : 3,
			CLAIM     : 4,
		}

		const signer = typeof signerkey === 'undefined' || typeof signeraddress === 'undefined' ? getSignerWallet() : { privateKey: signerkey, address: signeraddress}

		await generateProofs( whitelist, signer, whitelistTypes.WHITELIST, 'whitelist' )
		await generateProofs( waitlist, signer, whitelistTypes.WAITLIST, 'waitlist' )
		await generateProofs( claimlist, signer, whitelistTypes.CLAIM, 'claimlist' )

		console.log( 'SIGNER:' )
		console.log( signer.privateKey )
		console.log( signer.address )
	})
