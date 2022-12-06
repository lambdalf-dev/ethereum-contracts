// // **************************************
// // *****           IMPORT           *****
// // **************************************
//     const { TEST_ACTIVATION } = require( `../test-activation-module` )
//     const {
//         USER1,
//         USER2,
//         USER_NAMES,
//         PROXY_USER,
//         TOKEN_OWNER,
//         OTHER_OWNER,
//         CONTRACT_DEPLOYER,
//     } = require( `../test-var-module` )

//     const chai = require( `chai` )
//     const chaiAsPromised = require( `chai-as-promised` )
//     chai.use( chaiAsPromised )
//     const expect = chai.expect

//     const { ethers } = require( `hardhat` )
//     const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

//     const {
//         INTERFACE_ID,
//         shouldSupportInterface,
//     } = require( `../utils/behavior.ERC165` )
// // **************************************

// // **************************************
// // *****       TEST VARIABLES       *****
// // **************************************
//     let contract
//     let users = {}
// // **************************************

// // **************************************
// // *****        TEST  SUITES        *****
// // **************************************
//     async function shouldBehaveLikeIERC1155MetadataURIBeforeMint ( fixture, TEST, CONTRACT  ) {
//         describe( `Should behave like IERC1155MetadataURI at deploy`, function () {
//             if ( TEST_ACTIVATION.CORRECT_INPUT ) {
//                 beforeEach( async function () {
//                     const {
//                         test_user1,
//                         test_user2,
//                         test_contract,
//                         test_proxy_user,
//                         test_token_owner,
//                         test_other_owner,
//                         test_proxy_contract,
//                         test_contract_deployer,
//                     } = await loadFixture( fixture )

//                     contract       = test_contract
//                     proxy_contract = test_proxy_contract
//                     users[ USER1             ] = test_user1
//                     users[ USER2             ] = test_user2
//                     users[ PROXY_USER        ] = test_proxy_user
//                     users[ TOKEN_OWNER       ] = test_token_owner
//                     users[ OTHER_OWNER       ] = test_other_owner
//                     users[ CONTRACT_DEPLOYER ] = test_contract_deployer
//                 })

//                 // **************************************
//                 // *****            VIEW            *****
//                 // **************************************
//                     describe( CONTRACT.METHODS.uri.SIGNATURE, function () {
//                         if ( TEST.METHODS.uri ) {
//                             it( `Initial uri should be ${ TEST.INIT_BASE_URI }`, async function () {
//                                 const id = TEST.INIT_SERIES_ID
//                                 expect(
//                                     await contract.uri( id )
//                                 ).to.equal( TEST.INIT_BASE_URI )
//                             })
//                         }
//                     })
//                 // **************************************
//             }
//         })
//     }
// // **************************************

// // **************************************
// // *****           EXPORT           *****
// // **************************************
// module.exports = {
//     shouldBehaveLikeIERC1155MetadataURIBeforeMint,
// }
