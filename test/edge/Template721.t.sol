// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { Template721 } from "../../src/templates/Template721.sol";

import { TestHelper } from "../../test/utils/TestHelper.sol";
import { IWhitelist } from "../../src/interfaces/IWhitelist.sol";
import { ITemplate } from "../../src/interfaces/ITemplate.sol";

import { IERC173Events } from "../../src/mocks/events/IERC173Events.sol";
import { IERC721Events } from "../../src/mocks/events/IERC721Events.sol";

contract Deployed is TestHelper, ITemplate, IERC173Events, IERC721Events {
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
  	vm.prank(ALICE.addr);
  	testContract.privateMint{value: price}(amount, alloted, proof);
  }
	function _createProof(uint8 whitelistId, uint256 allotted, address account, Account memory signer) internal view returns(IWhitelist.Proof memory proof) {
		(uint8 v, bytes32 r, bytes32 s) = vm.sign(
			uint256(signer.key),
			keccak256(abi.encode(block.chainid, whitelistId, allotted, account))
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
		contract Edge_PrivateMint is Deployed {
			function test_edge_emit_Transfer_event_when_minting_the_whole_supply() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
		  	testContract.reduceSupply(RESERVE + amount);
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
		contract Edge_PublicMint is Deployed {
			function test_edge_emit_Transfer_event_when_minting_the_whole_supply() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
		  	testContract.reduceSupply(RESERVE + amount);
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
		contract Edge_ReduceReserve is Deployed {
			function test_edge_revert_when_not_changing_reserve() public {
				uint256 newReserve = RESERVE;
				vm.expectRevert(ITemplate.NFT_INVALID_RESERVE.selector);
				testContract.reduceReserve(newReserve);
			}
		}
		contract Edge_ReduceSupply is Deployed {
			function test_edge_revert_when_not_changing_supply() public {
				uint256 newSupply = MAX_SUPPLY;
				vm.expectRevert(ITemplate.NFT_INVALID_SUPPLY.selector);
				testContract.reduceSupply(newSupply);
			}
		}
  // ***************
// **************************************
