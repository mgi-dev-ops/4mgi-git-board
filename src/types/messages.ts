/**
 * Message protocol type definitions for Webview <-> Extension communication
 * Based on 06-API-REFERENCE.md
 */

import type {
	BuildDetails,
	CodeCoverage,
	PipelineStatus,
	PolicyConfiguration,
	PolicyEvaluation,
	PullRequest,
	TestResult,
	WorkItem,
} from './azure';
import type {
	Branch,
	Commit,
	ConflictInfo,
	RepositoryInfo,
	Stash,
	StatusResult,
} from './git';
import type {
	GitHubCombinedStatus,
	GitHubPullRequest,
	GitHubUser,
	GitProvider,
} from './github';

// ============================================================================
// Request Messages (Webview -> Extension)
// ============================================================================

// --- Repository ---
export interface RepoGetInfoRequest {
	type: 'repo/getInfo';
}

export interface RepoGetStatusRequest {
	type: 'repo/getStatus';
}

// --- Commits ---
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

// --- Branches ---
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

// --- Merge/Rebase ---
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

// --- Staging ---
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

// --- Stash ---
export interface GitStashListRequest {
	type: 'git/stashList';
}

export interface GitStashCreateRequest {
	type: 'git/stashCreate';
	payload: {
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

// --- Azure Repos ---
export interface AzureGetPRsRequest {
	type: 'azure/getPRs';
	payload: {
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

// --- Azure Branch Policies ---
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

// --- Azure Pipelines ---
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

// --- GitHub ---
export interface GitHubGetPRsRequest {
	type: 'github/getPRs';
	payload: {
		branch?: string;
	};
}

export interface GitHubGetPRRequest {
	type: 'github/getPR';
	payload: {
		pullNumber: number;
	};
}

export interface GitHubAuthenticateRequest {
	type: 'github/authenticate';
	payload: {
		pat: string;
	};
}

export interface GitHubSignOutRequest {
	type: 'github/signOut';
}

export interface GitHubGetAuthStatusRequest {
	type: 'github/getAuthStatus';
}

export interface GitHubGetCommitStatusRequest {
	type: 'github/getCommitStatus';
	payload: {
		ref: string;
	};
}

export interface GitHubCreatePRRequest {
	type: 'github/createPR';
	payload: {
		title: string;
		head: string;
		base: string;
		body?: string;
		draft?: boolean;
	};
}

/**
 * Union type of all request messages from Webview to Extension
 */
export type WebviewToExtensionMessage =
	// Repository
	| RepoGetInfoRequest
	| RepoGetStatusRequest
	// Commits
	| GitGetLogRequest
	| GitCommitRequest
	| GitAmendRequest
	// Branches
	| GitGetBranchesRequest
	| GitCheckoutRequest
	| GitCreateBranchRequest
	| GitDeleteBranchRequest
	// Merge/Rebase
	| GitMergeRequest
	| GitRebaseRequest
	| GitCherryPickRequest
	// Staging
	| GitStageRequest
	| GitUnstageRequest
	// Stash
	| GitStashListRequest
	| GitStashCreateRequest
	| GitStashApplyRequest
	| GitStashDropRequest
	// Azure Repos
	| AzureGetPRsRequest
	| AzureCreatePRRequest
	| AzureGetWorkItemsRequest
	| AzureLinkWorkItemRequest
	| AzureGetPipelineStatusRequest
	// Azure Branch Policies
	| AzureGetPolicyConfigurationsRequest
	| AzureGetPolicyEvaluationsRequest
	// Azure Pipelines
	| AzureGetBuildDetailsRequest
	| AzureGetTestResultsRequest
	| AzureGetCodeCoverageRequest
	| AzureTriggerRebuildRequest
	// GitHub
	| GitHubGetPRsRequest
	| GitHubGetPRRequest
	| GitHubAuthenticateRequest
	| GitHubSignOutRequest
	| GitHubGetAuthStatusRequest
	| GitHubGetCommitStatusRequest
	| GitHubCreatePRRequest;

// ============================================================================
// Response Messages (Extension -> Webview)
// ============================================================================

// --- Repository ---
export interface RepoInfoResponse {
	type: 'repo/info';
	payload: RepositoryInfo;
}

export interface RepoStatusResponse {
	type: 'repo/status';
	payload: StatusResult;
}

// --- Git ---
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

// --- Azure ---
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

// --- Events ---
export interface GitChangedEvent {
	type: 'git/changed';
}

export interface GitConflictEvent {
	type: 'git/conflict';
	payload: ConflictInfo;
}

// --- GitHub Responses ---
export interface GitHubPRsResponse {
	type: 'github/prs';
	payload: GitHubPullRequest[];
}

export interface GitHubPRResponse {
	type: 'github/pr';
	payload: GitHubPullRequest;
}

export interface GitHubAuthStatusResponse {
	type: 'github/authStatus';
	payload: {
		authenticated: boolean;
		user?: GitHubUser;
	};
}

export interface GitHubAuthResultResponse {
	type: 'github/authResult';
	payload: {
		success: boolean;
		user?: GitHubUser;
		error?: string;
	};
}

export interface GitHubCommitStatusResponse {
	type: 'github/commitStatus';
	payload: GitHubCombinedStatus;
}

export interface GitHubPRCreatedResponse {
	type: 'github/prCreated';
	payload: GitHubPullRequest;
}

// --- Provider Detection ---
export interface ProviderDetectedResponse {
	type: 'provider/detected';
	payload: {
		provider: GitProvider;
		owner?: string;
		repo?: string;
		organization?: string;
		project?: string;
	};
}

// --- Errors ---
export interface ErrorResponse {
	type: 'error';
	payload: {
		code: string;
		message: string;
	};
}

/**
 * Union type of all response messages from Extension to Webview
 */
export type ExtensionToWebviewMessage =
	// Repository
	| RepoInfoResponse
	| RepoStatusResponse
	// Git
	| GitLogResponse
	| GitBranchesResponse
	| GitStashesResponse
	// Azure
	| AzurePRsResponse
	| AzureWorkItemsResponse
	| AzurePipelineStatusResponse
	| AzurePolicyConfigurationsResponse
	| AzurePolicyEvaluationsResponse
	| AzureBuildDetailsResponse
	| AzureTestResultsResponse
	| AzureCodeCoverageResponse
	| AzureRebuildTriggeredResponse
	// Events
	| GitChangedEvent
	| GitConflictEvent
	// GitHub
	| GitHubPRsResponse
	| GitHubPRResponse
	| GitHubAuthStatusResponse
	| GitHubAuthResultResponse
	| GitHubCommitStatusResponse
	| GitHubPRCreatedResponse
	// Provider
	| ProviderDetectedResponse
	// Errors
	| ErrorResponse;

/**
 * All possible message types
 */
export type Message = WebviewToExtensionMessage | ExtensionToWebviewMessage;

/**
 * Type guard to check if message is a request
 */
export function isRequestMessage(
	message: Message,
): message is WebviewToExtensionMessage {
	const requestTypes = [
		'repo/getInfo',
		'repo/getStatus',
		'git/getLog',
		'git/commit',
		'git/amend',
		'git/getBranches',
		'git/checkout',
		'git/createBranch',
		'git/deleteBranch',
		'git/merge',
		'git/rebase',
		'git/cherryPick',
		'git/stage',
		'git/unstage',
		'git/stashList',
		'git/stashCreate',
		'git/stashApply',
		'git/stashDrop',
		'azure/getPRs',
		'azure/createPR',
		'azure/getWorkItems',
		'azure/linkWorkItem',
		'azure/getPipelineStatus',
		'azure/getPolicyConfigurations',
		'azure/getPolicyEvaluations',
		'azure/getBuildDetails',
		'azure/getTestResults',
		'azure/getCodeCoverage',
		'azure/triggerRebuild',
		'github/getPRs',
		'github/getPR',
		'github/authenticate',
		'github/signOut',
		'github/getAuthStatus',
		'github/getCommitStatus',
		'github/createPR',
	];
	return requestTypes.includes(message.type);
}

/**
 * Type guard to check if message is a response
 */
export function isResponseMessage(
	message: Message,
): message is ExtensionToWebviewMessage {
	return !isRequestMessage(message);
}

/**
 * Type guard to check if message is an error
 */
export function isErrorMessage(message: Message): message is ErrorResponse {
	return message.type === 'error';
}
