// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Behavior_Arrays} from "./utils/Behavior.Arrays.sol";
import {Behavior_ERC173} from "./utils/Behavior.ERC173.sol";
import {Behavior_ERC2981} from "./utils/Behavior.ERC2981.sol";
import {Behavior_ERC721, Behavior_ERC721Enumerable} from "./utils/Behavior.ERC721.sol";
import {Behavior_Whitelist} from "./utils/Behavior.Whitelist.sol";
import {Behavior_Template} from "./utils/Behavior.Template.sol";
import {Template721} from "../../contracts/templates/Template721.sol";
import {IWhitelist} from "../../contracts/interfaces/IWhitelist.sol";
import {Mock_Invalid_Eth_Receiver} from "../../contracts/mocks/external/Mock_Invalid_Eth_Receiver.sol";
import {Mock_NonERC721Receiver} from "../../contracts/mocks/external/Mock_NonERC721Receiver.sol";
import {Mock_ERC721Receiver} from "../../contracts/mocks/external/Mock_ERC721Receiver.sol";
import {IERC721Receiver} from "../../contracts/interfaces/IERC721Receiver.sol";
import {IERC721} from "../../contracts/interfaces/IERC721.sol";
import {IERC721Enumerable} from "../../contracts/interfaces/IERC721Enumerable.sol";
import {IERC721Metadata} from "../../contracts/interfaces/IERC721Metadata.sol";
import {IERC173} from "../../contracts/interfaces/IERC173.sol";
import {IERC165} from "../../contracts/interfaces/IERC165.sol";
import {IERC2981} from "../../contracts/interfaces/IERC2981.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Constants is
Behavior_Arrays,
Behavior_ERC173,
Behavior_ERC2981,
Behavior_ERC721,
Behavior_ERC721Enumerable,
Behavior_Whitelist,
Behavior_Template {
  string NAME = "NFT Collection";
  string SYMBOL = "NFT";
  string BASE_URI = "";
  uint256 FIRST_TOKEN = 1;
  uint256 TARGET_TOKEN = 4;
  uint256 OTHER_OWNER_TOKEN = 7;
  address TOKEN_OWNER = user10.publicKey;
  address OTHER_OWNER = user11.publicKey;
  uint256 TOKEN_OWNER_INIT_SUPPLY = 6;
  uint256 TOKEN_OWNER_MORE_SUPPLY = 3;
  uint256 TOKEN_OWNER_SUPPLY = TOKEN_OWNER_INIT_SUPPLY + TOKEN_OWNER_MORE_SUPPLY;
  uint256 OTHER_OWNER_SUPPLY = 1;
  uint256 MINTED_SUPPLY = TOKEN_OWNER_SUPPLY + OTHER_OWNER_SUPPLY;
  Wallet SIGNER = user17;
  Wallet FORGER = user16;
  address WHITELISTED = user15.publicKey;
  uint8 WHITELIST_ID = 1;
  uint256 MAX_BATCH = 10;
  uint256 ALLOCATED = 5;
  uint256 WHITELIST_CONSUMED = 1;
  uint96 ROYALTY_BASE = 10_000;
  uint96 ROYALTY_RATE = 100;
  address ROYALTY_RECIPIENT = user19.publicKey;
  uint256 MAX_SUPPLY = 5000;
  uint256 RESERVE = 5;
  uint256 PRIVATE_SALE_PRICE = 1000000000000000000;
  uint256 PUBLIC_SALE_PRICE = 2000000000000000000;
  address TREASURY = user14.publicKey;
  bytes4[] INTERFACES = [
		type(IERC721).interfaceId,
		type(IERC721Enumerable).interfaceId,
		type(IERC721Metadata).interfaceId,
		type(IERC173).interfaceId,
		type(IERC165).interfaceId,
		type(IERC2981).interfaceId
  ];
}

contract Deployed is Constants {
  Template721 testContract;

  function setUp() public virtual override {
    super.setUp();
    testContract = new Template721(
			MAX_SUPPLY,
			RESERVE,
			PRIVATE_SALE_PRICE,
			PUBLIC_SALE_PRICE,
			ROYALTY_RATE,
			ROYALTY_RECIPIENT,
			TREASURY,
			SIGNER.publicKey
		);
  }
  function depleteSupply() internal {
  	testContract.reduceSupply(RESERVE);
  }
  function setPrivateSale() internal {
  	testContract.setContractState(Template721.ContractState.PRIVATE_SALE);
  }
  function setPublicSale() internal {
  	testContract.setContractState(Template721.ContractState.PUBLIC_SALE);
  }
  function mintFixture() internal {
  	setPublicSale();
    vm.prank(TOKEN_OWNER);
    vm.deal(TOKEN_OWNER, TOKEN_OWNER_INIT_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:TOKEN_OWNER_INIT_SUPPLY * PUBLIC_SALE_PRICE}(TOKEN_OWNER_INIT_SUPPLY);
    vm.prank(OTHER_OWNER);
    vm.deal(OTHER_OWNER, OTHER_OWNER_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:OTHER_OWNER_SUPPLY * PUBLIC_SALE_PRICE}(OTHER_OWNER_SUPPLY);
    vm.prank(TOKEN_OWNER);
    vm.deal(TOKEN_OWNER, TOKEN_OWNER_MORE_SUPPLY * PUBLIC_SALE_PRICE);
    testContract.publicMint{value:TOKEN_OWNER_MORE_SUPPLY * PUBLIC_SALE_PRICE}(TOKEN_OWNER_MORE_SUPPLY);
  }
  function removeWhitelistFixture() internal {
  	testContract.setWhitelist(address(0));
  }
  function consumeAllowanceFixture(address account, uint256 amount, uint256 alloted, IWhitelist.Proof memory proof) internal {
  	setPrivateSale();
  	uint256 price = amount * PRIVATE_SALE_PRICE;
  	vm.deal(account, price);
  	vm.prank(account);
  	testContract.privateMint{value: price}(amount, alloted, proof);
  }
}

// **************************************
// *****           PUBLIC           *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract PrivateMint is Deployed {
			function test_revert_when_contract_state_is_paused(uint256 amount, address account, uint256 alloted) public {
				vm.assume(account != address(0));
				alloted = bound(alloted, 1, 4094);
				amount = bound(amount, 1, alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenContractStateIsIncorrect(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						amount,
						alloted,
						proof
					),
					price
				);
			}
			function test_revert_when_contract_state_is_public_sale(uint256 amount, address account, uint256 alloted) public {
				setPublicSale();
				vm.assume(account != address(0));
				alloted = bound(alloted, 1, 4094);
				amount = bound(amount, 1, alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenContractStateIsIncorrect(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						amount,
						alloted,
						proof
					),
					price
				);
			}
			function test_revert_when_quantity_requested_is_zero(address account, uint256 alloted) public {
				setPrivateSale();
				vm.assume(account != address(0));
				vm.assume(alloted > 0);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				vm.prank(account);
				revertWhenInvalidQuantityRequested(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						0,
						alloted,
						proof
					)
				);
			}
			function test_revert_when_supply_is_depleted(uint256 amount, address account, uint256 alloted) public {
				depleteSupply();
				setPrivateSale();
				vm.assume(account != address(0));
				alloted = bound(alloted, 1, 4094);
				amount = bound(amount, 1, alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenMintedOut(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						amount,
						alloted,
						proof
					),
					amount,
					0,
					price
				);
			}
			function test_revert_when_incorrect_amount_of_ether_sent(uint256 amount, address account, uint256 alloted) public {
				setPrivateSale();
				vm.assume(account != address(0));
				alloted = bound(alloted, 1, 4094);
				amount = bound(amount, 1, alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.prank(account);
				revertWhenIncorrectEtherAmountSent(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						amount,
						alloted,
						proof
					),
					0,
					price
				);
			}
			function test_revert_when_requesting_more_than_allocated(uint256 amount, address account, uint256 alloted) public {
				setPrivateSale();
				amount = bound(amount, 1, MAX_SUPPLY - RESERVE);
				vm.assume(amount > alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenNotWhitelisted(
					address(testContract),
					abi.encodeWithSignature(
						"privateMint(uint256,uint256,tuple(bytes32,bytes32,uint8))",
						amount,
						alloted,
						proof
					),
					account,
					price
				);
			}
			function test_emit_Transfer_events(uint256 amount, address account, uint256 alloted) public {
				setPrivateSale();
				vm.assume(account != address(0));
				alloted = bound(alloted, 1, 4094);
				amount = bound(amount, 1, alloted);
				IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
				assertEq(
					testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
					alloted,
					"invalid allowance"
				);

				uint256 price = amount * PRIVATE_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), account, i);
				}
				testContract.privateMint{value: price}(amount, alloted, proof);
				assertEq(
					address(testContract).balance,
					price,
					"invalid contract ether balance"
				);
				assertEq(
					testContract.balanceOf(account),
					amount,
					"invalid balance"
				);
			}
		}
		contract PublicMint is Deployed {
			function test_revert_when_contract_state_is_paused(uint256 amount, address account) public {
				vm.assume(account != address(0));
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenContractStateIsIncorrect(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						amount
					),
					price
				);
			}
			function test_revert_when_contract_state_is_private_sale(uint256 amount, address account) public {
				setPrivateSale();
				vm.assume(account != address(0));
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenContractStateIsIncorrect(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						amount
					),
					price
				);
			}
			function test_revert_when_quantity_requested_is_zero(address account) public {
				setPublicSale();
				vm.assume(account != address(0));
				vm.prank(account);
				revertWhenInvalidQuantityRequested(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						0
					)
				);
			}
			function test_revert_when_requesting_more_than_max_batch(uint256 amount, address account) public {
				setPublicSale();
				vm.assume(account != address(0));
				amount = bound(amount, MAX_BATCH, 4094);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenQtyOverMaxBatch(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						amount
					),
					amount,
					MAX_BATCH,
					price
				);
			}
			function test_revert_when_supply_is_depleted(uint256 amount, address account) public {
				depleteSupply();
				setPublicSale();
				vm.assume(account != address(0));
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				revertWhenMintedOut(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						amount
					),
					amount,
					0,
					price
				);
			}
			function test_revert_when_incorrect_amount_of_ether_sent(uint256 amount, address account) public {
				setPublicSale();
				vm.assume(account != address(0));
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.prank(account);
				revertWhenIncorrectEtherAmountSent(
					address(testContract),
					abi.encodeWithSignature(
						"publicMint(uint256)",
						amount
					),
					0,
					price
				);
			}
			function test_emit_Transfer_events(uint256 amount, address account) public {
				setPublicSale();
				vm.assume(account != address(0));
				amount = bound(amount, 1, MAX_BATCH);
				uint256 price = amount * PUBLIC_SALE_PRICE;
				vm.deal(account, price);
				vm.prank(account);
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), account, i);
				}
				testContract.publicMint{value: price}(amount);
				assertEq(
					address(testContract).balance,
					price,
					"invalid contract ether balance"
				);
				assertEq(
					testContract.balanceOf(account),
					amount,
					"invalid balance"
				);
			}
		}
  // ***************

  // ***********
  // * IERC721 *
  // ***********
    contract Approve is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(TOKEN_OWNER);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_operator_not_approved(address operator) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_approving_token_owner() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidApproval(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            TOKEN_OWNER,
            TARGET_TOKEN
          )
        );
      }
      function test_emit_Approval_event_when_caller_is_token_owner(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            operator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          operator,
          "invalid approval"
        );
      }
      function test_emit_Approval_event_when_caller_is_individually_approved(address operator, address secondOperator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(secondOperator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, TARGET_TOKEN);
        vm.prank(operator);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            secondOperator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          secondOperator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          secondOperator,
          "invalid approval"
        );
      }
      function test_emit_Approval_event_when_caller_is_approved_for_all(address operator, address secondOperator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(secondOperator != TOKEN_OWNER);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitApprovalEvent(
          address(testContract),
          abi.encodeWithSignature(
            "approve(address,uint256)",
            secondOperator,
            TARGET_TOKEN
          ),
          address(testContract),
          TOKEN_OWNER,
          secondOperator,
          TARGET_TOKEN
        );
        assertEq(
          testContract.getApproved(TARGET_TOKEN),
          secondOperator,
          "invalid approval"
        );
      }
    }
    contract SafeTransferFrom is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            operator,
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            from,
            to,
            TARGET_TOKEN
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_receiver_is_non_receiver_contract() public {
        mintFixture();
        Mock_NonERC721Receiver nonReceiver = new Mock_NonERC721Receiver();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(nonReceiver),
            TARGET_TOKEN
          ),
          address(nonReceiver)
        );
      }
      function test_revert_when_receiver_contract_returns_unexpected_value(bytes4 retval) public {
        mintFixture();
        vm.assume(retval != type(IERC721Receiver).interfaceId);
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.None);
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          address(receiver)
        );
      }
      function test_revert_when_receiver_contract_reverts_with_custom_error() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithError);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithError
        );
      }
      function test_revert_when_receiver_contract_reverts_with_message() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithMessage
        );
      }
      function test_revert_when_receiver_contract_reverts_without_message() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithoutMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.RevertWithoutMessage
        );
      }
      function test_revert_when_receiver_contract_panics() public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.Panic);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN
          ),
          Mock_ERC721Receiver.Error.Panic
        );
      }
      function test_emit_Transfer_event_when_caller_is_contract_owner(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
    }
    contract SafeTransferFromWithData is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            operator,
            operator,
            tokenId,
            data
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero(bytes memory data) public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN,
            data
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to, bytes memory data) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            from,
            to,
            TARGET_TOKEN,
            data
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN,
            data
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_revert_when_receiver_is_non_receiver_contract(bytes memory data) public {
        mintFixture();
        Mock_NonERC721Receiver nonReceiver = new Mock_NonERC721Receiver();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(nonReceiver),
            TARGET_TOKEN,
            data
          ),
          address(nonReceiver)
        );
      }
      function test_revert_when_receiver_contract_returns_unexpected_value(bytes4 retval, bytes memory data) public {
        mintFixture();
        vm.assume(retval != type(IERC721Receiver).interfaceId);
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.None);
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          address(receiver)
        );
      }
      function test_revert_when_receiver_contract_reverts_with_custom_error(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithError);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithError
        );
      }
      function test_revert_when_receiver_contract_reverts_with_message(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithMessage
        );
      }
      function test_revert_when_receiver_contract_reverts_without_message(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.RevertWithoutMessage);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.RevertWithoutMessage
        );
      }
      function test_revert_when_receiver_contract_panics(bytes memory data) public {
        mintFixture();
        bytes4 retval = type(IERC721Receiver).interfaceId;
        Mock_ERC721Receiver receiver = new Mock_ERC721Receiver(retval, Mock_ERC721Receiver.Error.Panic);
        vm.prank(TOKEN_OWNER);
        revertWhenReceiverReverts(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            address(receiver),
            TARGET_TOKEN,
            data
          ),
          Mock_ERC721Receiver.Error.Panic
        );
      }
      function test_emit_Transfer_event_when_caller_is_contract_owner(uint256 tokenId, bytes memory data) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId, bytes memory data) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "safeTransferFrom(address,address,uint256,bytes)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId,
            data
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
    }
    contract SetApprovalForAll is Deployed {
      function test_revert_when_approving_self() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidApproval(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            TOKEN_OWNER,
            true
          )
        );
        assertFalse(testContract.isApprovedForAll(TOKEN_OWNER, TOKEN_OWNER), "invalid approval");
      }
      function test_emit_ApprovalForAll_when_approving_other(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != address(0));
        vm.prank(TOKEN_OWNER);
        emitApprovalForAllEvent(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            operator,
            true
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          true
        );
        assertTrue(
          testContract.isApprovedForAll(TOKEN_OWNER, operator),
          "invalid approval"
        );
      }
      function test_emit_ApprovalForAll_when_disproving_other(address operator) public {
        mintFixture();
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != address(0));
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(TOKEN_OWNER);
        emitApprovalForAllEvent(
          address(testContract),
          abi.encodeWithSignature(
            "setApprovalForAll(address,bool)",
            operator,
            false
          ),
          address(testContract),
          TOKEN_OWNER,
          operator,
          false
        );
        assertFalse(
          testContract.isApprovedForAll(TOKEN_OWNER, operator),
          "invalid approval"
        );
      }
    }
    contract TransferFrom is Deployed {
      function test_revert_when_token_dont_exist(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(tokenId > MINTED_SUPPLY);
        vm.prank(operator);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            operator,
            operator,
            tokenId
          ),
          tokenId
        );
      }
      function test_revert_when_to_is_address_zero() public {
        mintFixture();
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidReceiver(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            address(0),
            TARGET_TOKEN
          ),
          address(0)
        );
      }
      function test_revert_when_from_dont_own_token(address from, address to) public {
        mintFixture();
        vm.assume(from != TOKEN_OWNER);
        vm.assume(to != address(0));
        vm.prank(TOKEN_OWNER);
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            from,
            to,
            TARGET_TOKEN
          )
        );
      }
      function test_revert_when_operator_not_approved(address operator, address to) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        vm.assume(operator != testContract.getApproved(TARGET_TOKEN));
        vm.assume(! testContract.isApprovedForAll(TOKEN_OWNER, operator));
        vm.assume(to != address(0));
        vm.assume(! isContract(to));
        vm.prank(operator);
        revertWhenCallerNotApproved(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            to,
            TARGET_TOKEN
          ),
          operator,
          TARGET_TOKEN
        );
      }
      function test_emit_Transfer_event_when_caller_is_contract_owner(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, 1, 6); 
        vm.prank(TOKEN_OWNER);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_individually_approved(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.approve(operator, tokenId);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
      function test_emit_Transfer_event_when_caller_is_approved_for_all(address operator, uint256 tokenId) public {
        mintFixture();
        vm.assume(operator != address(0));
        vm.assume(operator != TOKEN_OWNER);
        tokenId = bound(tokenId, 1, 6);
        vm.prank(TOKEN_OWNER);
        testContract.setApprovalForAll(operator, true);
        vm.prank(operator);
        emitTransferEvent(
          address(testContract),
          abi.encodeWithSignature(
            "transferFrom(address,address,uint256)",
            TOKEN_OWNER,
            OTHER_OWNER,
            tokenId
          ),
          address(testContract),
          TOKEN_OWNER,
          OTHER_OWNER,
          tokenId
        );
        assertEq(
          testContract.ownerOf(tokenId),
          OTHER_OWNER,
          "invalid token owner"
        );
      }
    }
  // ***********
// **************************************

// **************************************
// *****       CONTRACT OWNER       *****
// **************************************
  // ***************
  // * Template721 *
  // ***************
		contract Airdrop is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				address[] memory addresses = new address[](1);
				addresses[0] = user1.publicKey;
				uint256[] memory amounts = new uint256[](1);
				amounts[0] = 1;
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"airdrop(address[],uint256[])",
						addresses,
						amounts
					),
					operator
				);
			}
			function test_revert_when_array_lengths_dont_match() public {
				address[] memory addresses = new address[](1);
				addresses[0] = user1.publicKey;
				uint256[] memory amounts = new uint256[](2);
				amounts[0] = 1;
				amounts[1] = 2;
				revertWhenArrayLengthsDontMatch(
					address(testContract),
					abi.encodeWithSignature(
						"airdrop(address[],uint256[])",
						addresses,
						amounts
					)
				);
			}
			function test_revert_when_airdropping_more_than_the_reserve_to_one_user(uint256 amount) public {
				amount = bound(amount, RESERVE, 4094);
				address[] memory addresses = new address[](1);
				addresses[0] = user1.publicKey;
				uint256[] memory amounts = new uint256[](1);
				amounts[0] = amount;
				revertWhenReserveDepleted(
					address(testContract),
					abi.encodeWithSignature(
						"airdrop(address[],uint256[])",
						addresses,
						amounts
					),
					amount,
					RESERVE
				);
			}
			function test_revert_when_airdropping_more_than_the_reserve_to_several_users() public {
				address[] memory addresses = new address[](2);
				uint256[] memory amounts = new uint256[](2);
				addresses[0] = user1.publicKey;
				addresses[1] = user2.publicKey;
				amounts[0] = 1;
				amounts[1] = RESERVE;
				revertWhenReserveDepleted(
					address(testContract),
					abi.encodeWithSignature(
						"airdrop(address[],uint256[])",
						addresses,
						amounts
					),
					RESERVE + 1,
					RESERVE
				);
			}
			function test_emit_Transfer_events(address account1, address account2, uint256 amount1, uint256 amount2) public {
				vm.assume(account1 != address(0));
				vm.assume(account2 != address(0));
				amount1 = bound(amount1, 1, RESERVE - 1);
				amount2 = bound(amount2, 1, RESERVE - amount1);
				address[] memory addresses = new address[](2);
				addresses[0] = account1;
				addresses[1] = account2;
				uint256[] memory amounts = new uint256[](2);
				amounts[0] = amount1;
				amounts[1] = amount2;
				for (uint256 i = FIRST_TOKEN; i < FIRST_TOKEN + amount1; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), account1, i);
				}
				for (uint256 i = FIRST_TOKEN + amount1; i < amount1 + amount2; ++i) {
					vm.expectEmit(address(testContract));
					emit Transfer(address(0), account2, i);
				}
				testContract.airdrop(addresses, amounts);
				assertEq(
					testContract.balanceOf(account1),
					amount1,
					"invalid account1 balance"
				);
				assertEq(
					testContract.balanceOf(account2),
					amount2,
					"invalid account2 balance"
				);
			}
		}
		contract ReduceReserve is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"reduceReserve(uint256)",
						0
					),
					operator
				);
			}
			function test_revert_when_increasing_reserve(uint256 amount) public {
				vm.assume(amount > RESERVE);
				revertWhenInvalidReserve(
					address(testContract),
					abi.encodeWithSignature(
						"reduceReserve(uint256)",
						amount
					)
				);
			}
			function test_decrease_reserve_successfully(uint256 amount) public {
				amount = bound(amount, 0, RESERVE - 1);
				testContract.reduceReserve(amount);
				assertEq(
					testContract.reserve(),
					amount,
					"invalid reserve"
				);
			}
		}
		contract ReduceSupply is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"reduceSupply(uint256)",
						RESERVE
					),
					operator
				);
			}
			function test_revert_when_increasing_supply(uint256 amount) public {
				vm.assume(amount > MAX_SUPPLY);
				revertWhenInvalidSupply(
					address(testContract),
					abi.encodeWithSignature(
						"reduceSupply(uint256)",
						amount
					)
				);
			}
			function test_revert_when_decreasing_supply_below_reserve(uint256 amount) public {
				vm.assume(amount < RESERVE);
				revertWhenInvalidSupply(
					address(testContract),
					abi.encodeWithSignature(
						"reduceSupply(uint256)",
						amount
					)
				);
			}
			function test_decrease_supply_successfully(uint256 amount) public {
				amount = bound(amount, RESERVE, MAX_SUPPLY - 1);
				testContract.reduceSupply(amount);
				assertEq(
					testContract.maxSupply(),
					amount,
					"invalid supply"
				);
			}
		}
		contract SetContractState is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setContractState(uint8)",
						Template721.ContractState.PUBLIC_SALE
					),
					operator
				);
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"invalid state"
				);
			}
			function test_revert_when_new_state_is_invalid(uint8 newState) public {
				vm.assume(newState > uint8(Template721.ContractState.PUBLIC_SALE));
				revertWhenContractStateIsInvalid(
					address(testContract),
					abi.encodeWithSignature(
						"setContractState(uint8)",
						newState
					)
				);
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"invalid state"
				);
			}
			function test_emit_ContractStateChanged_event(uint8 newState) public {
				vm.assume(newState < uint8(Template721.ContractState.PUBLIC_SALE) + 1);
				emitContractStateChangedEvent(
					address(testContract),
					abi.encodeWithSignature(
						"setContractState(uint8)",
						newState
					),
					address(testContract),
					uint8(Template721.ContractState.PAUSED),
					uint8(newState)
				);
				assertEq(
					uint8(testContract.contractState()),
					uint8(newState),
					"invalid state"
				);
			}
		}
		contract SetPrices is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setPrices(uint256,uint256)",
						0,
						0
					),
					operator
				);
			}
			function test_update_prices_accurately(uint256 newPrivatePrice, uint256 newPublicPrice) public {
				testContract.setPrices(newPrivatePrice, newPublicPrice);
				assertEq(
					testContract.salePrice(Template721.ContractState.PRIVATE_SALE),
					newPrivatePrice,
					"invalid private price"
				);
				assertEq(
					testContract.salePrice(Template721.ContractState.PUBLIC_SALE),
					newPublicPrice,
					"invalid public price"
				);
			}
		}
		contract SetTreasury is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setTreasury(address)",
						operator
					),
					operator
				);
			}
			function test_update_treasury_successfully(address newTreasury) public {
				vm.assume(newTreasury != TREASURY);
				testContract.setTreasury(newTreasury);
				assertEq(
					testContract.treasury(),
					newTreasury,
					"invalid treasury address"
				);
			}
		}
		contract Withdraw is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"withdraw()"
					),
					operator
				);
			}
			function test_revert_when_contract_holds_no_eth() public {
				revertWhenNoEtherBalance(
					address(testContract),
					abi.encodeWithSignature(
						"withdraw()"
					)
				);
			}
			function test_revert_when_treasury_cant_receive_eth() public {
				mintFixture();
				Mock_Invalid_Eth_Receiver newTreasury = new Mock_Invalid_Eth_Receiver();
				testContract.setTreasury(address(newTreasury));
				revertWhenEtherTransferFail(
					address(testContract),
					abi.encodeWithSignature(
						"withdraw()"
					),
					address(newTreasury),
					MINTED_SUPPLY * PUBLIC_SALE_PRICE
				);
			}
			function test_eth_balance_transferred_successfully() public {
				mintFixture();
				testContract.withdraw();
				assertEq(
					address(TREASURY).balance,
					1 ether + MINTED_SUPPLY * PUBLIC_SALE_PRICE,
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

  // ***********
  // * IERC173 *
  // ***********
		contract TransferOwnership is Deployed {
		  function test_cannot_transfer_ownership_when_not_owner(address operator) public {
		    vm.assume(operator != address(this));
		    vm.prank(operator);
		    revertWhenCallerNotContractOwner(
		      address(testContract),
		      abi.encodeWithSignature(
		        "transferOwnership(address)",
		        operator
		      ),
		      operator
		    );
		  }
		  function test_emit_transfer_ownership_when_owner(address newOwner) public {
		    vm.assume(newOwner != address(this));
		    emitOwnershipTransferredEvent(
		      address(testContract),
		      abi.encodeWithSignature(
		        "transferOwnership(address)",
		        newOwner
		      ),
		      address(testContract),
		      address(this),
		      newOwner
		    );
		    assertEq(
		      testContract.owner(),
		      newOwner,
		      "invalid owner"
		    );
		  }
		  function test_renounce_ownership() public {
		    emitOwnershipTransferredEvent(
		      address(testContract),
		      abi.encodeWithSignature(
		        "transferOwnership(address)",
		        address(0)
		      ),
		      address(testContract),
		      address(this),
		      address(0)
		    );
		    assertEq(
		      testContract.owner(),
		      address(0),
		      "invalid owner"
		    );
		  }
		}
	// ***********

  // ************
  // * IERC2981 *
  // ************
		contract SetRoyaltyInfo is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setRoyaltyInfo(address,uint256)",
						operator,
						0
					),
					operator
				);
			}
		  function test_revert_when_new_royalty_rate_is_higher_than_royalty_base(uint96 newRate) public {
		    vm.assume(newRate > ROYALTY_BASE);
		    revertWhenInvalidRoyalties(
		      address(testContract),
		      abi.encodeWithSignature(
		        "setRoyaltyInfo(address,uint96)",
		        user1.publicKey,
		        newRate
		      )
		    );
		  }
		  function test_setting_royalties(address newRecipient, uint96 newRate, uint256 tokenId, uint256 price) public {
		    vm.assume(newRate > 0);
		    vm.assume(newRate <= ROYALTY_BASE);
		    vm.assume(newRecipient != address(0));
		    testContract.setRoyaltyInfo(newRecipient, newRate);
		    price = bound(price, 100, 1e36); 
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      newRecipient,
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      price * newRate / ROYALTY_BASE,
		      "invalid royalty amount"
		    );
		  }
		  function test_removing_royalty_recipient(uint96 newRate, uint256 tokenId, uint256 price) public {
		    vm.assume(newRate > 0);
		    vm.assume(newRate <= ROYALTY_BASE);
		    testContract.setRoyaltyInfo(address(0), newRate);
		    price = bound(price, 100, 1e36); 
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      address(0),
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      0,
		      "invalid royalty amount"
		    );
		  }
		  function test_removing_royalty_rate(address newRecipient, uint256 tokenId, uint256 price) public {
		    vm.assume(newRecipient != address(0));
		    testContract.setRoyaltyInfo(address(0), 0);
		    price = bound(price, 100, 1e36); 
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      address(0),
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      0,
		      "invalid royalty amount"
		    );
		  }
		}
  // ************

  // *******************
  // * IERC721Metadata *
  // *******************
		contract SetBaseUri is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setBaseUri(uint256)",
						""
					),
					operator
				);
			}
      function test_set_base_uri_successfully(uint256 tokenId, string memory newBaseUri) public {
        mintFixture();
        testContract.setBaseUri(newBaseUri);
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(newBaseUri, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
		}
  // *******************

  // *************
  // * Whitelist *
  // *************
		contract SetWhitelist is Deployed {
			function test_revert_when_caller_is_not_contract_owner(address operator) public {
				vm.assume(operator != address(this));
				vm.prank(operator);
				revertWhenCallerNotContractOwner(
					address(testContract),
					abi.encodeWithSignature(
						"setWhitelist(uint256)",
						FORGER.publicKey
					),
					operator
				);
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
		contract MaxBatch is Deployed {
			function test_max_batch_is_accurate() public {
				assertEq(
					testContract.MAX_BATCH(),
					MAX_BATCH,
					"incorrect max batch"
				);
			}
		}
		contract ContractState is Deployed {
			function test_contract_state_is_paused() public {
				assertEq(
					uint8(testContract.contractState()),
					uint8(Template721.ContractState.PAUSED),
					"incorrect contract state"
				);
			}
		}
		contract MaxSupply is Deployed {
			function test_max_supply_is_accurate() public {
				assertEq(
					testContract.maxSupply(),
					MAX_SUPPLY,
					"incorrect max supply"
				);
			}
		}
		contract Reserve is Deployed {
			function test_reserve_is_accurate() public {
				assertEq(
					testContract.reserve(),
					RESERVE,
					"incorrect reserve"
				);
			}
		}
		contract Treasury is Deployed {
			function test_treasury_is_accurate() public {
				assertEq(
					testContract.treasury(),
					TREASURY,
					"incorrect treasury"
				);
			}
		}
		contract SalePrice is Deployed {
			function test_sale_prices_are_accurate() public {
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

  // *************
  // * Whitelist *
  // *************
		contract CheckWhitelistAllowance is Deployed {
		  function test_revert_when_whitelist_is_not_set(
		    address account,
		    uint256 alloted
		  ) public {
		  	removeWhitelistFixture();
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
		    revertWhenWhitelistNotSet(
		      address(testContract),
		      abi.encodeWithSignature(
		        "checkWhitelistAllowance(address,uint8,uint256,tuple(bytes32,bytes32,uint8))",
		        account,
		        WHITELIST_ID,
		        alloted,
		        proof
		      )
		    );
		  }
		  function test_return_zero_when_checking_allowance_with_other_user_proof(
		    address account,
		    uint256 alloted
		  ) public {
		    vm.assume(account != WHITELISTED);
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, WHITELISTED, SIGNER);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      0,
		      "invalid allowance"
		    );
		  }
		  function test_return_zero_when_checking_allowance_with_forged_proof(
		    address account,
		    uint256 alloted
		  ) public {
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, FORGER);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      0,
		      "invalid allowance"
		    );
		  }
		  function test_return_zero_when_checking_allowance_for_different_whitelist_than_allocated(
		    address account,
		    uint8 whitelistId,
		    uint256 alloted
		  ) public {
		    vm.assume(whitelistId != WHITELIST_ID);
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, whitelistId, alloted, proof),
		      0,
		      "invalid allowance"
		    );
		  }
		  function test_return_zero_when_checking_allowance_for_more_than_allocated(
		    address account,
		    uint256 alloted
		  ) public {
		    vm.assume(alloted > ALLOCATED);
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, ALLOCATED, account, SIGNER);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      0,
		      "invalid allowance"
		    );
		  }
		  function test_allowance_is_accurate_when_whitelist_allocation_has_not_been_consumed(
		    address account,
		    uint256 alloted
		  ) public {
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      alloted,
		      "invalid allowance"
		    );
		  }
		  function test_allowance_is_accurate_when_whitelist_allocation_has_been_partially_consumed(
		    address account,
		    uint256 alloted
		  ) public {
		    alloted = bound(alloted, 1, MAX_SUPPLY - RESERVE);
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
		    consumeAllowanceFixture(account, WHITELIST_CONSUMED, alloted, proof);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      alloted - WHITELIST_CONSUMED,
		      "invalid allowance"
		    );
		  }
		  function test_allowance_is_accurate_when_whitelist_allocation_has_been_fully_consumed(
		    address account,
		    uint256 alloted
		  ) public {
		    alloted = bound(alloted, 1, MAX_SUPPLY - RESERVE);
		    IWhitelist.Proof memory proof = createProof(WHITELIST_ID, alloted, account, SIGNER);
		    consumeAllowanceFixture(account, alloted, alloted, proof);
		    assertEq(
		      testContract.checkWhitelistAllowance(account, WHITELIST_ID, alloted, proof),
		      0,
		      "invalid allowance"
		    );
		  }
		}
  // *************

  // ***********
  // * IERC173 *
  // ***********
		contract Owner is Deployed {
		  function test_owner_is_correct() public {
		    assertEq(
		      testContract.owner(),
		      address(this),
		      "invalid owner"
		    );
		  }
		}
  // ***********

  // ************
  // * IERC2981 *
  // ************
		contract RoyaltyBase is Deployed {
		  function test_royalty_base_is_correct() public {
		    assertEq(
		      testContract.ROYALTY_BASE(),
		      ROYALTY_BASE,
		      "invalid royalty base"
		    );
		  }
		}

		contract RoyaltyInfo is Deployed {
		  function test_no_royalties_when_price_is_zero(uint256 tokenId) public {
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, 0);
		    assertEq(
		      recipient,
		      address(0),
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      0,
		      "invalid royalty amount"
		    );
		  }
		  function test_royalty_info_is_accurate(uint256 tokenId, uint256 price) public {
		    price = bound(price, 100, 1e36); 
		    (address recipient, uint256 royaltyAmount) = testContract.royaltyInfo(tokenId, price);
		    assertEq(
		      recipient,
		      ROYALTY_RECIPIENT,
		      "invalid royalty recipient"
		    );
		    assertEq(
		      royaltyAmount,
		      price * ROYALTY_RATE / ROYALTY_BASE,
		      "invalid royalty amount"
		    );
		  }
		}
  // ************

  // ***********
  // * IERC721 *
  // ***********
    contract BalanceOf is Deployed {
      function test_revert_when_checking_balance_of_zero_address() public {
        mintFixture();
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "balanceOf(address)",
            address(0)
          )
        );
      }
      function test_balance_of_non_token_owner_is_zero(address nonOwner) public {
        mintFixture();
        vm.assume(nonOwner != address(0));
        vm.assume(nonOwner != TOKEN_OWNER);
        vm.assume(nonOwner != OTHER_OWNER);
        assertEq(
          testContract.balanceOf(nonOwner),
          0,
          "invalide balance"
        );
      }
      function test_balance_of_token_owners_is_accurate() public {
        mintFixture();
        assertEq(
          testContract.balanceOf(TOKEN_OWNER),
          TOKEN_OWNER_SUPPLY,
          "invalid TOKEN_OWNER balance"
        );
        assertEq(
          testContract.balanceOf(OTHER_OWNER),
          OTHER_OWNER_SUPPLY,
          "invalid OTHER_OWNER balance"
        );
      }
    }
    contract GetApproved is Deployed {
      function test_revert_when_requesting_approval_status_of_token_zero() public {
        mintFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "getApproved(uint256)", 0
          ),
          0
        );
      }
      function test_revert_when_requesting_approval_status_of_non_existant_token(uint256 tokenId) public {
        mintFixture();
        vm.assume(tokenId > MINTED_SUPPLY);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "getApproved(uint256)", tokenId
          ),
          tokenId
        );
      }
      function test_individual_approval_status_of_freshly_minted_token_is_address_zero(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          testContract.getApproved(tokenId),
          address(0),
          "invalid approval"
        );
      }
    }
    contract IsApprovedForAll is Deployed {
      function test_approval_for_all_status_is_false_by_default(address tokenOwner, address operator) public {
        mintFixture();
        assertFalse(
          testContract.isApprovedForAll(tokenOwner, operator),
          "invalid approval"
        );
      }
    }
    contract OwnerOf is Deployed {
      function test_revert_when_requesting_ownership_of_token_zero() public {
        mintFixture();
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "ownerOf(uint256)", 0
          ),
          0
        );
      }
      function test_revert_when_requesting_ownership_of_non_existant_token(uint256 tokenId) public {
        mintFixture();
        vm.assume(tokenId > MINTED_SUPPLY);
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "ownerOf(uint256)", tokenId
          ),
          tokenId
        );
      }
      function test_ownership_of_existing_tokens_is_accurate(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        if (tokenId == 7) {
          assertEq(
            testContract.ownerOf(tokenId),
            OTHER_OWNER,
            "invalid owner"
          );
        }
        else {
          assertEq(
            testContract.ownerOf(tokenId),
            TOKEN_OWNER,
            "invalid owner"
          );
        }
      }
    }
  // ***********

  // *********************
  // * IERC721Enumerable *
  // *********************
    contract TokenByIndex is Deployed {
      function test_revert_when_requesting_token_at_non_existant_index(uint256 index) public {
        mintFixture();
        vm.assume(index > MINTED_SUPPLY - FIRST_TOKEN);
        revertWhenIndexOutOfBounds(
          address(testContract),
          abi.encodeWithSignature(
            "tokenByIndex(uint256)",
            index
          ),
          index
        );
      }
      function test_token_by_index_is_accurate(uint256 index) public {
        mintFixture();
        vm.assume(index < MINTED_SUPPLY);
        assertEq(
          testContract.tokenByIndex(index),
          index + FIRST_TOKEN,
          "invalid index"
        );
      }
    }
    contract TokenOfOwnerByIndex is Deployed {
      function test_revert_when_requesting_index_of_token_owned_by_address_zero(uint256 index) public {
        mintFixture();
        revertWhenInvalidTokenOwner(
          address(testContract),
          abi.encodeWithSignature(
            "tokenOfOwnerByIndex(address,uint256)",
            address(0),
            index
          )
        );
      }
      function test_revert_when_requesting_index_of_non_owned_token(uint256 index, address tokenOwner) public {
        mintFixture();
        vm.assume(index > 9);
        vm.assume(tokenOwner != address(0));
        revertWhenOwnerIndexOutOfBounds(
          address(testContract),
          abi.encodeWithSignature(
            "tokenOfOwnerByIndex(address,uint256)",
            tokenOwner,
            index
          ),
          index
        );
      }
      function test_token_of_owner_by_index_is_accurate(uint256 index) public {
        mintFixture();
        assertEq(
          testContract.tokenOfOwnerByIndex(OTHER_OWNER, 0),
          OTHER_OWNER_TOKEN,
          "invalid token id"
        );
        vm.assume(index < MINTED_SUPPLY - FIRST_TOKEN);
        if (index < TOKEN_OWNER_INIT_SUPPLY) {
          assertEq(
            testContract.tokenOfOwnerByIndex(TOKEN_OWNER, index),
            index + FIRST_TOKEN,
            "invalid token id"
          );
        }
        else {
          assertEq(
            testContract.tokenOfOwnerByIndex(TOKEN_OWNER, index),
            index + FIRST_TOKEN + OTHER_OWNER_SUPPLY,
            "invalid token id"
          );
        }
      }
    }
    contract TotalSupply is Deployed {
      function test_initial_total_supply_is_accurate() public {
        assertEq(
          testContract.totalSupply(),
          0,
          "invalid total supply"
        );
      }
      function test_total_supply_is_accurate_after_minting_some_tokens() public {
        mintFixture();
        assertEq(
          testContract.totalSupply(),
          MINTED_SUPPLY,
          "invalid total supply"
        );
      }
    }
  // *********************

  // *******************
  // * IERC721Metadata *
  // *******************
    contract Name is Deployed {
      function test_name_is_accurate() public {
        assertEq(
          testContract.name(),
          NAME,
          "invalid name"
        );
      }
    }
    contract Symbol is Deployed {
      function test_symbol_is_accurate() public {
        assertEq(
          testContract.symbol(),
          SYMBOL,
          "invalid ticker"
        );
      }
    }
    contract TokenURI is Deployed {
      function test_revert_when_requesting_uri_of_token_zero() public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "tokenURI(uint256)",
            0
          ),
          0
        );
      }
      function test_revert_when_requesting_uri_of_non_existant_token(uint256 tokenId) public {
        revertWhenTokenDontExist(
          address(testContract),
          abi.encodeWithSignature(
            "tokenURI(uint256)",
            tokenId
          ),
          tokenId
        );
      }
      function test_token_uri_is_accurate(uint256 tokenId) public {
        mintFixture();
        tokenId = bound(tokenId, FIRST_TOKEN, MINTED_SUPPLY);
        assertEq(
          keccak256(abi.encodePacked(testContract.tokenURI(tokenId))),
          keccak256(abi.encodePacked(BASE_URI, Strings.toString(tokenId))),
          "invalid uri"
        );
      }
    }
  // *******************

  // ***********
  // * IERC165 *
  // ***********
		contract SupportsInterface is Deployed {
		  function test_supports_the_expected_interfaces() public {
		  	for (uint256 i; i < INTERFACES.length; ++i) {
			    assertEq(
			      testContract.supportsInterface(INTERFACES[i]),
			      true,
			      "invalid interface"
			    );
		  	}
		  }
		}
  // ***********
// **************************************
