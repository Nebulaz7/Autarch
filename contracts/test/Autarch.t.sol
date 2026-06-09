// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Autarch} from "../src/Autarch.sol";
import {IAgentRequester, Response, Request, ResponseStatus} from "../src/interfaces/IAgentRequester.sol";

// Mock IAgentRequester platform to simulate Somnia's L1 Agents
contract MockAgentRequester is IAgentRequester {
    uint256 public nextRequestId = 1;

    // Store request data so we can trigger callbacks in tests
    struct PendingRequest {
        uint256 agentId;
        bytes payload;
        address caller;
    }
    mapping(uint256 => PendingRequest) public pendingRequests;

    function getRequestDeposit() external pure returns (uint256) {
        return 0.03 ether;
    }

    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256) {
        uint256 reqId = nextRequestId++;
        pendingRequests[reqId] = PendingRequest({
            agentId: agentId,
            payload: payload,
            caller: callbackAddress
        });
        return reqId;
    }
}

contract AutarchTest is Test {
    Autarch public autarch;
    MockAgentRequester public platform;

    address public poster = address(1);
    address public developer = address(2);
    address public arbiter = address(3);

    function setUp() public {
        platform = new MockAgentRequester();
        autarch = new Autarch(address(platform));
        autarch.setArbiter(arbiter);

        vm.deal(poster, 100 ether);
        vm.deal(developer, 1 ether);
        vm.deal(address(autarch), 10 ether);
    }

    function test_CreateBounty() public {
        vm.prank(poster);
        autarch.createBounty{value: 1 ether}("Build a navigation bar");

        Autarch.Bounty memory b = autarch.getBounty(1);

        assertEq(b.id, 1);
        assertEq(b.poster, poster);
        assertEq(b.developer, address(0));
        assertEq(b.amount, 1 ether);
        assertEq(b.spec, "Build a navigation bar");
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.Open));
    }

    function test_SubmitWork() public {
        vm.prank(poster);
        autarch.createBounty{value: 1 ether}("Build a navigation bar");

        vm.prank(developer);
        autarch.submitWork{value: 0.03 ether}(
            1,
            "https://github.com/pr/1",
            "https://vercel.com/preview"
        );

        Autarch.Bounty memory b = autarch.getBounty(1);

        assertEq(b.developer, developer);
        assertEq(b.prUrl, "https://github.com/pr/1");
        assertEq(b.previewUrl, "https://vercel.com/preview");
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.UnderReview));
        assertEq(uint256(b.step), uint256(Autarch.PipelineStep.FetchingDiff));
        assertEq(b.requestId, 1); // Mock starts at 1
    }

    function test_FullAgentPipelinePass() public {
        // 1. Create & Submit
        vm.prank(poster);
        autarch.createBounty{value: 1 ether}("Build a navigation bar");

        vm.prank(developer);
        autarch.submitWork{value: 0.03 ether}(1, "pr_url", "preview_url");

        uint256 initialBal = developer.balance;

        // 2. Simulate Callback 1: JSON API -> returns GitHub Diff
        Response[] memory r1 = new Response[](1);
        r1[0] = Response({success: true, data: bytes("mock_diff")});
        Request memory req1 = Request({
            agentId: autarch.AGENT_JSON_API(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("pr_url")
        });
        vm.prank(address(platform));
        autarch.handleResponse(1, r1, ResponseStatus.Success, req1); // reqId 1

        // 3. Simulate Callback 2: LLM Parse -> returns UI Scrape
        Response[] memory r2 = new Response[](1);
        r2[0] = Response({success: true, data: bytes("mock_ui_html")});
        Request memory req2 = Request({
            agentId: autarch.AGENT_LLM_PARSE(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("preview_url")
        });
        vm.prank(address(platform));
        autarch.handleResponse(2, r2, ResponseStatus.Success, req2); // reqId 2

        // 4. Simulate Callback 3: LLM Inference -> returns Pass (true) + Confidence (90)
        Response[] memory r3 = new Response[](1);
        r3[0] = Response({success: true, data: abi.encode(true, uint256(90))});
        Request memory req3 = Request({
            agentId: autarch.AGENT_LLM_INFERENCE(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("spec", "mock_diff", "mock_ui_html")
        });
        vm.prank(address(platform));
        autarch.handleResponse(3, r3, ResponseStatus.Success, req3); // reqId 3

        // 5. Verify outcome
        Autarch.Bounty memory b = autarch.getBounty(1);
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.Passed));
        assertEq(developer.balance, initialBal + 1 ether);
    }

    function test_AgentPipelineFailAndDispute() public {
        // 1. Create & Submit
        vm.prank(poster);
        autarch.createBounty{value: 1 ether}("Build a nav");

        vm.prank(developer);
        autarch.submitWork{value: 0.03 ether}(1, "pr", "preview");

        // 2. Simulate Callback 1 & 2
        Response[] memory r1 = new Response[](1);
        r1[0] = Response({success: true, data: bytes("diff")});
        Request memory req1 = Request({
            agentId: autarch.AGENT_JSON_API(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("pr")
        });
        vm.prank(address(platform));
        autarch.handleResponse(1, r1, ResponseStatus.Success, req1);

        Response[] memory r2 = new Response[](1);
        r2[0] = Response({success: true, data: bytes("ui")});
        Request memory req2 = Request({
            agentId: autarch.AGENT_LLM_PARSE(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("preview")
        });
        vm.prank(address(platform));
        autarch.handleResponse(2, r2, ResponseStatus.Success, req2);

        // 3. Simulate Callback 3: Failed (true success, but pass = false)
        Response[] memory r3 = new Response[](1);
        r3[0] = Response({success: true, data: abi.encode(false, uint256(95))}); // Agent ran successfully, but evaluated to fail
        Request memory req3 = Request({
            agentId: autarch.AGENT_LLM_INFERENCE(),
            requester: address(autarch),
            callback: autarch.handleResponse.selector,
            payload: abi.encode("spec", "diff", "ui")
        });
        vm.prank(address(platform));
        autarch.handleResponse(3, r3, ResponseStatus.Success, req3);

        Autarch.Bounty memory b = autarch.getBounty(1);
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.Failed));

        // 4. Developer Disputes
        vm.prank(developer);
        autarch.raiseDispute(1);

        b = autarch.getBounty(1);
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.Disputed));

        // 5. Arbiter approves dispute
        uint256 initialBal = developer.balance;
        vm.prank(arbiter);
        autarch.settleDispute(1, true);

        b = autarch.getBounty(1);
        assertEq(uint256(b.status), uint256(Autarch.BountyStatus.Settled));
        assertEq(developer.balance, initialBal + 1 ether);
    }
}
