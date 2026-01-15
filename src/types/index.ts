/**
 * Type definitions for 4MGI Git Board extension
 * Re-exports all types from individual modules
 */

// Azure DevOps types
export type {
	BuildDefinition,
	BuildDetails,
	BuildResult,
	BuildStatus,
	CodeCoverage,
	ModuleCoverage,
	PipelineStatus,
	PipelineStatusValue,
	PolicyConfiguration,
	PolicyEvaluation,
	PolicyEvaluationStatus,
	PolicyType,
	PullRequest,
	PullRequestStatus,
	Reviewer,
	TestOutcome,
	TestResult,
	WorkItem,
} from './azure';
// Configuration types
export type {
	ConfigKey,
	DefaultProvider,
	ExtensionConfig,
	GraphOrientation,
	PartialConfig,
} from './config';
export { DEFAULT_CONFIG } from './config';
// Git types
export type {
	// Core entities
	Author,
	Branch,
	Commit,
	CommitOptions,
	ConflictInfo,
	DiffFile,
	DiffResult,
	FileStatus,
	// Status types
	FileStatusType,
	// Options
	LogOptions,
	MergeOptions,
	// Operation results
	MergeResult,
	RebaseOptions,
	Ref,
	RemoteInfo,
	// Repository info
	RepositoryInfo,
	// Repository states
	RepositoryState,
	Stash,
	StatusResult,
} from './git';
// GitHub types
export type {
	GitHubApiError,
	GitHubAuthResult,
	GitHubCheckConclusion,
	GitHubCheckRun,
	GitHubCheckStatus,
	GitHubCombinedStatus,
	GitHubCommitStatus,
	GitHubCommitStatusState,
	GitHubLabel,
	GitHubMergeableState,
	GitHubPullRequest,
	GitHubPullRequestState,
	GitHubPullRequestStatus,
	GitHubRepository,
	GitHubReviewer,
	GitHubUser,
	GitProvider,
} from './github';
// Message protocol types
export type {
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
	AzurePRsResponse,
	AzureRebuildTriggeredResponse,
	AzureTestResultsResponse,
	AzureTriggerRebuildRequest,
	AzureWorkItemsResponse,
	ErrorResponse,
	ExtensionToWebviewMessage,
	GitAmendRequest,
	GitBranchesResponse,
	// Events
	GitChangedEvent,
	GitCheckoutRequest,
	GitCherryPickRequest,
	GitCommitRequest,
	GitConflictEvent,
	GitCreateBranchRequest,
	GitDeleteBranchRequest,
	GitGetBranchesRequest,
	GitGetLogRequest,
	GitHubAuthenticateRequest,
	GitHubAuthResultResponse,
	GitHubAuthStatusResponse,
	GitHubCommitStatusResponse,
	GitHubCreatePRRequest,
	GitHubGetAuthStatusRequest,
	GitHubGetCommitStatusRequest,
	GitHubGetPRRequest,
	// GitHub requests
	GitHubGetPRsRequest,
	GitHubPRCreatedResponse,
	GitHubPRResponse,
	// GitHub responses
	GitHubPRsResponse,
	GitHubSignOutRequest,
	GitLogResponse,
	GitMergeRequest,
	GitRebaseRequest,
	GitStageRequest,
	GitStashApplyRequest,
	GitStashCreateRequest,
	GitStashDropRequest,
	GitStashesResponse,
	GitStashListRequest,
	GitUnstageRequest,
	Message,
	// Provider
	ProviderDetectedResponse,
	// Request messages
	RepoGetInfoRequest,
	RepoGetStatusRequest,
	// Response messages
	RepoInfoResponse,
	RepoStatusResponse,
	WebviewToExtensionMessage,
} from './messages';
// Message type guards
export {
	isErrorMessage,
	isRequestMessage,
	isResponseMessage,
} from './messages';
