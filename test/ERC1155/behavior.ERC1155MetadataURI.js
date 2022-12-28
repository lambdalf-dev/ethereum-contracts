// **************************************
// *****           IMPORT           *****
// **************************************
  const chai = require( `chai` )
  const chaiAsPromised = require( `chai-as-promised` )
  chai.use( chaiAsPromised )
  const expect = chai.expect
  const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )

  const {
    INTERFACE_ID,
    shouldSupportInterface,
  } = require( `../utils/behavior.ERC165` )

  const {
    shouldRevertWhenArrayLengthsDontMatch
  } = require( `../utils/behavior.Arrays` )

  const {
    ERC1155ReceiverError,
    shouldEmitTransferSingleEvent,
    shouldEmitTransferBatchEvent,
    shouldEmitApprovalForAllEvent,
    shouldEmitURIEvent,
    shouldRevertWhenApprovingTokenOwner,
    shouldRevertWhenCallerIsNotApproved,
    shouldRevertWhenERC1155ReceiverRejectsTransfer,
    shouldRevertWhenNewSeriesAlreadyExist,
    shouldRevertWhenRequestedTokenDoesNotExist,
    shouldRevertWhenTokenOwnerDoesNotOwnEnoughTokens,
    shouldRevertWhenTransferingToNonERC1155ReceiverContract,
    shouldRevertWhenTransferingToNullAddress,
  } = require(`../ERC1155/behavior.ERC1155`)
// **************************************

// **************************************
// *****       TEST VARIABLES       *****
// **************************************
    let contract
    let users = {}
// **************************************

// **************************************
// *****        TEST  SUITES        *****
// **************************************
  async function shouldBehaveLikeIERC1155MetadataURIAfterCreatingSeries( fixture, TEST, CONTRACT ) {
    describe( `Should behave like IERC1155MetadataURI after creating series`, function () {
      beforeEach( async function () {
        const {
          test_contract,
        } = await loadFixture( fixture )

        contract = test_contract
      })

      // **************************************
      // *****            VIEW            *****
      // **************************************
        describe( CONTRACT.METHODS.uri.SIGNATURE, function () {
          it( `Should be reverted when requesting an invalid token ID`, async function () {
            const id = TEST.INVALID_SERIES_ID
            await shouldRevertWhenRequestedTokenDoesNotExist(
              contract.uri( id ),
              contract,
              TEST.INVALID_SERIES_ID
            )
          })
          it( `Initial uri should be ${ TEST.INIT_BASE_URI }`, async function () {
            const id = TEST.INIT_SERIES.id_
            const baseUri = TEST.INIT_BASE_URI
            expect(
              await contract.uri( id )
            ).to.equal( `${ baseUri }${ id }` )
          })
        })
      // **************************************
    })
  }
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
  shouldBehaveLikeIERC1155MetadataURIAfterCreatingSeries,
}
