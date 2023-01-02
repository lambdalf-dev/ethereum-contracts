require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

const fs = require( 'fs' )
const axios = require('axios').default

const CONTRACT_ADDRESS = "0x495f947276749Ce646f68AC8c248420045cb7b5e"
const ABI = [{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId_","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
const BATCH_SIZE   = 30

task( 'snapshot-os', 'Takes a snapshot of the list of holders of a NFT collection on the OpenSea shared contract' )
	.addParam( 'slug', 'The collection slug on OpenSea' )
	.setAction( async ( taskArgs ) => {
		const totalSupply = parseInt( taskArgs.supply )
		const slug        = taskArgs.slug
		const [ signer, ...addrs ] = await ethers.getSigners()
		const collectionQueryUrl = `https://api.opensea.io/api/v1/assets?collection_slug=${ slug }`
		const tokenQueryUrl = `https://api.opensea.io/api/v1/asset/${ CONTRACT_ADDRESS }/`
		const queryHeaders = {
			headers: {
				'X-API-KEY': 'dd170435931a40879188e0071d25ba32',
				'Accept': 'application/json',
				// 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
				// 'referrer': 'https://api.opensea.io/api/v1/assets'
			}
		}

    const sleep = async ( ms_ = 1000 ) => {
      return new Promise( resolve => { setTimeout( resolve, ms_ ) } )
    }

    const getTokens = async () => {
    	let tokens  = []
			let collec = await axios.get( collectionQueryUrl, queryHeaders )
			tokens = JSON.parse( JSON.stringify( collec.data.assets ) )

			while ( collec.data.next ) {
				await sleep( 2000 )
				collec = await axios.get( `${ collectionQueryUrl }&cursor=${ collec.data.next }`, queryHeaders )
				tokens = tokens.concat( JSON.parse( JSON.stringify( collec.data.assets ) ) )
			}

			return tokens
    }

    const getHolders = async tokens => {
			let holders = {}
			for ( let i = 0; i < tokens.length; i++ ) {
				await sleep( 2000 )
				const tokenData = await axios.get( `${ tokenQueryUrl }${ tokens[ i ][ 'token_id' ] }`, queryHeaders )
				const tokenOwner = tokenData.data[ "top_ownerships" ][ 0 ][ "owner" ][ "address" ]
				if ( holders[ tokenOwner ] ) {
					holders[ tokenOwner ] += 1
				}
				else {
					holders[ tokenOwner ] = 1
				}
			}

    	return holders
    }


		console.log( `Querying collection ${ slug }...` )
		const tokens = await getTokens()

		console.log( `Snapshotting token holders...` )
		const holders = await getHolders( tokens )

		console.log( `Saving snapshot...` )
		if ( typeof holders !== 'undefined' ) {
			for ( const holder in holders ) {
				console.log( `${ holder },${ holders[ holder ] }` )
				fs.appendFile( 'snapshot.csv', holder + ',' + holders[ holder ] + '\n', function( err ) {
					if ( err ) {
						return console.debug( err )
					}
				})
			}
		}
		else {
			console.log( 'Snapshot failed' )
			return
		}
		console.log( '... Snapshot saved' )
	}
)

module.exports = {}
