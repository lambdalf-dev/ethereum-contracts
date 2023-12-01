// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { Template721 } from "../../../contracts/templates/Template721.sol";

import { TestHelper } from "../../../test/foundry/utils/TestHelper.sol";
import { IArrays } from "../../../contracts/interfaces/IArrays.sol";
import { IWhitelist } from "../../../contracts/interfaces/IWhitelist.sol";
import { ITemplate } from "../../../contracts/interfaces/ITemplate.sol";
import { IERC721Receiver } from "../../../contracts/interfaces/IERC721Receiver.sol";
import { IERC721 } from "../../../contracts/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../../contracts/interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../../contracts/interfaces/IERC721Metadata.sol";
import { IERC173 } from "../../../contracts/interfaces/IERC173.sol";
import { IERC165 } from "../../../contracts/interfaces/IERC165.sol";
import { IERC2981 } from "../../../contracts/interfaces/IERC2981.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { IERC173Events } from "../../../contracts/mocks/events/IERC173Events.sol";
import { IERC721Events } from "../../../contracts/mocks/events/IERC721Events.sol";
import { Mock_Invalid_Eth_Receiver } from "../../../contracts/mocks/external/Mock_Invalid_Eth_Receiver.sol";
import { Mock_NonERC721Receiver } from "../../../contracts/mocks/external/Mock_NonERC721Receiver.sol";
import { Mock_ERC721Receiver } from "../../../contracts/mocks/external/Mock_ERC721Receiver.sol";

contract Deployed is TestHelper, ITemplate, IERC173Events, IERC721Events {
  bytes4[] public INTERFACES = [
		type(IERC721).interfaceId,
		type(IERC721Enumerable).interfaceId,
		type(IERC721Metadata).interfaceId,
		type(IERC173).interfaceId,
		type(IERC165).interfaceId,
		type(IERC2981).interfaceId
	];

	Template721 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Template721(
			MAX_SUPPLY,
			RESERVE,
			PRIVATE_SALE_PRICE,
			PUBLIC_SALE_PRICE,
			ROYALTY_RATE,
			ROYALTY_RECIPIENT.addr,
			TREASURY.addr,
			SIGNER.addr
		);
  }
  function _depleteSupplyFixture() internal {
  	testContract.reduceSupply(RESERVE);
  }
  function _setPrivateSaleFixture() internal {
  	testContract.setContractState(Template721.ContractState.PRIVATE_SALE);
  }
  function _setPublicSaleFixture() internal {
  	testContract.setContractState(Template721.ContractState.PUBLIC_SALE);
  }
  function _mintFixture() internal {
  	_setPublicSaleFixture();
    vm.prank(ALICE.addr);
    vm.deal(ALICE.addr, ALICE_INIT_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:ALICE_INIT_SUPPLY * PUBLIC_SALE_PRICE}(ALICE_INIT_SUPPLY);
    vm.prank(BOB.addr);
    vm.deal(BOB.addr, BOB_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:BOB_SUPPLY * PUBLIC_SALE_PRICE}(BOB_SUPPLY);
    vm.prank(ALICE.addr);
    vm.deal(ALICE.addr, ALICE_MORE_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:ALICE_MORE_SUPPLY * PUBLIC_SALE_PRICE}(ALICE_MORE_SUPPLY);
  }
  function _removeWhitelistFixture() internal {
  	testContract.setWhitelist(address(0));
  }
  function _consumeAllowanceFixture(address account, uint256 amount, uint256 alloted, IWhitelist.Proof memory proof) internal {
  	_setPrivateSaleFixture();
  	uint256 price = amount * PRIVATE_SALE_PRICE;
  	vm.deal(account, price);
  	vm.prank(account);
  	testContract.privateMint{value: price}(amount, alloted, proof);
  }
	function _createProof(uint8 whitelistId, uint256 allotted, address account, Account memory signer) internal pure returns(IWhitelist.Proof memory proof) {
		(uint8 v, bytes32 r, bytes32 s) = vm.sign(
			uint256(signer.key),
			keccak256(abi.encode(whitelistId, allotted, account))
		);
		return IWhitelist.Proof(r, s, v);
	}
}

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract Fuzz_PrivateMint is Deployed {
			function test_fuzz_private_mint_emit_Transfer_events(uint256 amount) public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
				amount = bound(amount, 1, alloted);
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_setPrivateSaleFixture();
				vm.prank(operator);
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), operator, i);
				}
				testContract.privateMint{value: price}(amount, alloted, proof);
				assertEq(
					address(testContract).balance,
					price,
					"invalid contract ether balance"
				);
				assertEq(
					testContract.balanceOf(operator),
					amount,
					"invalid balance"
				);
				assertEq(
					testContract.totalSupply(),
					amount,
					"invalid supply"
				);
				assertEq(
		      testContract.checkWhitelistAllowance(operator, whitelistId, alloted, proof),
		      alloted - amount,
		      "invalid allowance"
				);
			}
		}
		contract Fuzz_PublicMint is Deployed {
			function test_fuzz_public_mint_emit_Transfer_events(uint256 amount) public {
				address operator = ALICE.addr;
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_setPublicSaleFixture();
				vm.prank(operator);
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), operator, i);
				}
				testContract.publicMint{value: price}(amount);
				assertEq(
					address(testContract).balance,
					price,
					"invalid contract ether balance"
				);
				assertEq(
					testContract.balanceOf(operator),
					amount,
					"invalid balance"
				);
				assertEq(
					testContract.totalSupply(),
					amount,
					"invalid supply"
				);
			}
		}
  // ***************
// **************************************

// **************************************
// *****       CONTRACT OWNER       *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract Fuzz_Airdrop is Deployed {
			function test_fuzz_airdrop_emit_Transfer_events(uint256 amount1) public {
				address recipient1 = ALICE.addr;
				address recipient2 = BOB.addr;
				amount1 = bound(amount1, 1, RESERVE - 1);
				uint256 amount2 = 1;
				address[] memory addresses = new address[](2);
				addresses[0] = recipient1;
				addresses[1] = recipient2;
				uint256[] memory amounts = new uint256[](2);
				amounts[0] = amount1;
				amounts[1] = amount2;
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount1; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), recipient1, i);
				}
				for (uint256 i = FIRST_TOKEN + amount1; i < amount1 + amount2; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), recipient2, i);
				}
				testContract.airdrop(addresses, amounts);
				assertEq(
					testContract.balanceOf(recipient1),
					amount1,
					"invalid recipient1 balance"
				);
				assertEq(
					testContract.balanceOf(recipient2),
					amount2,
					"invalid recipient2 balance"
				);
				assertEq(
					testContract.totalSupply(),
					amount1 + amount2,
					"invalid supply"
				);
				assertEq(
					testContract.reserve(),
					RESERVE - (amount1 + amount2),
					"invalid supply"
				);
			}
		}
		contract Fuzz_ReduceReserve is Deployed {
			function test_fuzz_decrease_reserve_successfully(uint256 amount) public {
				amount = bound(amount, 0, RESERVE - 1);
				testContract.reduceReserve(amount);
				assertEq(
					testContract.reserve(),
					amount,
					"invalid reserve"
				);
			}
		}
		contract Fuzz_ReduceSupply is Deployed {
			function test_fuzz_decrease_supply_successfully(uint256 amount) public {
				amount = bound(amount, RESERVE, MAX_SUPPLY - 1);
				testContract.reduceSupply(amount);
				assertEq(
					testContract.maxSupply(),
					amount,
					"invalid supply"
				);
			}
		}
		contract Fuzz_SetContractState is Deployed {
			function test_fuzz_emit_ContractStateChanged_event(uint8 newState) public {
				vm.assume(newState < uint8(Template721.ContractState.PUBLIC_SALE) + 1);
				vm.expectEmit(address(testContract));
				emit ContractStateChanged(uint8(Template721.ContractState.PAUSED), newState);
				testContract.setContractState(Template721.ContractState(newState));
				assertEq(
					uint8(testContract.contractState()),
					uint8(newState),
					"invalid state"
				);
			}
		}
  // ***************
// **************************************
