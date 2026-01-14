/**
 * Azure DevOps related type definitions
 * Based on 06-API-REFERENCE.md
 */

/**
 * Pull Request reviewer
 */
export interface Reviewer {
  id: string;
  displayName: string;
  vote: -10 | -5 | 0 | 5 | 10; // Rejected | Waiting | No vote | Approved with suggestions | Approved
  isRequired: boolean;
}

/**
 * Pull Request status
 */
export type PullRequestStatus = 'active' | 'completed' | 'abandoned';

/**
 * Azure DevOps Pull Request
 */
export interface PullRequest {
  id: number;
  title: string;
  status: PullRequestStatus;
  sourceBranch: string;
  targetBranch: string;
  createdBy: string;
  reviewers: Reviewer[];
  workItemIds: number[];
}

/**
 * Azure DevOps Work Item
 */
export interface WorkItem {
  id: number;
  title: string;
  state: string;
  type: string;
  assignedTo?: string;
  url: string;
}

/**
 * Pipeline execution status
 */
export type PipelineStatusValue = 'running' | 'succeeded' | 'failed' | 'canceled';

/**
 * Azure Pipeline Status
 */
export interface PipelineStatus {
  name: string;
  status: PipelineStatusValue;
  url: string;
}

/**
 * Branch policy types
 */
export type PolicyType =
  | 'minimumApprovers'
  | 'workItemLinking'
  | 'buildValidation'
  | 'requiredReviewers'
  | 'commentRequirements';

/**
 * Branch policy configuration
 */
export interface PolicyConfiguration {
  id: number;
  type: PolicyType;
  isEnabled: boolean;
  isBlocking: boolean;
  settings: Record<string, unknown>;
}

/**
 * Policy evaluation status
 */
export type PolicyEvaluationStatus =
  | 'queued'
  | 'running'
  | 'approved'
  | 'rejected'
  | 'notApplicable';

/**
 * Policy evaluation result for a PR
 */
export interface PolicyEvaluation {
  configurationId: number;
  status: PolicyEvaluationStatus;
  context: string;
}

/**
 * Build status
 */
export type BuildStatus =
  | 'notStarted'
  | 'inProgress'
  | 'completed'
  | 'cancelling'
  | 'postponed';

/**
 * Build result
 */
export type BuildResult =
  | 'succeeded'
  | 'partiallySucceeded'
  | 'failed'
  | 'canceled'
  | 'none';

/**
 * Build definition reference
 */
export interface BuildDefinition {
  id: number;
  name: string;
}

/**
 * Azure Pipeline Build Details
 */
export interface BuildDetails {
  id: number;
  buildNumber: string;
  status: BuildStatus;
  result?: BuildResult;
  startTime?: string;
  finishTime?: string;
  sourceBranch: string;
  sourceCommit: string;
  definition: BuildDefinition;
  url: string;
  logsUrl: string;
}

/**
 * Test execution outcome
 */
export type TestOutcome = 'Passed' | 'Failed' | 'Skipped' | 'NotExecuted';

/**
 * Test result from Azure Pipelines
 */
export interface TestResult {
  testName: string;
  outcome: TestOutcome;
  duration: number;
  errorMessage?: string;
}

/**
 * Module coverage information
 */
export interface ModuleCoverage {
  name: string;
  lineCoverage: number;
}

/**
 * Code coverage report from Azure Pipelines
 */
export interface CodeCoverage {
  lineCoverage: number; // percentage 0-100
  branchCoverage: number; // percentage 0-100
  modules: ModuleCoverage[];
}
