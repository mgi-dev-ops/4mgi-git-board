/**
 * Message Protocol Exports
 */

export type { ErrorCode, HandlerContext } from './protocol';
// Protocol
export {
	createErrorResponse,
	createResponse,
	ErrorCodes,
	MessageProtocol,
} from './protocol';
// Types
export type {
	// Core data types
	Author,
	AzureBuildDetailsResponse,
	AzureCodeCoverageResponse,
	AzureCreatePRRequest,
	AzureGetBuildDetailsRequest,
	AzureGetCodeCoverageRequest,
	AzureGetPipelineStatusRequest,
	AzureGetPolicyConfigurationsRequest,
	AzureGetPolicyEvaluationsRequest,
	AzureGetPRsRequest,
	AzureGetTestResultsRequest,
	AzureGetWorkItemsRequest,
	AzureLinkWorkItemRequest,
	AzurePipelineStatusResponse,
	AzurePolicyConfigurationsResponse,
	AzurePolicyEvaluationsResponse,
	AzurePRCreatedResponse,
	AzurePRsResponse,
	AzureRebuildTriggeredResponse,
	AzureTestResultsResponse,
	AzureTriggerRebuildRequest,
	AzureWorkItemLinkedResponse,
	AzureWorkItemsResponse,
	Branch,
	BuildDetails,
	CodeCoverage,
	Commit,
	ConflictInfo,
	// Error
	ErrorResponse,
	// Event messages
	EventMessage,
	// Combined types
	ExtensionMessage,
	FileStatus,
	GitAmendRequest,
	GitBranchesResponse,
	GitChangedEvent,
	GitCheckoutRequest,
	GitCherryPickRequest,
	GitCommitRequest,
	GitConflictEvent,
	GitCreateBranchRequest,
	GitDeleteBranchRequest,
	GitGetBranchesRequest,
	GitGetLogRequest,
	GitHubGetPRsRequest,
	GitHubPRsResponse,
	GitLogResponse,
	GitMergeRequest,
	GitOperationSuccessResponse,
	GitRebaseRequest,
	GitStageRequest,
	GitStashApplyRequest,
	GitStashCreateRequest,
	GitStashDropRequest,
	GitStashesResponse,
	GitStashListRequest,
	GitUnstageRequest,
	Message,
	PipelineStatus,
	PolicyConfiguration,
	PolicyEvaluation,
	PolicyType,
	PullRequest,
	Ref,
	RepoGetInfoRequest,
	RepoGetStatusRequest,
	RepoInfoResponse,
	RepoStatusResponse,
	RepositoryInfo,
	// Request messages
	RequestMessage,
	// Type mapping
	RequestResponseMap,
	// Response messages
	ResponseMessage,
	// Azure types
	Reviewer,
	Stash,
	StatusResult,
	TestResult,
	WebviewMessage,
	WorkItem,
} from './types';
// Type guards
export {
	isErrorResponse,
	isEventMessage,
	isRequestMessage,
	isResponseMessage,
} from './types';
