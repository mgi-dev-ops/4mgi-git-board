/**
 * Message Protocol Exports
 */

// Types
export type {
  // Core data types
  Author,
  Ref,
  Commit,
  Branch,
  Stash,
  FileStatus,
  StatusResult,
  RepositoryInfo,
  ConflictInfo,

  // Azure types
  Reviewer,
  PullRequest,
  WorkItem,
  PipelineStatus,
  PolicyType,
  PolicyConfiguration,
  PolicyEvaluation,
  BuildDetails,
  TestResult,
  CodeCoverage,

  // Request messages
  RequestMessage,
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
  GitHubGetPRsRequest,

  // Response messages
  ResponseMessage,
  RepoInfoResponse,
  RepoStatusResponse,
  GitLogResponse,
  GitBranchesResponse,
  GitStashesResponse,
  GitOperationSuccessResponse,
  AzurePRsResponse,
  AzureWorkItemsResponse,
  AzurePipelineStatusResponse,
  AzurePolicyConfigurationsResponse,
  AzurePolicyEvaluationsResponse,
  AzureBuildDetailsResponse,
  AzureTestResultsResponse,
  AzureCodeCoverageResponse,
  AzureRebuildTriggeredResponse,
  AzurePRCreatedResponse,
  AzureWorkItemLinkedResponse,
  GitHubPRsResponse,

  // Event messages
  EventMessage,
  GitChangedEvent,
  GitConflictEvent,

  // Error
  ErrorResponse,

  // Combined types
  ExtensionMessage,
  WebviewMessage,
  Message,

  // Type mapping
  RequestResponseMap,
} from './types';

// Type guards
export {
  isRequestMessage,
  isResponseMessage,
  isEventMessage,
  isErrorResponse,
} from './types';

// Protocol
export {
  MessageProtocol,
  createResponse,
  createErrorResponse,
  ErrorCodes,
} from './protocol';

export type { HandlerContext, ErrorCode } from './protocol';
