/**
 * GitHub related type definitions
 * Similar structure to Azure types for consistency
 */

/**
 * Git provider type
 */
export type GitProvider = 'github' | 'azure' | 'unknown';

/**
 * GitHub Pull Request reviewer
 */
export interface GitHubReviewer {
  id: number;
  login: string;
  avatarUrl: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
}

/**
 * GitHub Pull Request status
 */
export type GitHubPullRequestStatus = 'open' | 'closed' | 'merged';

/**
 * GitHub Pull Request state (API value)
 */
export type GitHubPullRequestState = 'open' | 'closed';

/**
 * GitHub Pull Request merge state
 */
export type GitHubMergeableState =
  | 'mergeable'
  | 'conflicting'
  | 'unknown';

/**
 * GitHub Pull Request
 */
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: GitHubPullRequestState;
  merged: boolean;
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  createdBy: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  reviewers: GitHubReviewer[];
  labels: GitHubLabel[];
  url: string;
  mergeableState: GitHubMergeableState;
}

/**
 * GitHub Label
 */
export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

/**
 * GitHub Repository info
 */
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  private: boolean;
  url: string;
}

/**
 * GitHub User info
 */
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

/**
 * GitHub Check Run status
 */
export type GitHubCheckStatus = 'queued' | 'in_progress' | 'completed';

/**
 * GitHub Check Run conclusion
 */
export type GitHubCheckConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required'
  | 'skipped'
  | 'stale'
  | null;

/**
 * GitHub Check Run
 */
export interface GitHubCheckRun {
  id: number;
  name: string;
  status: GitHubCheckStatus;
  conclusion: GitHubCheckConclusion;
  url: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * GitHub Commit Status
 */
export type GitHubCommitStatusState = 'error' | 'failure' | 'pending' | 'success';

/**
 * GitHub Commit Status
 */
export interface GitHubCommitStatus {
  id: number;
  state: GitHubCommitStatusState;
  context: string;
  description: string | null;
  targetUrl: string | null;
}

/**
 * Combined status for a commit
 */
export interface GitHubCombinedStatus {
  state: GitHubCommitStatusState;
  statuses: GitHubCommitStatus[];
  checkRuns: GitHubCheckRun[];
}

/**
 * GitHub authentication result
 */
export interface GitHubAuthResult {
  success: boolean;
  user?: GitHubUser;
  error?: string;
}

/**
 * GitHub API error
 */
export interface GitHubApiError {
  status: number;
  message: string;
  documentation_url?: string;
}
