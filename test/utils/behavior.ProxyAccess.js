// **************************************
// *****           IMPORT           *****
// **************************************
	const {
		PROXY_USER,
		TOKEN_OWNER,
		CONTRACT_DEPLOYER,
	} = require( `../test-var-module` )

	const chai = require( `chai` )
	const chaiAsPromised = require( `chai-as-promised` )
	chai.use( chaiAsPromised )
	const expect = chai.expect
	const { loadFixture } = require( `@nomicfoundation/hardhat-network-helpers` )
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
	// Errors
	async function shouldRevertWhenProxyRegistryExist ( promise, contract, error ) {
    if ( typeof error === 'undefined' ) {
      await expect( promise )
        .to.be.revertedWithCustomError( contract, `ProxyAccess_ALREADY_REGISTERED` )
    }
    else {
      await expect( promise )
        .to.be.revertedWith( error )
    }
	}
	async function shouldRevertWhenProxyRegistryDontExist ( promise, contract, error ) {
    if ( typeof error === 'undefined' ) {
      await expect( promise )
        .to.be.revertedWithCustomError( contract, `ProxyAccess_NON_EXISTANT_PROXY` )
    }
    else {
      await expect( promise )
        .to.be.revertedWith( error )
    }
	}
	// Behavior
	async function shouldBehaveLikeProxyAccessBeforeProxy ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ProxyAccess before setting proxy`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture( fixture )

				contract = test_contract
				proxy_contract = test_proxy_contract
				users[ PROXY_USER ] = test_proxy_user
				users[ TOKEN_OWNER ] = test_token_owner
			})

			describe( CONTRACT.METHODS.isRegisteredProxy.SIGNATURE, function () {
				it( `Proxy user is not a registerd proxy`, async function () {
					const tokenOwner = users[ TOKEN_OWNER ].address
					const operator = users[ PROXY_USER ].address
					expect(
						await contract.isRegisteredProxy( tokenOwner, operator )
					).to.be.false
				})
			})
		})
	}
	async function shouldBehaveLikeProxyAccessAfterProxy ( fixture, TEST, CONTRACT ) {
		describe( `Should behave like ProxyAccess after setting proxy`, function () {
			beforeEach( async function () {
				const {
					test_contract,
					test_proxy_user,
					test_token_owner,
					test_proxy_contract,
				} = await loadFixture( fixture )

				contract = test_contract
				proxy_contract = test_proxy_contract
				users[ PROXY_USER ] = test_proxy_user
				users[ TOKEN_OWNER ] = test_token_owner
			})

			describe( CONTRACT.METHODS.isRegisteredProxy.SIGNATURE, function () {
				it( `Proxy user is a registered proxy`, async function () {
					const tokenOwner = users[ TOKEN_OWNER ].address
					const operator = users[ PROXY_USER ].address
					expect(
						await contract.isRegisteredProxy( tokenOwner, operator )
					).to.be.true
				})
			})
		})
	}
// **************************************

// **************************************
// *****           EXPORT           *****
// **************************************
module.exports = {
	shouldBehaveLikeProxyAccessBeforeProxy,
	shouldBehaveLikeProxyAccessAfterProxy,
	shouldRevertWhenProxyRegistryExist,
	shouldRevertWhenProxyRegistryDontExist,
}
