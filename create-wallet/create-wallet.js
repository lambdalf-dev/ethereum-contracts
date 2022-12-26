require("dotenv").config()
require("@nomiclabs/hardhat-ethers")

const fs = require( 'fs' )
const {
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

task( 'create-wallet', 'create a new wallet' )
.setAction( async ( taskArgs ) => {
		const signer = getSignerWallet()

		console.log( 'SIGNER:' )
		console.log( signer.privateKey )
		console.log( signer.address )
		fs.appendFileSync( `.ENV`, `PRIVATE_KEY=${ signer.privateKey }\nADDRESS=${ signer.address }\n` )
	})
