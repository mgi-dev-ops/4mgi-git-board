/**
 * Internal types for azure-devops-node-api responses and mappers
 * These types handle the conversion between Azure DevOps API output and our domain types
 */

import type {
  PullRequest,
  PullRequestStatus,
  Reviewer,
  WorkItem,
  PolicyConfiguration,
  PolicyType,
  PolicyEvaluation,
  PolicyEvaluationStatus,
  BuildDetails,
  BuildStatus,
  BuildResult,
  TestResult,
  TestOutcome,
  CodeCoverage,
  ModuleCoverage,
} from "../../types/azure";

// =============================================================================
// Azure DevOps API Response Types (internal use)
// =============================================================================

/**
 * Azure DevOps identity reference from API
 */
export interface AzureIdentityRef {
  id: string;
  displayName: string;
  uniqueName: string;
  imageUrl?: string;
}

/**
 * Azure DevOps Git repository reference
 */
export interface AzureGitRepositoryRef {
  id: string;
  name: string;
  url: string;
  project: {
    id: string;
    name: string;
  };
}

/**
 * Azure DevOps Pull Request reviewer from API
 */
export interface AzurePullRequestReviewer {
  id: string;
  displayName: string;
  uniqueName: string;
  vote: number; // -10, -5, 0, 5, 10
  isRequired: boolean;
  reviewerUrl?: string;
}

/**
 * Azure DevOps Pull Request status from API
 */
export type AzurePullRequestStatus = "active" | "completed" | "abandoned" | "all";

/**
 * Azure DevOps Pull Request from API
 */
export interface AzureGitPullRequest {
  pullRequestId: number;
  title: string;
  description?: string;
  status: AzurePullRequestStatus;
  sourceRefName: string; // refs/heads/branch-name
  targetRefName: string; // refs/heads/main
  createdBy: AzureIdentityRef;
  creationDate: string;
  closedDate?: string;
  reviewers: AzurePullRequestReviewer[];
  repository: AzureGitRepositoryRef;
  codeReviewId?: number;
  lastMergeCommit?: {
    commitId: string;
  };
  lastMergeSourceCommit?: {
    commitId: string;
  };
  lastMergeTargetCommit?: {
    commitId: string;
  };
  mergeStatus?: string;
  isDraft?: boolean;
  supportsIterations?: boolean;
  url?: string;
}

/**
 * Azure DevOps Work Item from API
 */
export interface AzureWorkItem {
  id: number;
  rev: number;
  fields: {
    "System.Title": string;
    "System.State": string;
    "System.WorkItemType": string;
    "System.AssignedTo"?: AzureIdentityRef;
    "System.Description"?: string;
    "System.CreatedDate"?: string;
    "System.ChangedDate"?: string;
  };
  url: string;
  _links?: {
    html?: { href: string };
    self?: { href: string };
  };
}

/**
 * Azure DevOps Work Item relation
 */
export interface AzureWorkItemRelation {
  rel: string;
  url: string;
  attributes: {
    name?: string;
    comment?: string;
  };
}

/**
 * Azure DevOps Policy Type reference
 */
export interface AzurePolicyTypeRef {
  id: string;
  displayName: string;
  url?: string;
}

/**
 * Azure DevOps Policy Configuration from API
 */
export interface AzurePolicyConfiguration {
  id: number;
  type: AzurePolicyTypeRef;
  isEnabled: boolean;
  isBlocking: boolean;
  settings: {
    scope?: Array<{
      refName?: string;
      matchKind?: string;
      repositoryId?: string;
    }>;
    minimumApproverCount?: number;
    creatorVoteCounts?: boolean;
    allowDownvotes?: boolean;
    buildDefinitionId?: number;
    displayName?: string;
    validDuration?: number;
    requiredReviewerIds?: string[];
    [key: string]: unknown;
  };
  url?: string;
  revision?: number;
  createdBy?: AzureIdentityRef;
  createdDate?: string;
}

/**
 * Azure DevOps Policy Evaluation status from API
 */
export type AzurePolicyEvaluationStatus =
  | "queued"
  | "running"
  | "approved"
  | "rejected"
  | "notApplicable"
  | "broken";

/**
 * Azure DevOps Policy Evaluation from API
 */
export interface AzurePolicyEvaluation {
  evaluationId: string;
  configurationId: number;
  status: AzurePolicyEvaluationStatus;
  context?: {
    displayName?: string;
  };
  configuration?: AzurePolicyConfiguration;
}

/**
 * Azure DevOps Build status from API
 */
export type AzureBuildStatus =
  | "none"
  | "inProgress"
  | "completed"
  | "cancelling"
  | "postponed"
  | "notStarted"
  | "all";

/**
 * Azure DevOps Build result from API
 */
export type AzureBuildResult =
  | "none"
  | "succeeded"
  | "partiallySucceeded"
  | "failed"
  | "canceled";

/**
 * Azure DevOps Build Definition reference
 */
export interface AzureBuildDefinitionRef {
  id: number;
  name: string;
  url?: string;
  path?: string;
  type?: string;
  queueStatus?: string;
  revision?: number;
  project?: {
    id: string;
    name: string;
  };
}

/**
 * Azure DevOps Build from API
 */
export interface AzureBuild {
  id: number;
  buildNumber: string;
  status: AzureBuildStatus;
  result?: AzureBuildResult;
  queueTime?: string;
  startTime?: string;
  finishTime?: string;
  sourceBranch: string;
  sourceVersion: string;
  definition: AzureBuildDefinitionRef;
  url?: string;
  _links?: {
    self?: { href: string };
    web?: { href: string };
    timeline?: { href: string };
    badge?: { href: string };
  };
  logs?: {
    id: number;
    type: string;
    url: string;
  };
  repository?: AzureGitRepositoryRef;
  requestedBy?: AzureIdentityRef;
  requestedFor?: AzureIdentityRef;
  priority?: string;
  reason?: string;
  triggerInfo?: Record<string, string>;
}

/**
 * Azure DevOps Test Run from API
 */
export interface AzureTestRun {
  id: number;
  name: string;
  url?: string;
  build?: { id: number };
  isAutomated?: boolean;
  state?: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  startedDate?: string;
  completedDate?: string;
}

/**
 * Azure DevOps Test Case Result from API
 */
export interface AzureTestCaseResult {
  id: number;
  testCaseTitle: string;
  automatedTestName?: string;
  outcome: string; // "Passed", "Failed", "NotExecuted", etc.
  durationInMs: number;
  errorMessage?: string;
  stackTrace?: string;
  state?: string;
  testRun?: { id: number };
}

/**
 * Azure DevOps Code Coverage Summary from API
 */
export interface AzureCodeCoverageSummary {
  coverageData?: Array<{
    coverageStats: Array<{
      label: string;
      position: number;
      total: number;
      covered: number;
    }>;
  }>;
}

/**
 * Azure DevOps Code Coverage Data from API
 */
export interface AzureCodeCoverageData {
  buildFlavor?: string;
  buildPlatform?: string;
  coverageStats?: Array<{
    label: string;
    total: number;
    covered: number;
  }>;
  modules?: Array<{
    name: string;
    statistics?: {
      linesCovered?: number;
      linesNotCovered?: number;
      linesPartiallyCovered?: number;
    };
    blockCount?: number;
    lineCount?: number;
  }>;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Azure DevOps API Error codes
 */
export type AzureErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

/**
 * Azure Service Error
 */
export class AzureServiceError extends Error {
  constructor(
    message: string,
    public readonly code: AzureErrorCode,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "AzureServiceError";
  }
}

// =============================================================================
// Policy Type ID Mapping
// =============================================================================

/**
 * Known Azure DevOps policy type IDs
 */
export const POLICY_TYPE_IDS: Record<string, PolicyType> = {
  "fa4e907d-c16b-4a4c-9dfa-4906e5d171dd": "minimumApprovers",
  "40e92b44-2fe1-4dd6-b3d8-74a9c21d0c6e": "workItemLinking",
  "0609b952-1397-4640-95ec-e00a01b2c241": "buildValidation",
  "fd2167ab-b0be-447a-8ec8-39368250530e": "requiredReviewers",
  "c6a1889d-b943-4856-b76f-9e46bb6b0df2": "commentRequirements",
};

// =============================================================================
// Mappers
// =============================================================================

/**
 * Extract branch name from ref string
 * refs/heads/main -> main
 */
export function extractBranchName(refName: string): string {
  const prefix = "refs/heads/";
  if (refName.startsWith(prefix)) {
    return refName.substring(prefix.length);
  }
  return refName;
}

/**
 * Convert branch name to ref string
 * main -> refs/heads/main
 */
export function toBranchRef(branchName: string): string {
  if (branchName.startsWith("refs/heads/")) {
    return branchName;
  }
  return `refs/heads/${branchName}`;
}

/**
 * Map reviewer vote number to typed vote
 */
export function mapReviewerVote(vote: number): -10 | -5 | 0 | 5 | 10 {
  if (vote <= -10) return -10;
  if (vote <= -5) return -5;
  if (vote >= 10) return 10;
  if (vote >= 5) return 5;
  return 0;
}

/**
 * Map Azure PR status to domain status
 */
export function mapPullRequestStatus(
  status: AzurePullRequestStatus
): PullRequestStatus {
  switch (status) {
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "abandoned":
      return "abandoned";
    default:
      return "active";
  }
}

/**
 * Map Azure PR reviewer to domain Reviewer
 */
export function mapReviewer(reviewer: AzurePullRequestReviewer): Reviewer {
  return {
    id: reviewer.id,
    displayName: reviewer.displayName,
    vote: mapReviewerVote(reviewer.vote),
    isRequired: reviewer.isRequired,
  };
}

/**
 * Extract work item IDs from PR (typically from linked work items API)
 */
export function extractWorkItemIdsFromPR(
  workItemRefs?: Array<{ id: string; url: string }>
): number[] {
  if (!workItemRefs) return [];
  return workItemRefs
    .map((ref) => parseInt(ref.id, 10))
    .filter((id) => !isNaN(id));
}

/**
 * Map Azure Pull Request to domain PullRequest
 */
export function mapPullRequest(
  pr: AzureGitPullRequest,
  workItemIds: number[] = []
): PullRequest {
  return {
    id: pr.pullRequestId,
    title: pr.title,
    status: mapPullRequestStatus(pr.status),
    sourceBranch: extractBranchName(pr.sourceRefName),
    targetBranch: extractBranchName(pr.targetRefName),
    createdBy: pr.createdBy.displayName,
    reviewers: pr.reviewers.map(mapReviewer),
    workItemIds,
  };
}

/**
 * Map Azure Work Item to domain WorkItem
 */
export function mapWorkItem(workItem: AzureWorkItem): WorkItem {
  const htmlUrl =
    workItem._links?.html?.href ||
    workItem.url.replace("_apis/wit/workItems", "_workitems/edit");

  return {
    id: workItem.id,
    title: workItem.fields["System.Title"],
    state: workItem.fields["System.State"],
    type: workItem.fields["System.WorkItemType"],
    assignedTo: workItem.fields["System.AssignedTo"]?.displayName,
    url: htmlUrl,
  };
}

/**
 * Map Azure policy type ID to domain PolicyType
 */
export function mapPolicyType(typeId: string): PolicyType {
  return POLICY_TYPE_IDS[typeId] || "minimumApprovers";
}

/**
 * Map Azure Policy Configuration to domain PolicyConfiguration
 */
export function mapPolicyConfiguration(
  config: AzurePolicyConfiguration
): PolicyConfiguration {
  return {
    id: config.id,
    type: mapPolicyType(config.type.id),
    isEnabled: config.isEnabled,
    isBlocking: config.isBlocking,
    settings: config.settings as Record<string, unknown>,
  };
}

/**
 * Map Azure Policy Evaluation status to domain status
 */
export function mapPolicyEvaluationStatus(
  status: AzurePolicyEvaluationStatus
): PolicyEvaluationStatus {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "notApplicable":
      return "notApplicable";
    case "broken":
      return "rejected";
    default:
      return "notApplicable";
  }
}

/**
 * Map Azure Policy Evaluation to domain PolicyEvaluation
 */
export function mapPolicyEvaluation(
  evaluation: AzurePolicyEvaluation
): PolicyEvaluation {
  return {
    configurationId: evaluation.configurationId,
    status: mapPolicyEvaluationStatus(evaluation.status),
    context: evaluation.context?.displayName || "",
  };
}

/**
 * Map Azure Build status to domain BuildStatus
 */
export function mapBuildStatus(status: AzureBuildStatus): BuildStatus {
  switch (status) {
    case "none":
    case "notStarted":
      return "notStarted";
    case "inProgress":
      return "inProgress";
    case "completed":
      return "completed";
    case "cancelling":
      return "cancelling";
    case "postponed":
      return "postponed";
    default:
      return "notStarted";
  }
}

/**
 * Map Azure Build result to domain BuildResult
 */
export function mapBuildResult(result?: AzureBuildResult): BuildResult {
  switch (result) {
    case "succeeded":
      return "succeeded";
    case "partiallySucceeded":
      return "partiallySucceeded";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "none":
    default:
      return "none";
  }
}

/**
 * Map Azure Build to domain BuildDetails
 */
export function mapBuildDetails(build: AzureBuild): BuildDetails {
  const webUrl = build._links?.web?.href || build.url || "";
  const logsUrl = build._links?.timeline?.href || build.logs?.url || "";

  return {
    id: build.id,
    buildNumber: build.buildNumber,
    status: mapBuildStatus(build.status),
    result: build.result ? mapBuildResult(build.result) : undefined,
    startTime: build.startTime,
    finishTime: build.finishTime,
    sourceBranch: extractBranchName(build.sourceBranch),
    sourceCommit: build.sourceVersion,
    definition: {
      id: build.definition.id,
      name: build.definition.name,
    },
    url: webUrl,
    logsUrl,
  };
}

/**
 * Map Azure Test outcome string to domain TestOutcome
 */
export function mapTestOutcome(outcome: string): TestOutcome {
  const normalized = outcome.toLowerCase();
  switch (normalized) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "skipped":
    case "inconclusive":
      return "Skipped";
    case "notexecuted":
    default:
      return "NotExecuted";
  }
}

/**
 * Map Azure Test Case Result to domain TestResult
 */
export function mapTestResult(result: AzureTestCaseResult): TestResult {
  return {
    testName: result.automatedTestName || result.testCaseTitle,
    outcome: mapTestOutcome(result.outcome),
    duration: result.durationInMs,
    errorMessage: result.errorMessage,
  };
}

/**
 * Calculate code coverage from Azure coverage data
 */
export function mapCodeCoverage(data: AzureCodeCoverageData[]): CodeCoverage {
  let totalLines = 0;
  let coveredLines = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  const modules: ModuleCoverage[] = [];

  for (const coverage of data) {
    if (coverage.coverageStats) {
      for (const stat of coverage.coverageStats) {
        if (stat.label === "Lines" || stat.label === "Line") {
          totalLines += stat.total;
          coveredLines += stat.covered;
        }
        if (stat.label === "Branches" || stat.label === "Branch") {
          totalBranches += stat.total;
          coveredBranches += stat.covered;
        }
      }
    }

    if (coverage.modules) {
      for (const mod of coverage.modules) {
        const stats = mod.statistics;
        if (stats) {
          const modTotal =
            (stats.linesCovered || 0) +
            (stats.linesNotCovered || 0) +
            (stats.linesPartiallyCovered || 0);
          const modCovered = stats.linesCovered || 0;
          modules.push({
            name: mod.name,
            lineCoverage: modTotal > 0 ? (modCovered / modTotal) * 100 : 0,
          });
        }
      }
    }
  }

  return {
    lineCoverage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
    branchCoverage:
      totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
    modules,
  };
}

/**
 * Map HTTP status code to AzureErrorCode
 */
export function mapHttpStatusToErrorCode(statusCode: number): AzureErrorCode {
  switch (statusCode) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    case 400:
      return "BAD_REQUEST";
    default:
      if (statusCode >= 500) {
        return "SERVER_ERROR";
      }
      return "UNKNOWN";
  }
}
