/**
 * Type definitions for 4MGI Git Board extension
 * Re-exports all types from individual modules
 */

// Git types
export type {
  // Core entities
  Author,
  Ref,
  Commit,
  Branch,
  Stash,
  // Status types
  FileStatusType,
  FileStatus,
  StatusResult,
  // Repository info
  RepositoryInfo,
  RemoteInfo,
  // Operation results
  MergeResult,
  DiffResult,
  DiffFile,
  // Options
  LogOptions,
  CommitOptions,
  MergeOptions,
  RebaseOptions,
  // Repository states
  RepositoryState,
  ConflictInfo,
} from './git';

// Azure DevOps types
export type {
  Reviewer,
  PullRequestStatus,
  PullRequest,
  WorkItem,
  PipelineStatusValue,
  PipelineStatus,
  PolicyType,
  PolicyConfiguration,
  PolicyEvaluationStatus,
  PolicyEvaluation,
  BuildStatus,
  BuildResult,
  BuildDefinition,
  BuildDetails,
  TestOutcome,
  TestResult,
  ModuleCoverage,
  CodeCoverage,
} from './azure';

// GitHub types
export type {
  GitProvider,
  GitHubReviewer,
  GitHubPullRequestStatus,
  GitHubPullRequestState,
  GitHubMergeableState,
  GitHubPullRequest,
  GitHubLabel,
  GitHubRepository,
  GitHubUser,
  GitHubCheckStatus,
  GitHubCheckConclusion,
  GitHubCheckRun,
  GitHubCommitStatusState,
  GitHubCommitStatus,
  GitHubCombinedStatus,
  GitHubAuthResult,
  GitHubApiError,
} from './github';

// Message protocol types
export type {
  // Request messages
  RepoGetInfoRequest,
  RepoGetStatusRequest,
  GitGetLogRequest,
  GitCommitRequest,
  GitAmendRequest,
  GitGetBranchesRequest,
  GitCheckoutRequest,
  GitCreateBranchRequest,
  GitDeleteBranchRequest,
  GitMergeRequest,
  GitRebaseRequest,
  GitCherryPickRequest,
  GitStageRequest,
  GitUnstageRequest,
  GitStashListRequest,
  GitStashCreateRequest,
  GitStashApplyRequest,
  GitStashDropRequest,
  AzureGetPRsRequest,
  AzureCreatePRRequest,
  AzureGetWorkItemsRequest,
  AzureLinkWorkItemRequest,
  AzureGetPipelineStatusRequest,
  AzureGetPolicyConfigurationsRequest,
  AzureGetPolicyEvaluationsRequest,
  AzureGetBuildDetailsRequest,
  AzureGetTestResultsRequest,
  AzureGetCodeCoverageRequest,
  AzureTriggerRebuildRequest,
  // GitHub requests
  GitHubGetPRsRequest,
  GitHubGetPRRequest,
  GitHubAuthenticateRequest,
  GitHubSignOutRequest,
  GitHubGetAuthStatusRequest,
  GitHubGetCommitStatusRequest,
  GitHubCreatePRRequest,
  WebviewToExtensionMessage,
  // Response messages
  RepoInfoResponse,
  RepoStatusResponse,
  GitLogResponse,
  GitBranchesResponse,
  GitStashesResponse,
  AzurePRsResponse,
  AzureWorkItemsResponse,
  AzurePipelineStatusResponse,
  AzurePolicyConfigurationsResponse,
  AzurePolicyEvaluationsResponse,
  AzureBuildDetailsResponse,
  AzureTestResultsResponse,
  AzureCodeCoverageResponse,
  AzureRebuildTriggeredResponse,
  // GitHub responses
  GitHubPRsResponse,
  GitHubPRResponse,
  GitHubAuthStatusResponse,
  GitHubAuthResultResponse,
  GitHubCommitStatusResponse,
  GitHubPRCreatedResponse,
  // Provider
  ProviderDetectedResponse,
  // Events
  GitChangedEvent,
  GitConflictEvent,
  ErrorResponse,
  ExtensionToWebviewMessage,
  Message,
} from './messages';

// Message type guards
export {
  isRequestMessage,
  isResponseMessage,
  isErrorMessage,
} from './messages';

// Configuration types
export type {
  GraphOrientation,
  DefaultProvider,
  ExtensionConfig,
  ConfigKey,
  PartialConfig,
} from './config';

export { DEFAULT_CONFIG } from './config';
