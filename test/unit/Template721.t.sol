// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4 <0.9.0;

import { Template721 } from "../../src/templates/Template721.sol";

import { TestHelper } from "../../test/utils/TestHelper.sol";
import { IArrays } from "../../src/interfaces/IArrays.sol";
import { IWhitelist } from "../../src/interfaces/IWhitelist.sol";
import { ITemplate } from "../../src/interfaces/ITemplate.sol";
import { IERC721Receiver } from "../../src/interfaces/IERC721Receiver.sol";
import { IERC721 } from "../../src/interfaces/IERC721.sol";
import { IERC721Enumerable } from "../../src/interfaces/IERC721Enumerable.sol";
import { IERC721Metadata } from "../../src/interfaces/IERC721Metadata.sol";
import { IERC173 } from "../../src/interfaces/IERC173.sol";
import { IERC165 } from "../../src/interfaces/IERC165.sol";
import { IERC2981 } from "../../src/interfaces/IERC2981.sol";
import { LibString } from "solady/src/utils/LibString.sol";

import { IERC173Events } from "../../src/mocks/events/IERC173Events.sol";
import { IERC721Events } from "../../src/mocks/events/IERC721Events.sol";
import { Mock_Invalid_Eth_Receiver } from "../../src/mocks/external/Mock_Invalid_Eth_Receiver.sol";
import { Mock_NonERC721Receiver } from "../../src/mocks/external/Mock_NonERC721Receiver.sol";
import { Mock_ERC721Receiver } from "../../src/mocks/external/Mock_ERC721Receiver.sol";

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
// *****          FALLBACK          *****
// **************************************
	contract Unit_Fallback is Deployed {
	  function test_unit_fallback() public {
	    uint256 initialBalance = address(testContract).balance;
	    (bool success,) = payable(address(testContract)).call{value: 10}(DATA);
	    assertTrue(success, 'transfer failed');
	    assertEq(address(testContract).balance, initialBalance + 10);
	  }
	  function test_unit_receive() public {
	    uint256 initialBalance = address(testContract).balance;
	    (bool success,) = payable(address(testContract)).call{value: 10}('');
	    assertTrue(success, 'transfer failed');
	    assertEq(address(testContract).balance, initialBalance + 10);
	  }
	}
// **************************************

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract Unit_PrivateMint is Deployed {
			function test_unit_revert_when_contract_state_is_paused() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.prank(operator);
				vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
				testContract.privateMint{value: price}(amount, alloted, proof);
			}
			function test_unit_revert_when_contract_state_is_public_sale() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_setPublicSaleFixture();
				vm.prank(operator);
				vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
				testContract.privateMint{value: price}(amount, alloted, proof);
			}
			function test_unit_revert_when_quantity_requested_is_zero() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = 0;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_setPrivateSaleFixture();
				vm.prank(operator);
				vm.expectRevert(ITemplate.NFT_INVALID_QTY.selector);
				testContract.privateMint(0, alloted, proof);
			}
			function test_unit_revert_when_supply_is_depleted() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_depleteSupplyFixture();
				_setPrivateSaleFixture();
				vm.prank(operator);
		    vm.expectRevert(ITemplate.NFT_MINTED_OUT.selector);
				testContract.privateMint{value: price}(amount, alloted, proof);
			}
			function test_unit_revert_when_incorrect_amount_of_ether_sent() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_setPrivateSaleFixture();
				vm.prank(operator);
		    vm.expectRevert(ITemplate.ETHER_INCORRECT_PRICE.selector);
				testContract.privateMint(amount, alloted, proof);
			}
			function test_unit_revert_when_requesting_more_than_allocated() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = alloted + WHITELIST_CONSUMED;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				_setPrivateSaleFixture();
				vm.prank(operator);
		    vm.expectRevert(IWhitelist.WHITELIST_FORBIDDEN.selector);
				testContract.privateMint{value: price}(amount, alloted, proof);
			}
			function test_unit_emit_Transfer_events() public {
		    address operator = ALICE.addr;
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    uint256 amount = alloted;
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
		contract Unit_PublicMint is Deployed {
			function test_unit_revert_when_contract_state_is_paused() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.prank(operator);
				vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
				testContract.publicMint{value: price}(amount);
			}
			function test_unit_revert_when_contract_state_is_private_sale() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_setPrivateSaleFixture();
				vm.prank(operator);
				vm.expectRevert(ITemplate.CONTRACT_STATE_INCORRECT.selector);
				testContract.publicMint{value: price}(amount);
			}
			function test_unit_revert_when_quantity_requested_is_zero() public {
				address operator = ALICE.addr;
				uint256 amount = 0;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_setPublicSaleFixture();
				vm.prank(operator);
				vm.expectRevert(ITemplate.NFT_INVALID_QTY.selector);
				testContract.publicMint(amount);
			}
			function test_unit_revert_when_requesting_more_than_max_batch() public {
				address operator = ALICE.addr;
				uint256 amount = MAX_BATCH + TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_setPublicSaleFixture();
				vm.prank(operator);
		    vm.expectRevert(ITemplate.NFT_MAX_BATCH.selector);
				testContract.publicMint{value: price}(amount);
			}
			function test_unit_revert_when_supply_is_depleted() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_depleteSupplyFixture();
				_setPublicSaleFixture();
				vm.prank(operator);
		    vm.expectRevert(ITemplate.NFT_MINTED_OUT.selector);
				testContract.publicMint{value: price}(amount);
			}
			function test_unit_revert_when_incorrect_amount_of_ether_sent() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				uint256 price = amount * PUBLIC_SALE_PRICE;
				_setPublicSaleFixture();
		    vm.expectRevert(ITemplate.ETHER_INCORRECT_PRICE.selector);
				testContract.publicMint(amount);
			}
			function test_unit_emit_Transfer_events() public {
				address operator = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
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
		contract Unit_Airdrop is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				address recipient = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				address[] memory addresses = new address[](1);
				addresses[0] = recipient;
				uint256[] memory amounts = new uint256[](1);
				amounts[0] = amount;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.airdrop(addresses, amounts);
			}
			function test_unit_revert_when_array_lengths_dont_match() public {
				address recipient = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				address[] memory addresses = new address[](1);
				addresses[0] = recipient;
				uint256[] memory amounts = new uint256[](2);
				amounts[0] = amount;
				amounts[1] = amount;
		    vm.expectRevert(abi.encodeWithSelector(IArrays.ARRAY_LENGTH_MISMATCH.selector));
				testContract.airdrop(addresses, amounts);
			}
			function test_unit_revert_when_airdropping_more_than_the_reserve_to_one_user() public {
				address recipient = ALICE.addr;
				uint256 amount = RESERVE + 1;
				address[] memory addresses = new address[](1);
				addresses[0] = recipient;
				uint256[] memory amounts = new uint256[](1);
				amounts[0] = amount;
		    vm.expectRevert(ITemplate.NFT_MAX_RESERVE.selector);
				testContract.airdrop(addresses, amounts);
			}
			function test_unit_revert_when_airdropping_more_than_the_reserve_to_several_users() public {
				address recipient = ALICE.addr;
				uint256 amount = TARGET_AMOUNT;
				address[] memory addresses = new address[](2);
				addresses[0] = recipient;
				addresses[1] = BOB.addr;
				uint256[] memory amounts = new uint256[](2);
				amounts[0] = amount;
				amounts[1] = RESERVE;
		    vm.expectRevert(ITemplate.NFT_MAX_RESERVE.selector);
				testContract.airdrop(addresses, amounts);
			}
			function test_unit_emit_Transfer_events() public {
				address recipient1 = ALICE.addr;
				address recipient2 = BOB.addr;
				uint256 amount1 = TARGET_AMOUNT;
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
		contract Unit_ReduceReserve is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				uint256 newReserve = 0;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.reduceReserve(newReserve);
			}
			function test_unit_revert_when_increasing_reserve() public {
				uint256 newReserve = RESERVE + 1;
				vm.expectRevert(ITemplate.NFT_INVALID_RESERVE.selector);
				testContract.reduceReserve(newReserve);
			}
			function test_unit_decrease_reserve_successfully() public {
				uint256 newReserve = 0;
				testContract.reduceReserve(newReserve);
				assertEq(
					testContract.reserve(),
					newReserve,
					"invalid reserve"
				);
			}
		}
		contract Unit_ReduceSupply is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				uint256 newSupply = RESERVE;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.reduceSupply(newSupply);
			}
			function test_unit_revert_when_increasing_supply() public {
				uint256 newSupply = MAX_SUPPLY + 1;
				vm.expectRevert(ITemplate.NFT_INVALID_SUPPLY.selector);
				testContract.reduceSupply(newSupply);
			}
			function test_unit_revert_when_decreasing_supply_below_reserve() public {
				uint256 newSupply = 0;
				vm.expectRevert(ITemplate.NFT_INVALID_SUPPLY.selector);
				testContract.reduceSupply(newSupply);
			}
			function test_unit_decrease_supply_successfully() public {
				uint256 newSupply = RESERVE;
				testContract.reduceSupply(newSupply);
				assertEq(
					testContract.maxSupply(),
					newSupply,
					"invalid supply"
				);
			}
		}
		contract Unit_SetContractState is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				uint8 newState = uint8(Template721.ContractState.PUBLIC_SALE);
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setContractState(Template721.ContractState(newState));
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"invalid state"
				);
			}
			function test_unit_revert_when_new_state_is_invalid() public {
				uint8 newState = uint8(Template721.ContractState.PUBLIC_SALE) + 1;
		    vm.expectRevert();
				testContract.setContractState(Template721.ContractState(newState));
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"invalid state"
				);
			}
			function test_unit_emit_ContractStateChanged_event() public {
				uint8 newState = uint8(Template721.ContractState.PUBLIC_SALE);
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
		contract Unit_SetPrices is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				uint256 newDiscountPrice = 0;
				uint256 newPrice = 0;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setPrices(newDiscountPrice, newPrice);
			}
			function test_unit_update_prices_accurately() public {
				uint256 newDiscountPrice = 0;
				uint256 newPrice = 0;
				testContract.setPrices(newDiscountPrice, newPrice);
				assertEq(
					testContract.salePrice(Template721.ContractState.PRIVATE_SALE),
					newDiscountPrice,
					"invalid private price"
				);
				assertEq(
					testContract.salePrice(Template721.ContractState.PUBLIC_SALE),
					newPrice,
					"invalid public price"
				);
			}
		}
		contract Unit_SetTreasury is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				address newTreasury = RECIPIENT.addr;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setTreasury(newTreasury);
			}
			function test_unit_update_treasury_successfully() public {
				address newTreasury = RECIPIENT.addr;
				testContract.setTreasury(newTreasury);
				assertEq(
					testContract.treasury(),
					newTreasury,
					"invalid treasury address"
				);
			}
		}
		contract Unit_Withdraw is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.withdraw();
			}
			function test_unit_revert_when_contract_holds_no_eth() public {
		    vm.expectRevert(ITemplate.ETHER_NO_BALANCE.selector);
				testContract.withdraw();
			}
			function test_unit_revert_when_treasury_cant_receive_eth() public {
				_mintFixture();
				testContract.setTreasury(address(this));
		    vm.expectRevert(ITemplate.ETHER_TRANSFER_FAIL.selector);
				testContract.withdraw();
			}
			function test_unit_eth_balance_transferred_successfully() public {
				_mintFixture();
				testContract.withdraw();
				assertEq(
					address(TREASURY.addr).balance,
					100 ether + MINTED_SUPPLY * PUBLIC_SALE_PRICE,
					"invalid treasury balance"
				);
				assertEq(
					address(testContract).balance,
					0,
					"invalid contract balance"
				);
			}
		}
  // ***************

  // ************
  // * IERC2981 *
  // ************
		contract Unit_SetRoyaltyInfo is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
		    address newRecipient = OPERATOR.addr;
		    uint96 newRate = ROYALTY_RATE / 2;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setRoyaltyInfo(newRecipient, newRate);
			}
		  function test_unit_setting_royalties() public {
		    address newRecipient = OPERATOR.addr;
		    uint96 newRate = ROYALTY_RATE / 2;
		    uint256 tokenId = TARGET_TOKEN;
		    uint256 price = PRIVATE_SALE_PRICE;
		    address expectedRecipient = newRecipient;
		    uint256 expectedAmount = price * newRate / ROYALTY_BASE;
		    testContract.setRoyaltyInfo(newRecipient, newRate);
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      expectedRecipient,
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      expectedAmount,
		      "invalid royalty amount"
		    );
		  }
		  function test_unit_removing_royalty_recipient() public {
		    address newRecipient = address(0);
		    uint96 newRate = ROYALTY_RATE / 2;
		    uint256 tokenId = TARGET_TOKEN;
		    uint256 price = PRIVATE_SALE_PRICE;
		    address expectedRecipient = address(0);
		    uint256 expectedAmount = 0;
		    testContract.setRoyaltyInfo(newRecipient, newRate);
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      expectedRecipient,
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      expectedAmount,
		      "invalid royalty amount"
		    );
		  }
		  function test_unit_removing_royalty_rate() public {
		    address newRecipient = OPERATOR.addr;
		    uint96 newRate = 0;
		    uint256 tokenId = TARGET_TOKEN;
		    uint256 price = PRIVATE_SALE_PRICE;
		    address expectedRecipient = address(0);
		    uint256 expectedAmount = 0;
		    testContract.setRoyaltyInfo(newRecipient, newRate);
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      expectedRecipient,
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      expectedAmount,
		      "invalid royalty amount"
		    );
		  }
		}
  // ************

  // *******************
  // * IERC721Metadata *
  // *******************
		contract Unit_SetBaseUri is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
        string memory newBaseUri = NEW_BASE_URI;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setBaseUri(newBaseUri);
			}
      function test_unit_erc721Batch_set_base_uri() public {
        string memory newBaseUri = NEW_BASE_URI;
        uint256 tokenId = TARGET_TOKEN;
        _mintFixture();
        testContract.setBaseUri(newBaseUri);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(newBaseUri, LibString.toString(tokenId))),
          "invalid uri"
        );
			}
		}
  // *******************

  // *************
  // * Whitelist *
  // *************
		contract Unit_SetWhitelist is Deployed {
			function test_unit_revert_when_caller_is_not_contract_owner() public {
				address operator = OPERATOR.addr;
				vm.prank(operator);
		    vm.expectRevert(IERC173.IERC173_NOT_OWNER.selector);
				testContract.setWhitelist(FORGER.addr);
			}
			function test_unit_remove_whitelist() public {
		    uint8 whitelistId = WHITELIST_ID;
		    uint256 alloted = ALLOCATED;
		    address account = ALICE.addr;
		    address whitelistedAccount = ALICE.addr;
		    IWhitelist.Proof memory proof = _createProof(whitelistId, alloted, whitelistedAccount, SIGNER);
				testContract.setWhitelist(address(0));
		    vm.expectRevert(IWhitelist.WHITELIST_NOT_SET.selector);
		    testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof);
			}
		}
  // *************
// **************************************

// **************************************
// *****            VIEW            *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract Unit_MaxBatch is Deployed {
			function test_unit_max_batch_is_accurate() public {
				assertEq(
					testContract.MAX_BATCH(),
					MAX_BATCH,
					"incorrect max batch"
				);
			}
		}
		contract Unit_ContractState is Deployed {
			function test_unit_contract_state_is_paused() public {
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"incorrect contract state"
				);
			}
		}
		contract Unit_MaxSupply is Deployed {
			function test_unit_max_supply_is_accurate() public {
				assertEq(
					testContract.maxSupply(),
					MAX_SUPPLY,
					"incorrect max supply"
				);
			}
		}
		contract Unit_Reserve is Deployed {
			function test_unit_reserve_is_accurate() public {
				assertEq(
					testContract.reserve(),
					RESERVE,
					"incorrect reserve"
				);
			}
		}
		contract Unit_Treasury is Deployed {
			function test_unit_treasury_is_accurate() public {
				assertEq(
					testContract.treasury(),
					TREASURY.addr,
					"incorrect treasury"
				);
			}
		}
		contract Unit_SalePrice is Deployed {
			function test_unit_sale_prices_are_accurate() public {
				assertEq(
					testContract.salePrice(Template721.ContractState.PRIVATE_SALE),
					PRIVATE_SALE_PRICE,
					"invalid private price"
				);
				assertEq(
					testContract.salePrice(Template721.ContractState.PUBLIC_SALE),
					PUBLIC_SALE_PRICE,
					"invalid public price"
				);
			}
		}
  // ***************

  // ***********
  // * IERC165 *
  // ***********
		contract Unit_SupportsInterface is Deployed {
		  function test_unit_supports_the_expected_interfaces() public {
		  	for (uint256 i; i < INTERFACES.length; ++i) {
			    assertTrue(
			      testContract.supportsInterface(INTERFACES[i]),
			      "invalid interface"
			    );
		  	}
		  }
		}
  // ***********
// **************************************
