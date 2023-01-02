require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

const fs = require( 'fs' )

const ABI = [{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId_","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
const BATCH_SIZE   = 500

task( 'snapshot', 'Takes a snapshot of the list of holders of a NFT token at the specified block' )
	.addParam( 'address', 'The address of the ERC721 contract to snapshot' )
	.addParam( 'block', 'The block number to take the snapshot at' )
	.addParam( 'supply', 'The amount of tokens from the contract to check, if the contract does not have a `totalSupply()` function', 0, types.int )
	.setAction( async ( taskArgs ) => {
		const blockNumber = parseInt( taskArgs.block )
		const totalSupply = parseInt( taskArgs.supply )
		const contractAddress = ethers.utils.getAddress( taskArgs.address )
		const [ signer, ...addrs ] = await ethers.getSigners()

    const sleep = async ( ms_ = 1000 ) => {
      return new Promise( resolve => { setTimeout( resolve, ms_ ) } )
    }

		let holders = {}

		console.log( `Snapshotting ${ totalSupply } holders...` )
		for ( let i = 0; i < totalSupply; i += BATCH_SIZE ) {
			console.log( `... processing batch number ${ i } ...` )
			await network.provider.request({
				method: "hardhat_reset",
				params: [
					{
						forking: {
							jsonRpcUrl: process.env.ALCHEMY_API_KEY,
							blockNumber: blockNumber,
						},
					},
				],
			})
			const contract = await new ethers.Contract( contractAddress, ABI, signer )

			for ( let j = 0; j < BATCH_SIZE; j ++ ) {
				if ( i + j < totalSupply ) {
					const tokenOwner = await contract.ownerOf( i + j )
					if ( holders[ tokenOwner ] ) {
						holders[ tokenOwner ] += 1
					}
					else {
						holders[ tokenOwner ] = 1
					}
				}
				else {
					break
				}
			}
		}

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
