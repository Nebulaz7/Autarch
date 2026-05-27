// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Autarch} from "./Autarch.sol";

contract AutorchArbiter {
    Autarch public autarch;

    // Address of the trusted human fallback or multisig
    address public trustedArbiter;

    event ArbiterUpdated(
        address indexed oldArbiter,
        address indexed newArbiter
    );

    error NotAuthorized();

    modifier onlyTrustedArbiter() {
        _onlyTrustedArbiter();
        _;
    }

    function _onlyTrustedArbiter() internal view {
        if (msg.sender != trustedArbiter) revert NotAuthorized();
    }

    constructor(address _autarch, address _trustedArbiter) {
        autarch = Autarch(_autarch);
        trustedArbiter = _trustedArbiter;
    }

    /// @notice A wrapper method for the arbiter to settle disputes
    /// @dev The underlying Autarch contract requires 'arbiter' to call it.
    /// This means the Autarch contract should actually be deployed with `address(this)` as the `_arbiter`.
    function resolveDispute(
        uint256 bountyId,
        bool approved
    ) external onlyTrustedArbiter {
        autarch.settleDispute(bountyId, approved);
    }

    function updateArbiter(address _newArbiter) external onlyTrustedArbiter {
        emit ArbiterUpdated(trustedArbiter, _newArbiter);
        trustedArbiter = _newArbiter;
    }
}
