// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Autarch} from "../src/Autarch.sol";
import {IAgentRequester} from "../src/interfaces/IAgentRequester.sol";

contract ForkAutarchTest is Test {
    Autarch public autarch;
    address public realPlatform = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;

    address public poster = address(0x1111);
    address public developer = address(0x2222);

    function setUp() public {
        // We will run this against a fork of Somnia Testnet
        autarch = new Autarch(realPlatform);
        
        vm.deal(poster, 10 ether);
        vm.deal(developer, 10 ether);
    }

    function test_ForkSubmitWork() public {
        // Create bounty
        vm.prank(poster);
        autarch.createBounty{value: 1 ether}("Fork test spec");

        // Submit work
        vm.prank(developer);
        autarch.submitWork{value: 0.03 ether}(
            1,
            "https://github.com/Nebulaz7/Devra/pull/1",
            "https://devra.vercel.app"
        );
    }
}
