// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum ResponseStatus {
    Success,
    Failed,
    TimedOut
}

struct Response {
    bool success;
    bytes data;
}

struct Request {
    uint256 agentId;
    address requester;
    bytes4 callback;
    bytes payload;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function getRequestDeposit() external view returns (uint256 deposit);
}

interface IAgentRequesterHandler {
    function handleResponse(
        uint256 requestId,
        Response[] calldata responses,
        ResponseStatus status,
        Request calldata details
    ) external;
}

