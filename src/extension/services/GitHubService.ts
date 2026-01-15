/**
 * GitHub Service
 * Handles all GitHub API interactions using @octokit/rest
 */

import { Octokit } from '@octokit/rest';
import type * as vscode from 'vscode';
import type {
	GitHubAuthResult,
	GitHubCombinedStatus,
	GitHubPullRequest,
	GitHubRepository,
	GitHubUser,
} from '../../types/github';
import {
	mapCheckRuns,
	mapCombinedStatus,
	mapPullRequest,
	mapRepository,
	mapUser,
	type OctokitPullRequestReviewResponse,
	parseGitHubUrl,
} from './GitHubService.types';

/**
 * Secret storage key for GitHub PAT
 */
const GITHUB_PAT_KEY = 'gitBoard.github.pat';

/**
 * GitHub Service class
 * Manages GitHub API authentication and operations
 */
export class GitHubService {
	private octokit: Octokit | null = null;
	private currentUser: GitHubUser | null = null;
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * Initialize the service
	 * Attempts to restore authentication from stored PAT
	 */
	async initialize(): Promise<boolean> {
		const storedPat = await this.getStoredPat();
		if (storedPat) {
			const result = await this.authenticate(storedPat);
			return result.success;
		}
		return false;
	}

	/**
	 * Get stored PAT from secure storage
	 */
	private async getStoredPat(): Promise<string | undefined> {
		return this.context.secrets.get(GITHUB_PAT_KEY);
	}

	/**
	 * Store PAT in secure storage
	 */
	private async storePat(pat: string): Promise<void> {
		await this.context.secrets.store(GITHUB_PAT_KEY, pat);
	}

	/**
	 * Clear stored PAT
	 */
	private async clearPat(): Promise<void> {
		await this.context.secrets.delete(GITHUB_PAT_KEY);
	}

	/**
	 * Authenticate with GitHub using Personal Access Token
	 * @param pat Personal Access Token
	 * @returns Authentication result with user info if successful
	 */
	async authenticate(pat: string): Promise<GitHubAuthResult> {
		try {
			const octokit = new Octokit({
				auth: pat,
				userAgent: '4mgi-git-board',
			});

			// Verify token by fetching current user
			const { data: userData } = await octokit.users.getAuthenticated();
			const user = mapUser(userData);

			// Store credentials on success
			this.octokit = octokit;
			this.currentUser = user;
			await this.storePat(pat);

			return {
				success: true,
				user,
			};
		} catch (error) {
			this.octokit = null;
			this.currentUser = null;

			const message =
				error instanceof Error ? error.message : 'Authentication failed';
			return {
				success: false,
				error: message,
			};
		}
	}

	/**
	 * Sign out and clear stored credentials
	 */
	async signOut(): Promise<void> {
		this.octokit = null;
		this.currentUser = null;
		await this.clearPat();
	}

	/**
	 * Check if currently authenticated
	 */
	isAuthenticated(): boolean {
		return this.octokit !== null && this.currentUser !== null;
	}

	/**
	 * Get current authenticated user
	 */
	getCurrentUser(): GitHubUser | null {
		return this.currentUser;
	}

	/**
	 * Ensure authenticated before API calls
	 */
	private ensureAuthenticated(): Octokit {
		if (!this.octokit) {
			throw new Error('Not authenticated with GitHub. Please sign in first.');
		}
		return this.octokit;
	}

	/**
	 * Get repository info from owner and repo name
	 */
	async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
		const octokit = this.ensureAuthenticated();

		const { data } = await octokit.repos.get({
			owner,
			repo,
		});

		return mapRepository(data);
	}

	/**
	 * Get repository info from remote URL
	 */
	async getRepositoryFromUrl(
		remoteUrl: string,
	): Promise<GitHubRepository | null> {
		const parsed = parseGitHubUrl(remoteUrl);
		if (!parsed) {
			return null;
		}

		return this.getRepository(parsed.owner, parsed.repo);
	}

	/**
	 * Parse remote URL to get owner and repo
	 */
	getRepoInfo(remoteUrl: string): { owner: string; repo: string } | null {
		return parseGitHubUrl(remoteUrl);
	}

	/**
	 * Get pull requests for a repository
	 * @param owner Repository owner
	 * @param repo Repository name
	 * @param branch Optional branch filter (source branch)
	 * @param state Filter by state (open, closed, all)
	 */
	async getPullRequests(
		owner: string,
		repo: string,
		branch?: string,
		state: 'open' | 'closed' | 'all' = 'open',
	): Promise<GitHubPullRequest[]> {
		const octokit = this.ensureAuthenticated();

		const { data: prs } = await octokit.pulls.list({
			owner,
			repo,
			state,
			head: branch ? `${owner}:${branch}` : undefined,
			per_page: 100,
			sort: 'updated',
			direction: 'desc',
		});

		// Fetch reviews for each PR
		const pullRequests: GitHubPullRequest[] = [];
		for (const pr of prs) {
			try {
				const { data: reviews } = await octokit.pulls.listReviews({
					owner,
					repo,
					pull_number: pr.number,
				});
				pullRequests.push(
					mapPullRequest(pr, reviews as OctokitPullRequestReviewResponse[]),
				);
			} catch {
				// If reviews fail, still return PR without reviews
				pullRequests.push(mapPullRequest(pr, []));
			}
		}

		return pullRequests;
	}

	/**
	 * Get a single pull request by number
	 */
	async getPullRequest(
		owner: string,
		repo: string,
		pullNumber: number,
	): Promise<GitHubPullRequest> {
		const octokit = this.ensureAuthenticated();

		const [{ data: pr }, { data: reviews }] = await Promise.all([
			octokit.pulls.get({
				owner,
				repo,
				pull_number: pullNumber,
			}),
			octokit.pulls.listReviews({
				owner,
				repo,
				pull_number: pullNumber,
			}),
		]);

		return mapPullRequest(pr, reviews as OctokitPullRequestReviewResponse[]);
	}

	/**
	 * Get pull requests for a specific branch (as source)
	 */
	async getPullRequestsForBranch(
		owner: string,
		repo: string,
		branch: string,
	): Promise<GitHubPullRequest[]> {
		return this.getPullRequests(owner, repo, branch, 'all');
	}

	/**
	 * Get combined status for a commit (checks + statuses)
	 */
	async getCommitStatus(
		owner: string,
		repo: string,
		ref: string,
	): Promise<GitHubCombinedStatus> {
		const octokit = this.ensureAuthenticated();

		const [statusResponse, checkRunsResponse] = await Promise.all([
			octokit.repos.getCombinedStatusForRef({
				owner,
				repo,
				ref,
			}),
			octokit.checks.listForRef({
				owner,
				repo,
				ref,
			}),
		]);

		const checkRuns = mapCheckRuns(checkRunsResponse.data);
		return mapCombinedStatus(statusResponse.data, checkRuns);
	}

	/**
	 * Create a new pull request
	 */
	async createPullRequest(
		owner: string,
		repo: string,
		title: string,
		head: string,
		base: string,
		body?: string,
		draft?: boolean,
	): Promise<GitHubPullRequest> {
		const octokit = this.ensureAuthenticated();

		const { data: pr } = await octokit.pulls.create({
			owner,
			repo,
			title,
			head,
			base,
			body: body ?? '',
			draft: draft ?? false,
		});

		return mapPullRequest(pr, []);
	}

	/**
	 * Get list of branches
	 */
	async getBranches(
		owner: string,
		repo: string,
	): Promise<{ name: string; protected: boolean }[]> {
		const octokit = this.ensureAuthenticated();

		const { data: branches } = await octokit.repos.listBranches({
			owner,
			repo,
			per_page: 100,
		});

		return branches.map((b) => ({
			name: b.name,
			protected: b.protected,
		}));
	}
}

/**
 * Singleton instance holder
 */
let instance: GitHubService | null = null;

/**
 * Get or create GitHubService instance
 */
export function getGitHubService(
	context: vscode.ExtensionContext,
): GitHubService {
	if (!instance) {
		instance = new GitHubService(context);
	}
	return instance;
}

/**
 * Dispose GitHubService instance
 */
export function disposeGitHubService(): void {
	instance = null;
}
