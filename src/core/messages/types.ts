/**
 * Message Protocol Types
 * Bidirectional communication between Extension and Webview
 *
 * Re-exports data types from src/types/ and defines message-specific types
 */

// =============================================================================
// Re-export Core Data Types
// =============================================================================

export type {
	BuildDetails,
	CodeCoverage,
	PipelineStatus,
	PolicyConfiguration,
	PolicyEvaluation,
	PolicyType,
	PullRequest,
	Reviewer,
	TestResult,
	WorkItem,
} from '../../types/azure';
export type {
	Author,
	Branch,
	Commit,
	ConflictInfo,
	FileStatus,
	Ref,
	RepositoryInfo,
	Stash,
	StatusResult,
} from '../../types/git';

import type {
	BuildDetails,
	CodeCoverage,
	PipelineStatus,
	PolicyConfiguration,
	PolicyEvaluation,
	PullRequest,
	TestResult,
	WorkItem,
} from '../../types/azure';
// Import for use in this file
import type {
	Branch,
	Commit,
	ConflictInfo,
	RepositoryInfo,
	Stash,
	StatusResult,
} from '../../types/git';

// =============================================================================
// Request Messages (Webview -> Extension)
// =============================================================================

// Repository
export interface RepoGetInfoRequest {
	type: 'repo/getInfo';
}

export interface RepoGetStatusRequest {
	type: 'repo/getStatus';
}

// Git Log/Commit
export interface GitGetLogRequest {
	type: 'git/getLog';
	payload: {
		limit: number;
		branch?: string;
	};
}

export interface GitCommitRequest {
	type: 'git/commit';
	payload: {
		message: string;
		files: string[];
		workItemId?: string;
	};
}

export interface GitAmendRequest {
	type: 'git/amend';
	payload: {
		message: string;
	};
}

// Branches
export interface GitGetBranchesRequest {
	type: 'git/getBranches';
}

export interface GitCheckoutRequest {
	type: 'git/checkout';
	payload: {
		branch: string;
	};
}

export interface GitCreateBranchRequest {
	type: 'git/createBranch';
	payload: {
		name: string;
		from?: string;
	};
}

export interface GitDeleteBranchRequest {
	type: 'git/deleteBranch';
	payload: {
		name: string;
		force?: boolean;
	};
}

// Merge/Rebase
export interface GitMergeRequest {
	type: 'git/merge';
	payload: {
		branch: string;
	};
}

export interface GitRebaseRequest {
	type: 'git/rebase';
	payload: {
		onto: string;
		commits?: string[];
	};
}

export interface GitCherryPickRequest {
	type: 'git/cherryPick';
	payload: {
		commit: string;
	};
}

// Staging
export interface GitStageRequest {
	type: 'git/stage';
	payload: {
		files: string[];
	};
}

export interface GitUnstageRequest {
	type: 'git/unstage';
	payload: {
		files: string[];
	};
}

// Stash
export interface GitStashListRequest {
	type: 'git/stashList';
}

export interface GitStashCreateRequest {
	type: 'git/stashCreate';
	payload?: {
		message?: string;
	};
}

export interface GitStashApplyRequest {
	type: 'git/stashApply';
	payload: {
		index: number;
	};
}

export interface GitStashDropRequest {
	type: 'git/stashDrop';
	payload: {
		index: number;
	};
}

// Azure Repos
export interface AzureGetPRsRequest {
	type: 'azure/getPRs';
	payload?: {
		branch?: string;
	};
}

export interface AzureCreatePRRequest {
	type: 'azure/createPR';
	payload: {
		source: string;
		target: string;
		title: string;
	};
}

export interface AzureGetWorkItemsRequest {
	type: 'azure/getWorkItems';
	payload: {
		ids: number[];
	};
}

export interface AzureLinkWorkItemRequest {
	type: 'azure/linkWorkItem';
	payload: {
		commitSha: string;
		workItemId: number;
	};
}

export interface AzureGetPipelineStatusRequest {
	type: 'azure/getPipelineStatus';
	payload: {
		branch: string;
	};
}

// Azure Branch Policies
export interface AzureGetPolicyConfigurationsRequest {
	type: 'azure/getPolicyConfigurations';
	payload: {
		branch: string;
	};
}

export interface AzureGetPolicyEvaluationsRequest {
	type: 'azure/getPolicyEvaluations';
	payload: {
		prId: number;
	};
}

// Azure Pipelines
export interface AzureGetBuildDetailsRequest {
	type: 'azure/getBuildDetails';
	payload: {
		commitSha: string;
	};
}

export interface AzureGetTestResultsRequest {
	type: 'azure/getTestResults';
	payload: {
		buildId: number;
	};
}

export interface AzureGetCodeCoverageRequest {
	type: 'azure/getCodeCoverage';
	payload: {
		buildId: number;
	};
}

export interface AzureTriggerRebuildRequest {
	type: 'azure/triggerRebuild';
	payload: {
		commitSha: string;
		definitionId: number;
	};
}

// GitHub
export interface GitHubGetPRsRequest {
	type: 'github/getPRs';
	payload?: {
		branch?: string;
	};
}

// Union of all Request Messages
export type RequestMessage =
	| RepoGetInfoRequest
	| RepoGetStatusRequest
	| GitGetLogRequest
	| GitCommitRequest
	| GitAmendRequest
	| GitGetBranchesRequest
	| GitCheckoutRequest
	| GitCreateBranchRequest
	| GitDeleteBranchRequest
	| GitMergeRequest
	| GitRebaseRequest
	| GitCherryPickRequest
	| GitStageRequest
	| GitUnstageRequest
	| GitStashListRequest
	| GitStashCreateRequest
	| GitStashApplyRequest
	| GitStashDropRequest
	| AzureGetPRsRequest
	| AzureCreatePRRequest
	| AzureGetWorkItemsRequest
	| AzureLinkWorkItemRequest
	| AzureGetPipelineStatusRequest
	| AzureGetPolicyConfigurationsRequest
	| AzureGetPolicyEvaluationsRequest
	| AzureGetBuildDetailsRequest
	| AzureGetTestResultsRequest
	| AzureGetCodeCoverageRequest
	| AzureTriggerRebuildRequest
	| GitHubGetPRsRequest;

// =============================================================================
// Response Messages (Extension -> Webview)
// =============================================================================

// Repository
export interface RepoInfoResponse {
	type: 'repo/info';
	payload: RepositoryInfo;
}

export interface RepoStatusResponse {
	type: 'repo/status';
	payload: StatusResult;
}

// Git
export interface GitLogResponse {
	type: 'git/log';
	payload: Commit[];
}

export interface GitBranchesResponse {
	type: 'git/branches';
	payload: Branch[];
}

export interface GitStashesResponse {
	type: 'git/stashes';
	payload: Stash[];
}

// Operation Success (no data)
export interface GitOperationSuccessResponse {
	type: 'git/success';
	payload: {
		operation: string;
		message?: string;
	};
}

// Azure
export interface AzurePRsResponse {
	type: 'azure/prs';
	payload: PullRequest[];
}

export interface AzureWorkItemsResponse {
	type: 'azure/workItems';
	payload: WorkItem[];
}

export interface AzurePipelineStatusResponse {
	type: 'azure/pipelineStatus';
	payload: PipelineStatus;
}

export interface AzurePolicyConfigurationsResponse {
	type: 'azure/policyConfigurations';
	payload: PolicyConfiguration[];
}

export interface AzurePolicyEvaluationsResponse {
	type: 'azure/policyEvaluations';
	payload: PolicyEvaluation[];
}

export interface AzureBuildDetailsResponse {
	type: 'azure/buildDetails';
	payload: BuildDetails;
}

export interface AzureTestResultsResponse {
	type: 'azure/testResults';
	payload: TestResult[];
}

export interface AzureCodeCoverageResponse {
	type: 'azure/codeCoverage';
	payload: CodeCoverage;
}

export interface AzureRebuildTriggeredResponse {
	type: 'azure/rebuildTriggered';
	payload: {
		buildId: number;
		url: string;
	};
}

export interface AzurePRCreatedResponse {
	type: 'azure/prCreated';
	payload: PullRequest;
}

export interface AzureWorkItemLinkedResponse {
	type: 'azure/workItemLinked';
	payload: {
		commitSha: string;
		workItemId: number;
	};
}

// GitHub
export interface GitHubPRsResponse {
	type: 'github/prs';
	payload: PullRequest[];
}

// Union of all Response Messages
export type ResponseMessage =
	| RepoInfoResponse
	| RepoStatusResponse
	| GitLogResponse
	| GitBranchesResponse
	| GitStashesResponse
	| GitOperationSuccessResponse
	| AzurePRsResponse
	| AzureWorkItemsResponse
	| AzurePipelineStatusResponse
	| AzurePolicyConfigurationsResponse
	| AzurePolicyEvaluationsResponse
	| AzureBuildDetailsResponse
	| AzureTestResultsResponse
	| AzureCodeCoverageResponse
	| AzureRebuildTriggeredResponse
	| AzurePRCreatedResponse
	| AzureWorkItemLinkedResponse
	| GitHubPRsResponse;

// =============================================================================
// Event Messages (Extension -> Webview, push notifications)
// =============================================================================

export interface GitChangedEvent {
	type: 'git/changed';
}

export interface GitConflictEvent {
	type: 'git/conflict';
	payload: ConflictInfo;
}

export type EventMessage = GitChangedEvent | GitConflictEvent;

// =============================================================================
// Error Message
// =============================================================================

export interface ErrorResponse {
	type: 'error';
	payload: {
		code: string;
		message: string;
		requestType?: string | undefined;
	};
}

// =============================================================================
// Combined Message Types
// =============================================================================

export type ExtensionMessage = ResponseMessage | EventMessage | ErrorResponse;
export type WebviewMessage = RequestMessage;
export type Message = ExtensionMessage | WebviewMessage;

// =============================================================================
// Type Guards
// =============================================================================

export function isRequestMessage(msg: Message): msg is RequestMessage {
	return (
		msg.type.startsWith('repo/get') ||
		msg.type.startsWith('git/get') ||
		msg.type.startsWith('git/commit') ||
		msg.type.startsWith('git/amend') ||
		msg.type.startsWith('git/checkout') ||
		msg.type.startsWith('git/create') ||
		msg.type.startsWith('git/delete') ||
		msg.type.startsWith('git/merge') ||
		msg.type.startsWith('git/rebase') ||
		msg.type.startsWith('git/cherryPick') ||
		msg.type.startsWith('git/stage') ||
		msg.type.startsWith('git/unstage') ||
		msg.type.startsWith('git/stash') ||
		msg.type.startsWith('azure/get') ||
		msg.type.startsWith('azure/create') ||
		msg.type.startsWith('azure/link') ||
		msg.type.startsWith('azure/trigger') ||
		msg.type.startsWith('github/get')
	);
}

export function isResponseMessage(msg: Message): msg is ResponseMessage {
	return (
		msg.type === 'repo/info' ||
		msg.type === 'repo/status' ||
		msg.type === 'git/log' ||
		msg.type === 'git/branches' ||
		msg.type === 'git/stashes' ||
		msg.type === 'git/success' ||
		msg.type === 'azure/prs' ||
		msg.type === 'azure/workItems' ||
		msg.type === 'azure/pipelineStatus' ||
		msg.type === 'azure/policyConfigurations' ||
		msg.type === 'azure/policyEvaluations' ||
		msg.type === 'azure/buildDetails' ||
		msg.type === 'azure/testResults' ||
		msg.type === 'azure/codeCoverage' ||
		msg.type === 'azure/rebuildTriggered' ||
		msg.type === 'azure/prCreated' ||
		msg.type === 'azure/workItemLinked' ||
		msg.type === 'github/prs'
	);
}

export function isEventMessage(msg: Message): msg is EventMessage {
	return msg.type === 'git/changed' || msg.type === 'git/conflict';
}

export function isErrorResponse(msg: Message): msg is ErrorResponse {
	return msg.type === 'error';
}

// =============================================================================
// Request-Response Type Mapping
// =============================================================================

export type RequestResponseMap = {
	'repo/getInfo': RepoInfoResponse;
	'repo/getStatus': RepoStatusResponse;
	'git/getLog': GitLogResponse;
	'git/commit': GitOperationSuccessResponse;
	'git/amend': GitOperationSuccessResponse;
	'git/getBranches': GitBranchesResponse;
	'git/checkout': GitOperationSuccessResponse;
	'git/createBranch': GitOperationSuccessResponse;
	'git/deleteBranch': GitOperationSuccessResponse;
	'git/merge': GitOperationSuccessResponse;
	'git/rebase': GitOperationSuccessResponse;
	'git/cherryPick': GitOperationSuccessResponse;
	'git/stage': GitOperationSuccessResponse;
	'git/unstage': GitOperationSuccessResponse;
	'git/stashList': GitStashesResponse;
	'git/stashCreate': GitOperationSuccessResponse;
	'git/stashApply': GitOperationSuccessResponse;
	'git/stashDrop': GitOperationSuccessResponse;
	'azure/getPRs': AzurePRsResponse;
	'azure/createPR': AzurePRCreatedResponse;
	'azure/getWorkItems': AzureWorkItemsResponse;
	'azure/linkWorkItem': AzureWorkItemLinkedResponse;
	'azure/getPipelineStatus': AzurePipelineStatusResponse;
	'azure/getPolicyConfigurations': AzurePolicyConfigurationsResponse;
	'azure/getPolicyEvaluations': AzurePolicyEvaluationsResponse;
	'azure/getBuildDetails': AzureBuildDetailsResponse;
	'azure/getTestResults': AzureTestResultsResponse;
	'azure/getCodeCoverage': AzureCodeCoverageResponse;
	'azure/triggerRebuild': AzureRebuildTriggeredResponse;
	'github/getPRs': GitHubPRsResponse;
};
