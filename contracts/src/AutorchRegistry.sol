// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Autarch} from "./Autarch.sol";

contract AutorchRegistry {
    Autarch public autarch;

    // Maintain a list of all active bounties for frontend querying
    uint256[] public activeBountyIds;
    // Optional mapping to store details like categories, etc.

    event BountyRegistered(uint256 indexed bountyId);

    constructor(address _autarch) {
        autarch = Autarch(payable(_autarch));
    }

    /// @notice Used to index or feature a specific bounty on the frontend
    function registerBounty(uint256 bountyId) external {
        Autarch.BountyStatus status = autarch.getBountyStatus(bountyId);

        // Ensure it actually exists by checking it's at least created
        // We aren't doing strict access control because anyone can register an open bounty
        require(
            uint256(status) == uint256(Autarch.BountyStatus.Open),
            "Bounty is not open"
        );

        activeBountyIds.push(bountyId);
        emit BountyRegistered(bountyId);
    }

    function getActiveBounties() external view returns (uint256[] memory) {
        return activeBountyIds;
    }
}
