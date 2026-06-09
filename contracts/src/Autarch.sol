// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAgentRequester, IAgentRequesterHandler, Response, Request, ResponseStatus} from "./interfaces/IAgentRequester.sol";

contract Autarch is IAgentRequesterHandler {
    enum BountyStatus {
        Open,
        UnderReview,
        Passed,
        Failed,
        Disputed,
        Settled
    }

    enum PipelineStep {
        None,
        FetchingDiff,
        ScrapingPreview,
        Evaluating
    }

    struct Bounty {
        uint256 id;
        address poster;
        address developer;
        uint256 amount;
        string spec;
        string prUrl;
        string previewUrl;
        BountyStatus status;
        PipelineStep step;
        string codeDiff;
        string uiScrape;
        uint256 requestId;
        uint256 createdAt;
        uint256 submittedAt;
        uint256 disputeDeadline;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) internal _bounties;

    /// @notice Get a bounty by ID
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return _bounties[bountyId];
    }

    /// @notice Get just the status of a bounty (gas-efficient for on-chain callers)
    function getBountyStatus(
        uint256 bountyId
    ) external view returns (BountyStatus) {
        return _bounties[bountyId].status;
    }

    // Maps a Somnia Agent requestId to the corresponding bountyId
    mapping(uint256 => uint256) public requestToBounty;

    IAgentRequester public immutable PLATFORM;
    address public arbiter;

    // Agent IDs (Assumed standard for Somnia - can be configured)
    uint256 public constant AGENT_JSON_API = 1;
    uint256 public constant AGENT_LLM_PARSE = 2;
    uint256 public constant AGENT_LLM_INFERENCE = 3;

    uint256 public constant DISPUTE_WINDOW = 24 hours;

    // Events
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed poster,
        uint256 amount
    );
    event WorkSubmitted(
        uint256 indexed bountyId,
        address indexed developer,
        uint256 requestId
    );
    event PipelineAdvanced(
        uint256 indexed bountyId,
        PipelineStep newStep,
        uint256 newRequestId
    );
    event BountyEvaluationResult(
        uint256 indexed bountyId,
        bool passed,
        uint256 confidence
    );
    event FundsReleased(
        uint256 indexed bountyId,
        address indexed developer,
        uint256 amount
    );
    event DisputeRaised(uint256 indexed bountyId);
    event DisputeSettled(uint256 indexed bountyId, bool approved);

    error NotAuthorized();
    error InvalidState();
    error PaymentFailed();
    error DisputeWindowExpired();
    error DisputeWindowNotExpired();

    address public owner;

    modifier onlyArbiter() {
        _onlyArbiter();
        _;
    }

    function _onlyArbiter() internal view {
        if (msg.sender != arbiter) revert NotAuthorized();
    }

    constructor(address _platformAddress) {
        PLATFORM = IAgentRequester(_platformAddress);
        owner = msg.sender;
    }

    /// @notice Set the arbiter address (can only be called once by the owner)
    function setArbiter(address _arbiter) external {
        if (msg.sender != owner) revert NotAuthorized();
        if (arbiter != address(0)) revert InvalidState(); // Can only set once
        arbiter = _arbiter;
    }

    /// @notice Create a new bounty with plain English success criteria
    function createBounty(string calldata spec) external payable {
        if (msg.value == 0) revert PaymentFailed();

        bountyCount++;
        Bounty storage b = _bounties[bountyCount];
        b.id = bountyCount;
        b.poster = msg.sender;
        b.amount = msg.value;
        b.spec = spec;
        b.status = BountyStatus.Open;
        b.step = PipelineStep.None;
        b.createdAt = block.timestamp;

        emit BountyCreated(bountyCount, msg.sender, msg.value);
    }

    /// @notice Submit work with PR and preview URLs
    function submitWork(
        uint256 bountyId,
        string calldata prUrl,
        string calldata previewUrl
    ) external payable {
        Bounty storage b = _bounties[bountyId];
        if (b.status != BountyStatus.Open) revert InvalidState();

        b.developer = msg.sender;
        b.prUrl = prUrl;
        b.previewUrl = previewUrl;
        b.status = BountyStatus.UnderReview;
        b.step = PipelineStep.FetchingDiff;
        b.submittedAt = block.timestamp;

        // Step 1: Encode JSON API payload
        // NOTE: Standard payload assumption.
        bytes memory payload = abi.encode(prUrl);
        
        uint256 deposit = PLATFORM.getRequestDeposit();
        if (msg.value < deposit) revert PaymentFailed();

        uint256 requestId = PLATFORM.createRequest{value: deposit}(
            AGENT_JSON_API,
            address(this),
            this.handleResponse.selector,
            payload
        );

        b.requestId = requestId;
        requestToBounty[requestId] = bountyId;

        if (msg.value > deposit) {
            (bool success, ) = msg.sender.call{value: msg.value - deposit}("");
            require(success, "Refund failed");
        }

        emit WorkSubmitted(bountyId, msg.sender, requestId);
    }

    /// @notice The callback function Somnia validators will call when consensus is reached
    function handleResponse(
        uint256 requestId,
        Response[] calldata responses,
        ResponseStatus status,
        Request calldata details
    ) external {
        if (msg.sender != address(PLATFORM)) revert NotAuthorized();
        
        uint256 bountyId = requestToBounty[requestId];
        
        if (status != ResponseStatus.Success || responses.length == 0 || !responses[0].success) {
            _failBountySetupDispute(bountyId);
            return;
        }

        Bounty storage b = _bounties[bountyId];

        if (b.step == PipelineStep.FetchingDiff) {
            b.codeDiff = string(responses[0].data);
            b.step = PipelineStep.ScrapingPreview;

            bytes memory payload = abi.encode(b.previewUrl);
            uint256 deposit = PLATFORM.getRequestDeposit();
            uint256 newReqId = PLATFORM.createRequest{value: deposit}(
                AGENT_LLM_PARSE,
                address(this),
                this.handleResponse.selector,
                payload
            );

            b.requestId = newReqId;
            requestToBounty[newReqId] = bountyId;
            emit PipelineAdvanced(bountyId, b.step, newReqId);
        } else if (b.step == PipelineStep.ScrapingPreview) {
            b.uiScrape = string(responses[0].data);
            b.step = PipelineStep.Evaluating;

            bytes memory payload = abi.encode(b.spec, b.codeDiff, b.uiScrape);
            uint256 deposit = PLATFORM.getRequestDeposit();
            uint256 newReqId = PLATFORM.createRequest{value: deposit}(
                AGENT_LLM_INFERENCE,
                address(this),
                this.handleResponse.selector,
                payload
            );

            b.requestId = newReqId;
            requestToBounty[newReqId] = bountyId;
            emit PipelineAdvanced(bountyId, b.step, newReqId);
        } else if (b.step == PipelineStep.Evaluating) {
            (bool passed, uint256 confidence) = abi.decode(
                responses[0].data,
                (bool, uint256)
            );

            emit BountyEvaluationResult(bountyId, passed, confidence);

            if (passed && confidence > 80) {
                b.status = BountyStatus.Passed;
                _releaseFunds(bountyId);
            } else {
                _failBountySetupDispute(bountyId);
            }
        }
    }

    function _failBountySetupDispute(uint256 bountyId) internal {
        Bounty storage b = _bounties[bountyId];
        b.status = BountyStatus.Failed;
        b.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
    }

    function _releaseFunds(uint256 bountyId) internal {
        Bounty storage b = _bounties[bountyId];
        uint256 amount = b.amount;
        b.amount = 0; // Prevent reentrancy

        (bool success, ) = b.developer.call{value: amount}("");
        if (!success) revert PaymentFailed();

        emit FundsReleased(bountyId, b.developer, amount);
    }

    /// @notice Raise a dispute within the 24hr window if failed
    function raiseDispute(uint256 bountyId) external {
        Bounty storage b = _bounties[bountyId];
        if (b.status != BountyStatus.Failed) revert InvalidState();
        if (msg.sender != b.developer) revert NotAuthorized();
        if (block.timestamp > b.disputeDeadline) revert DisputeWindowExpired();

        b.status = BountyStatus.Disputed;
        emit DisputeRaised(bountyId);
    }

    /// @notice Arbiter settlement for disputes
    function settleDispute(
        uint256 bountyId,
        bool approved
    ) external onlyArbiter {
        Bounty storage b = _bounties[bountyId];
        if (b.status != BountyStatus.Disputed) revert InvalidState();

        b.status = BountyStatus.Settled;
        if (approved) {
            _releaseFunds(bountyId);
        } else {
            uint256 amount = b.amount;
            b.amount = 0;
            (bool success, ) = b.poster.call{value: amount}("");
            if (!success) revert PaymentFailed();
        }

        emit DisputeSettled(bountyId, approved);
    }

    /// @notice Get the required STT deposit for making a submission
    function getSubmissionDeposit() external view returns (uint256) {
        return PLATFORM.getRequestDeposit();
    }

    receive() external payable {}
}
