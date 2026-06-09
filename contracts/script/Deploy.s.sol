// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Autarch} from "../src/Autarch.sol";
import {AutorchRegistry} from "../src/AutorchRegistry.sol";
import {AutorchArbiter} from "../src/AutorchArbiter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address platformAddress = vm.envAddress("NEXT_PUBLIC_PLATFORM_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the fallback Arbiter
        // For the hackathon, we can set the deployer as the initial trusted arbiter
        address trustedArbiter = vm.addr(deployerPrivateKey);

        // Note: The Arbiter takes the Autarch address in its constructor,
        // and Autarch takes the Arbiter address in its constructor.
        // To resolve this circular dependency smoothly, we compute the address of Autarch beforehand
        // using the deployer's nonce.

        uint64 nonce = vm.getNonce(trustedArbiter);
        address precomputedAutarchAddress = vm.computeCreateAddress(
            trustedArbiter,
            nonce + 1
        );

        AutorchArbiter arbiter = new AutorchArbiter(
            precomputedAutarchAddress,
            trustedArbiter
        );

        // 2. Deploy Autarch core with Somnia Platform interface
        Autarch autarch = new Autarch(platformAddress);
        autarch.setArbiter(address(arbiter));

        // Let's verify that the precomputed address matches the actual deployed address
        // If it doesn't, Somnia's nonce logic might be slightly different than default EVM
        require(
            address(autarch) == precomputedAutarchAddress,
            "Nonce mismatch!"
        );

        // 3. Deploy the Registry for frontend querying
        AutorchRegistry registry = new AutorchRegistry(address(autarch));

        vm.stopBroadcast();

        console2.log("Autarch deployed to:", address(autarch));
        console2.log("Arbiter deployed to:", address(arbiter));
        console2.log("Registry deployed to:", address(registry));
    }
}
