const chai = require( 'chai' )
const chaiAsPromised = require( 'chai-as-promised' )

chai.use( chaiAsPromised )

const expect = chai.expect ;
const { ethers } = require( 'hardhat' )

// For expected thrown errors
const THROW = {
	MISSING_ARGUMENT         : /missing argument/,
	UNEXPECTED_ARGUMENT      : /too many arguments/,
	INCORRECT_DATA_LENGTH    : /incorrect data length/,
	INCORRECT_PARAMETERS     : /incorrect parameters/,
	INVALID_ADDRESS          : /invalid address/,
	INVALID_ADDRESS_OR_ENS   : /invalid address or ENS name/,
	NO_ENS_SUPPORT           : /(network does not support ENS)|(resolver or addr is not configured for ENS name)/,
	INVALID_BIG_NUMBER       : /invalid BigNumber/,
	INVALID_ARRAYIFY_VALUE   : /invalid arrayify value/,
	INVALID_VALUE_FOR_ARRAY  : /invalid value for array/,
	OVERFLOW                 : /overflow/,
	UNDERFLOW                : /underflow/,
	OUT_OF_GAS               : /out of gas/,
	STRING_ARRAY             : /charCodeAt is not a function/,
	VALUE_OUT_OF_BOUNDS      : /value out-of-bounds/,
}

// For constant test variables
const TEST_VAR = {
	ADDRESS      : '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
	BYTE         : '0x35',
	BYTES4       : '0x93c35b29',
	BYTES32      : '0x78f551d6dff4c9be08c7ac89ebe3ed59f381d99f6a6d3d38dd6e2ad029aaaad0',
	BYTES_ARRAY  : '0xf1fe061cbe963e5633e3750f4b9d8afe6ede45035bffc0ae63cf376f19ee6288ade29bfcaeb05e5513c423c3ea840cc2508e67accb7035e4a0f809cae76fc3cd',
	BOOLEAN      : true,
	STRING       : 'Hello',
	ENS_NAME     : 'lambdalfthewhite.eth',
	EMPTY_STRING : '',
	NUMBER_ZERO  : 0,
	NUMBER_ONE   : 1,
	BIG_NUMBER   : ethers.BigNumber.from( '0x6e69f34b7c5dd0d1' ),
	ARRAY        : {
		ADDRESS    : [ '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4', '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2' ],
		BOOLEAN    : [ true, false ],
		BYTE       : [ '0x35', '0x19' ],
		BYTES4     : [ '0x93c35b29', '0x93c32b29' ],
		BYTES32    : [ '0x78f551d6dff4c9be08c7ac89ebe3ed59f381d99f6a6d3d38dd6e2ad029aaaad0','0x78f551d6dff4c9be08c7ac89ebe3ed59f781d99f6a6d3d38dd6e2ad029aaaad0' ],
		STRING     : [ 'Hello', 'World' ],
		NUMBER     : [ 1, 2 ],
		BIG_NUMBER : [ ethers.BigNumber.from( '0x6e69f34b7c5dd0d1' ), ethers.BigNumber.from( '0x6e69f34b7c5dd0d0' ) ],
	}
}

function getTestCasesByFunction ( signature, params ) {
	const numArgs = params.length

	let argTypes = signature
		.match( /\((.*?)\)/ )[ 1 ]
		.split( ',' )
		.filter( elmt => elmt )

	let testCases = [
		{
			test_variable_index : numArgs,
			test_description    : 'Input more than ' + numArgs + ' argument(s) should throw "' + THROW.UNEXPECTED_ARGUMENT + '"',
			expected_error      : THROW.UNEXPECTED_ARGUMENT,
			test_variable       : 'EXTRA_PARAM',
		},
	]
	if ( numArgs > 0 ) {
		testCases.push( {
			test_variable_index : null,
			test_description    : 'Input less than ' + numArgs + ' argument(s) should throw "' + THROW.MISSING_ARGUMENT + '"',
			expected_error      : THROW.MISSING_ARGUMENT,
			test_variable       : null,
		})

		for ( i = 0; i < numArgs; i ++ ) {
			const funcCases = getTestCases( argTypes[ i ], params[ i ], i )
			testCases = testCases.concat( funcCases )
		}
	}

	testCases = testCases.filter( elmt => elmt )

	return testCases
}

function getTestCases ( varType, varName, index ) {
	switch ( varType ) {
		case 'address':
			return addressCases( varName, index )
			break
		case 'address[]':
			return addressArrayCases( varName, index )
			break
		case 'bytes4':
			return bytes4Cases( varName, index )
			break
		case 'bytes32':
			return bytes32Cases( varName, index )
			break
		case 'bytes':
			return bytesCases( varName, index )
			break
		case 'boolean':
			return booleanCases( varName, index )
			break
		case 'string':
			return stringCases( varName, index )
			break
		case 'uint256':
			return uint256Cases( varName, index )
			break
		case 'uint256[]':
			return uint256ArrayCases( varName, index )
			break
		case 'uint8':
			return uint8Cases( varName, index )
			break
	}
}

function addressCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input array of address instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : [ TEST_VAR.ADDRESS ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input byte instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes4 instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.BYTES4,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes32 instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.BYTES32,
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_description : 'Input string instead of `' + varName + '` should throw "' + THROW.NO_ENS_SUPPORT + '"',
			test_variable_index : index,
			expected_error      : THROW.NO_ENS_SUPPORT,   
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_description : 'Input ENS name instead of `' + varName + '` should throw "' + THROW.NO_ENS_SUPPORT + '"',
			test_variable_index : index,
			expected_error      : THROW.NO_ENS_SUPPORT,   
			test_variable       : TEST_VAR.ENS_NAME,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function addressArrayCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input single address instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_VALUE_FOR_ARRAY,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of array of address instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : [ TEST_VAR.ARRAY.ADDRESS ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of byte instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.ARRAY.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of bytes4 instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.ARRAY.BYTES4,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of bytes32 instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS + '"',
			expected_error      : THROW.INVALID_ADDRESS,
			test_variable       : TEST_VAR.ARRAY.BYTES32,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of boolean instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.ARRAY.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of string instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.NO_ENS_SUPPORT,
			test_variable       : TEST_VAR.ARRAY.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of number instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.ARRAY.NUMBER,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of BigNumber instead of `' + varName + '` should throw "' + THROW.INVALID_ADDRESS_OR_ENS + '"',
			expected_error      : THROW.INVALID_ADDRESS_OR_ENS,
			test_variable       : TEST_VAR.ARRAY.BIG_NUMBER,
		},
	]
}

function bytes4Cases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input address instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input byte instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of bytes4 instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : [ TEST_VAR.BYTES4 ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes32 instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BYTES32,
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function bytes32Cases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input address instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input byte instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes4 instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BYTES4,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of bytes32 instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : [ TEST_VAR.BYTES32 ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should throw "' + THROW.INCORRECT_DATA_LENGTH + '"',
			expected_error      : THROW.INCORRECT_DATA_LENGTH,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function bytesCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input array of bytes[] instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : [ TEST_VAR.BYTES_ARRAY ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_ARRAYIFY_VALUE,
			test_variable       : TEST_VAR.STRING,
		},
	]
}

function booleanCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input address instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input byte instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes4 instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES4,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes32 instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES32,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes[] instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES_ARRAY,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of boolean instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : [ TEST_VAR.BOOLEAN ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input empty string instead of `' + varName + '` should be converted to `false`',
			expected_error      : null,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number zero instead of `' + varName + '` should be converted to `false`',
			expected_error      : null,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should be converted to `true`',
			expected_error      : null,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function stringCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input address instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input byte instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes4 instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES4,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes32 instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES32,
		},
		{
			test_variable_index : index,
			test_description    : 'Input bytes[] instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BYTES_ARRAY,
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of string instead of `' + varName + '` should throw "' + THROW.STRING_ARRAY + '"',
			expected_error      : THROW.STRING_ARRAY,
			test_variable       : [ TEST_VAR.STRING ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input empty string instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input number zero instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should not throw',
			expected_error      : null,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function uint256Cases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of BigNumber instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : [ TEST_VAR.BIG_NUMBER ],
		},
	]
}

function uint256ArrayCases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input array of boolean instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.ARRAY.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of string instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.ARRAY.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of array of number instead of `' + varName + '` should resolve to the last number in the array',
			expected_error      : null,
			test_variable       : [ TEST_VAR.ARRAY.NUMBER ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input single number instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_VALUE_FOR_ARRAY,
			test_variable       : TEST_VAR.NUMBER_ONE,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of array of BigNumber instead of `' + varName + '` should resolve to the last BigNumber in the array',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : [ TEST_VAR.ARRAY.BIG_NUMBER ],
		},
		{
			test_variable_index : index,
			test_description    : 'Input single BigNumber instead of `' + varName + '` should throw "' + THROW.INVALID_ARRAYIFY_VALUE + '"',
			expected_error      : THROW.INVALID_VALUE_FOR_ARRAY,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
	]
}

function uint8Cases ( varName, index ) {
	return [
		{
			test_variable_index : index,
			test_description    : 'Input address instead of `' + varName + '` should throw "' + THROW.VALUE_OUT_OF_BOUNDS + '"',
			expected_error      : THROW.VALUE_OUT_OF_BOUNDS,
			test_variable       : TEST_VAR.ADDRESS,
		},
		{
			test_variable_index : index,
			test_description    : 'Input boolean instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.BOOLEAN,
		},
		{
			test_variable_index : index,
			test_description    : 'Input string instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : TEST_VAR.STRING,
		},
		{
			test_variable_index : index,
			test_description    : 'Input BigNumber instead of `' + varName + '` should throw "' + THROW.VALUE_OUT_OF_BOUNDS + '"',
			expected_error      : THROW.VALUE_OUT_OF_BOUNDS,
			test_variable       : TEST_VAR.BIG_NUMBER,
		},
		{
			test_variable_index : index,
			test_description    : 'Input array of BigNumber instead of `' + varName + '` should throw "' + THROW.INVALID_BIG_NUMBER + '"',
			expected_error      : THROW.INVALID_BIG_NUMBER,
			test_variable       : [ TEST_VAR.BIG_NUMBER ],
		},
	]
}

async function generateFailTest ( testedFunc, params, extra_var = null ) {
	let numArgs = params.args ? Object.keys( params.args )?.length || 0 : 0
	if ( extra_var ) {
		numArgs ++
	}

	switch ( numArgs ) {
		case 0:
			await generateFailTest__0( testedFunc, params, extra_var )
			break;
		case 1:
			await generateFailTest__1( testedFunc, params, extra_var )
			break;
		case 2:
			await generateFailTest__2( testedFunc, params, extra_var )
			break;
		case 3:
			await generateFailTest__3( testedFunc, params, extra_var )
			break;
		case 4:
			await generateFailTest__4( testedFunc, params, extra_var )
			break;
		case 5:
			await generateFailTest__5( testedFunc, params, extra_var )
			break;
		case 6:
			await generateFailTest__6( testedFunc, params, extra_var )
			break;
		case 7:
			await generateFailTest__7( testedFunc, params, extra_var )
			break;
		case 8:
			await generateFailTest__8( testedFunc, params, extra_var )
			break;
		case 9:
			await generateFailTest__9( testedFunc, params, extra_var )
			break;
		case 10:
			await generateFailTest__10( testedFunc, params, extra_var )
			break;
		default:
			return;
	}
}

async function generateFailTest__0 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFun, extra_var )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc() )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc()
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__1 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__2 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__3 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__4 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__5 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__6 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__7 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__8 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__9 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateFailTest__10 ( testedFunc, params, extra_var = null ) {
	if ( params.err ) {
		if ( extra_var ) {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ], params.args[ 9 ], extra_var ) )?.to.be.rejectedWith( params.err )
		}
		else {
			await expect( testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ], params.args[ 9 ] ) )?.to.be.rejectedWith( params.err )
		}
	}
	else {
		try {
			await testedFunc( params.args[ 0 ], params.args[ 1 ], params.args[ 2 ], params.args[ 3 ], params.args[ 4 ], params.args[ 5 ], params.args[ 6 ], params.args[ 7 ], params.args[ 8 ], params.args[ 9 ] )
		}
		catch ( err ) {
			expect( err?.message )?.to.contain( 'reverted' )
		}
	}
}

async function generateTestCase ( contract, testCase, defaultArgs, prop, val ) {
	const len = defaultArgs[ val.SIGNATURE ].args.length

	let testParams = {
		err  : testCase.expected_error,
		args : [],
	}

	for ( let i = 0; i < len; i ++ ) {
		if ( testCase.test_variable_index == i ) {
			testParams.args[ i ] = testCase.test_variable
		}
		else {
			testParams.args[ i ] = defaultArgs[ val.SIGNATURE ].args[ i ]
		}
	}

	let extra_var = null
	if ( ! testCase.test_variable ) {
		testParams.args = null
	}
	else if ( testCase.test_variable === 'EXTRA_PARAM' ) {
		extra_var = testCase.test_variable
	}

	await generateFailTest( contract.functions[ val.SIGNATURE ], testParams, extra_var )
}

module.exports = {
	getTestCasesByFunction,
	generateFailTest,
	generateTestCase,
}
