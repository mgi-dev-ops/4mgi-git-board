/**
 * Internal types for Octokit responses and mappers
 * These types handle the conversion between Octokit output and our domain types
 */

import type { Endpoints } from '@octokit/types';
import type {
  GitHubPullRequest,
  GitHubReviewer,
  GitHubLabel,
  GitHubRepository,
  GitHubUser,
  GitHubCheckRun,
  GitHubCommitStatus,
  GitHubCombinedStatus,
  GitHubMergeableState,
} from '../../types/github';

// =============================================================================
// Octokit Response Types (internal use)
// =============================================================================

/**
 * Octokit PR list response type
 */
export type OctokitPullRequestListResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'][0];

/**
 * Octokit PR get response type
 */
export type OctokitPullRequestResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}']['response']['data'];

/**
 * Octokit PR review response type
 */
export type OctokitPullRequestReviewResponse =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response']['data'][0];

/**
 * Octokit Repository response type
 */
export type OctokitRepositoryResponse =
  Endpoints['GET /repos/{owner}/{repo}']['response']['data'];

/**
 * Octokit User response type
 */
export type OctokitUserResponse =
  Endpoints['GET /user']['response']['data'];

/**
 * Octokit Check Runs response type
 */
export type OctokitCheckRunsResponse =
  Endpoints['GET /repos/{owner}/{repo}/commits/{ref}/check-runs']['response']['data'];

/**
 * Octokit Combined Status response type
 */
export type OctokitCombinedStatusResponse =
  Endpoints['GET /repos/{owner}/{repo}/commits/{ref}/status']['response']['data'];

// =============================================================================
// Mappers
// =============================================================================

/**
 * Map Octokit PR to domain GitHubPullRequest
 */
export function mapPullRequest(
  pr: OctokitPullRequestListResponse | OctokitPullRequestResponse,
  reviews: OctokitPullRequestReviewResponse[] = []
): GitHubPullRequest {
  // Get unique reviewers with their latest state
  const reviewerMap = new Map<string, GitHubReviewer>();
  for (const review of reviews) {
    if (review.user) {
      reviewerMap.set(review.user.login, {
        id: review.user.id,
        login: review.user.login,
        avatarUrl: review.user.avatar_url,
        state: mapReviewState(review.state),
      });
    }
  }

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    body: pr.body,
    state: pr.state as 'open' | 'closed',
    merged: 'merged' in pr ? pr.merged : false,
    draft: pr.draft ?? false,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    createdBy: {
      login: pr.user?.login ?? 'unknown',
      avatarUrl: pr.user?.avatar_url ?? '',
    },
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: 'merged_at' in pr ? pr.merged_at : null,
    closedAt: 'closed_at' in pr ? pr.closed_at : null,
    reviewers: Array.from(reviewerMap.values()),
    labels: mapLabels(pr.labels),
    url: pr.html_url,
    mergeableState: mapMergeableState(pr),
  };
}

/**
 * Map review state string to typed state
 */
function mapReviewState(state: string): GitHubReviewer['state'] {
  switch (state.toUpperCase()) {
    case 'APPROVED':
      return 'APPROVED';
    case 'CHANGES_REQUESTED':
      return 'CHANGES_REQUESTED';
    case 'COMMENTED':
      return 'COMMENTED';
    case 'DISMISSED':
      return 'DISMISSED';
    default:
      return 'PENDING';
  }
}

/**
 * Map mergeable state from PR
 */
function mapMergeableState(
  pr: OctokitPullRequestListResponse | OctokitPullRequestResponse
): GitHubMergeableState {
  if ('mergeable' in pr) {
    if (pr.mergeable === true) {
      return 'mergeable';
    } else if (pr.mergeable === false) {
      return 'conflicting';
    }
  }
  return 'unknown';
}

/**
 * Map labels to domain type
 */
function mapLabels(
  labels: OctokitPullRequestListResponse['labels']
): GitHubLabel[] {
  return labels.map((label) => {
    if (typeof label === 'string') {
      return {
        id: 0,
        name: label,
        color: '000000',
        description: null,
      };
    }
    return {
      id: label.id ?? 0,
      name: label.name ?? '',
      color: label.color ?? '000000',
      description: label.description ?? null,
    };
  });
}

/**
 * Map Octokit Repository to domain GitHubRepository
 */
export function mapRepository(repo: OctokitRepositoryResponse): GitHubRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    defaultBranch: repo.default_branch,
    private: repo.private,
    url: repo.html_url,
  };
}

/**
 * Map Octokit User to domain GitHubUser
 */
export function mapUser(user: OctokitUserResponse): GitHubUser {
  return {
    id: user.id,
    login: user.login,
    name: user.name ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatar_url,
  };
}

/**
 * Map Octokit Check Runs to domain GitHubCheckRun array
 */
export function mapCheckRuns(
  response: OctokitCheckRunsResponse
): GitHubCheckRun[] {
  return response.check_runs.map((run) => ({
    id: run.id,
    name: run.name,
    status: run.status as GitHubCheckRun['status'],
    conclusion: run.conclusion as GitHubCheckRun['conclusion'],
    url: run.html_url ?? '',
    startedAt: run.started_at ?? null,
    completedAt: run.completed_at ?? null,
  }));
}

/**
 * Map Octokit Combined Status to domain type
 */
export function mapCombinedStatus(
  statusResponse: OctokitCombinedStatusResponse,
  checkRuns: GitHubCheckRun[]
): GitHubCombinedStatus {
  const statuses: GitHubCommitStatus[] = statusResponse.statuses.map((s) => ({
    id: s.id,
    state: s.state as GitHubCommitStatus['state'],
    context: s.context,
    description: s.description,
    targetUrl: s.target_url,
  }));

  return {
    state: statusResponse.state as GitHubCombinedStatus['state'],
    statuses,
    checkRuns,
  };
}

/**
 * Parse GitHub remote URL to extract owner and repo
 * Supports:
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo
 * - git@github.com:owner/repo.git
 * - git@github.com:owner/repo
 * - ssh://git@github.com/owner/repo.git
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // HTTPS format
  const httpsMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH format (git@github.com:owner/repo.git)
  const sshMatch = url.match(
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // SSH URL format (ssh://git@github.com/owner/repo.git)
  const sshUrlMatch = url.match(
    /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i
  );
  if (sshUrlMatch) {
    return { owner: sshUrlMatch[1], repo: sshUrlMatch[2] };
  }

  return null;
}

/**
 * Check if URL is a GitHub URL
 */
export function isGitHubUrl(url: string): boolean {
  return (
    url.includes('github.com') &&
    parseGitHubUrl(url) !== null
  );
}
