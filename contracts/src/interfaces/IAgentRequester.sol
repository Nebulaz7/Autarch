// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Response {
    bool success;
    bytes data;
}

interface IAgentRequester {
    /// @notice Request execution from a Somnia agent
    /// @param agentId The ID of the agent to invoke (e.g., JSON API, LLM Parse, LLM Inference)
    /// @param payload The ABI-encoded parameters for the agent
    /// @return requestId The unique ID of the request
    function request(uint256 agentId, bytes calldata payload) external returns (uint256 requestId);

    /// @notice The callback function Somnia validators will call when consensus is reached
    /// @param requestId The ID of the request
    /// @param responses The output of the agent execution
    function handleResponse(uint256 requestId, Response[] memory responses) external;
}
