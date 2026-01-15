/**
 * Azure DevOps Service
 * Provides integration with Azure DevOps for Pull Requests, Work Items, Policies, and Pipelines
 */

import type { WebApi } from 'azure-devops-node-api';
import type { IBuildApi } from 'azure-devops-node-api/BuildApi';
import type { IGitApi } from 'azure-devops-node-api/GitApi';
import { PullRequestStatus as AzurePRStatusEnum } from 'azure-devops-node-api/interfaces/GitInterfaces';
import type { IPolicyApi } from 'azure-devops-node-api/PolicyApi';
import type { ITestApi } from 'azure-devops-node-api/TestApi';
import type { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import * as vscode from 'vscode';

import type {
	BuildDetails,
	CodeCoverage,
	PolicyConfiguration,
	PolicyEvaluation,
	PullRequest,
	TestResult,
	WorkItem,
} from '../../types/azure';
import type {
	AzureAuthProvider,
	AzureConnectionConfig,
} from './AzureAuthProvider';
import {
	type AzureBuild,
	type AzureCodeCoverageData,
	type AzureErrorCode,
	type AzureGitPullRequest,
	type AzurePolicyConfiguration,
	type AzurePolicyEvaluation,
	AzureServiceError,
	type AzureTestCaseResult,
	type AzureWorkItem,
	mapBuildDetails,
	mapCodeCoverage,
	mapHttpStatusToErrorCode,
	mapPolicyConfiguration,
	mapPolicyEvaluation,
	mapPullRequest,
	mapTestResult,
	mapWorkItem,
	toBranchRef,
} from './AzureService.types';

/**
 * Rate limit backoff configuration
 */
interface BackoffConfig {
	initialDelayMs: number;
	maxDelayMs: number;
	multiplier: number;
}

const DEFAULT_BACKOFF: BackoffConfig = {
	initialDelayMs: 1000,
	maxDelayMs: 30000,
	multiplier: 2,
};

/**
 * Azure DevOps Service
 * Main service for all Azure DevOps operations
 */
export class AzureService implements vscode.Disposable {
	private gitApi: IGitApi | null = null;
	private buildApi: IBuildApi | null = null;
	private workItemApi: IWorkItemTrackingApi | null = null;
	private policyApi: IPolicyApi | null = null;
	private testApi: ITestApi | null = null;
	private repositoryId: string | null = null;
	private backoffDelay = DEFAULT_BACKOFF.initialDelayMs;

	constructor(private readonly authProvider: AzureAuthProvider) {}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.gitApi = null;
		this.buildApi = null;
		this.workItemApi = null;
		this.policyApi = null;
		this.testApi = null;
		this.repositoryId = null;
	}

	// ===========================================================================
	// Authentication
	// ===========================================================================

	/**
	 * Authenticate with PAT
	 */
	async authenticate(pat: string): Promise<boolean> {
		const config = vscode.workspace.getConfiguration('gitBoard.azure');
		const organization = config.get<string>('organization') || '';
		const project = config.get<string>('project') || '';

		if (!organization || !project) {
			throw new AzureServiceError(
				'Azure DevOps organization and project must be configured in settings',
				'BAD_REQUEST',
			);
		}

		const success = await this.authProvider.authenticate(
			pat,
			organization,
			project,
		);
		if (success) {
			await this.initializeApis();
		}
		return success;
	}

	/**
	 * Check if authenticated
	 */
	isAuthenticated(): boolean {
		return this.authProvider.isAuthenticated();
	}

	/**
	 * Get current connection
	 */
	getConnection(): WebApi {
		return this.authProvider.getConnection();
	}

	/**
	 * Initialize API clients after authentication
	 */
	private async initializeApis(): Promise<void> {
		const connection = this.authProvider.getConnection();
		const config = this.authProvider.getConfig();

		if (!config) {
			throw new AzureServiceError('Not authenticated', 'UNAUTHORIZED');
		}

		this.gitApi = await connection.getGitApi();
		this.buildApi = await connection.getBuildApi();
		this.workItemApi = await connection.getWorkItemTrackingApi();
		this.policyApi = await connection.getPolicyApi();
		this.testApi = await connection.getTestApi();

		// Get repository ID for the current project
		await this.initializeRepository(config);
	}

	/**
	 * Initialize repository ID
	 */
	private async initializeRepository(
		config: AzureConnectionConfig,
	): Promise<void> {
		if (!this.gitApi) return;

		try {
			const repos = await this.gitApi.getRepositories(config.project);
			if (repos && repos.length > 0) {
				// Try to find repo matching workspace folder name
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders && workspaceFolders.length > 0) {
					const workspaceName = workspaceFolders[0].name;
					const matchingRepo = repos.find(
						(r) => r.name?.toLowerCase() === workspaceName.toLowerCase(),
					);
					if (matchingRepo?.id) {
						this.repositoryId = matchingRepo.id;
						return;
					}
				}
				// Default to first repo
				if (repos[0].id) {
					this.repositoryId = repos[0].id;
				}
			}
		} catch (error) {
			this.handleApiError(error, 'Failed to initialize repository');
		}
	}

	/**
	 * Try to restore authentication from stored credentials
	 */
	async tryRestoreAuth(): Promise<boolean> {
		const success = await this.authProvider.tryRestoreAuth();
		if (success) {
			await this.initializeApis();
		}
		return success;
	}

	// ===========================================================================
	// Pull Requests
	// ===========================================================================

	/**
	 * Get pull requests, optionally filtered by branch
	 */
	async getPullRequests(branch?: string): Promise<PullRequest[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const searchCriteria: {
				status?: AzurePRStatusEnum;
				sourceRefName?: string;
				targetRefName?: string;
				repositoryId?: string;
			} = {
				status: AzurePRStatusEnum.Active,
			};

			if (branch) {
				searchCriteria.targetRefName = toBranchRef(branch);
			}

			if (this.repositoryId) {
				searchCriteria.repositoryId = this.repositoryId;
			}

			const prs = await this.gitApi!.getPullRequests(
				this.repositoryId || config.project,
				searchCriteria,
			);

			if (!prs) return [];

			// Fetch work item IDs for each PR
			const results: PullRequest[] = [];
			for (const pr of prs) {
				const workItemIds = await this.getPRWorkItemIds(pr.pullRequestId!);
				results.push(mapPullRequest(pr as AzureGitPullRequest, workItemIds));
			}

			return results;
		});
	}

	/**
	 * Get a single pull request by ID
	 */
	async getPullRequest(id: number): Promise<PullRequest> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const pr = await this.gitApi!.getPullRequest(
				this.repositoryId || config.project,
				id,
			);

			if (!pr) {
				throw new AzureServiceError(
					`Pull request ${id} not found`,
					'NOT_FOUND',
					404,
				);
			}

			const workItemIds = await this.getPRWorkItemIds(id);
			return mapPullRequest(pr as AzureGitPullRequest, workItemIds);
		});
	}

	/**
	 * Create a new pull request
	 */
	async createPullRequest(
		source: string,
		target: string,
		title: string,
		description: string,
	): Promise<PullRequest> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const pr = await this.gitApi!.createPullRequest(
				{
					sourceRefName: toBranchRef(source),
					targetRefName: toBranchRef(target),
					title,
					description,
				},
				this.repositoryId || config.project,
				config.project,
			);

			if (!pr) {
				throw new AzureServiceError(
					'Failed to create pull request',
					'SERVER_ERROR',
				);
			}

			return mapPullRequest(pr as AzureGitPullRequest, []);
		});
	}

	/**
	 * Update an existing pull request
	 */
	async updatePullRequest(
		id: number,
		updates: {
			title?: string;
			description?: string;
			status?: 'active' | 'completed' | 'abandoned';
		},
	): Promise<PullRequest> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			const updateData: {
				title?: string;
				description?: string;
				status?: AzurePRStatusEnum;
			} = {};

			if (updates.title) updateData.title = updates.title;
			if (updates.description) updateData.description = updates.description;
			if (updates.status) {
				updateData.status =
					updates.status === 'completed'
						? AzurePRStatusEnum.Completed
						: updates.status === 'abandoned'
							? AzurePRStatusEnum.Abandoned
							: AzurePRStatusEnum.Active;
			}

			const pr = await this.gitApi!.updatePullRequest(
				updateData,
				this.repositoryId || config.project,
				id,
				config.project,
			);

			if (!pr) {
				throw new AzureServiceError(
					`Failed to update pull request ${id}`,
					'SERVER_ERROR',
				);
			}

			const workItemIds = await this.getPRWorkItemIds(id);
			return mapPullRequest(pr as AzureGitPullRequest, workItemIds);
		});
	}

	/**
	 * Get work item IDs linked to a PR
	 */
	private async getPRWorkItemIds(prId: number): Promise<number[]> {
		try {
			const config = this.authProvider.getConfig()!;
			const workItemRefs = await this.gitApi!.getPullRequestWorkItemRefs(
				this.repositoryId || config.project,
				prId,
				config.project,
			);

			if (!workItemRefs) return [];
			return workItemRefs
				.map((ref) => parseInt(ref.id || '0', 10))
				.filter((id) => id > 0);
		} catch {
			return [];
		}
	}

	// ===========================================================================
	// Work Items
	// ===========================================================================

	/**
	 * Get a single work item
	 */
	async getWorkItem(id: number): Promise<WorkItem> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const workItem = await this.workItemApi!.getWorkItem(
				id,
				undefined,
				undefined,
				undefined,
			);

			if (!workItem) {
				throw new AzureServiceError(
					`Work item ${id} not found`,
					'NOT_FOUND',
					404,
				);
			}

			return mapWorkItem(workItem as AzureWorkItem);
		});
	}

	/**
	 * Get multiple work items
	 */
	async getWorkItems(ids: number[]): Promise<WorkItem[]> {
		this.ensureAuthenticated();

		if (ids.length === 0) return [];

		return this.withRetry(async () => {
			const workItems = await this.workItemApi!.getWorkItems(
				ids,
				undefined,
				undefined,
				undefined,
			);

			if (!workItems) return [];
			return workItems
				.filter((wi): wi is NonNullable<typeof wi> => wi !== null)
				.map((wi) => mapWorkItem(wi as AzureWorkItem));
		});
	}

	/**
	 * Link a work item to a commit
	 * Note: This creates an artifact link relation
	 */
	async linkWorkItemToCommit(
		workItemId: number,
		commitSha: string,
	): Promise<void> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const _orgUrl = `https://dev.azure.com/${config.organization}`;

			// Create the artifact link
			const patchDocument = [
				{
					op: 'add',
					path: '/relations/-',
					value: {
						rel: 'ArtifactLink',
						url: `vstfs:///Git/Commit/${config.project}/${this.repositoryId}/${commitSha}`,
						attributes: {
							name: 'Fixed in Commit',
						},
					},
				},
			];

			await this.workItemApi!.updateWorkItem(
				undefined,
				patchDocument,
				workItemId,
				config.project,
			);
		});
	}

	/**
	 * Get work items linked to a commit
	 */
	async getLinkedWorkItems(commitSha: string): Promise<WorkItem[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			// Get commit details with work item links
			const commit = await this.gitApi!.getCommit(
				commitSha,
				this.repositoryId || config.project,
				config.project,
			);

			if (!commit || !commit.workItems || commit.workItems.length === 0) {
				return [];
			}

			const workItemIds = commit.workItems
				.map((wi) => {
					// Extract ID from URL or use id directly
					const url = wi.url || '';
					const match = url.match(/workItems\/(\d+)/);
					return match ? parseInt(match[1], 10) : 0;
				})
				.filter((id) => id > 0);

			if (workItemIds.length === 0) return [];

			return this.getWorkItems(workItemIds);
		});
	}

	// ===========================================================================
	// Branch Policies
	// ===========================================================================

	/**
	 * Get policy configurations for a branch
	 */
	async getPolicyConfigurations(
		branch: string,
	): Promise<PolicyConfiguration[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const branchRef = toBranchRef(branch);

			const policies = await this.policyApi!.getPolicyConfigurations(
				config.project,
				`refs/heads/${branch}`,
			);

			if (!policies) return [];

			// Filter policies that apply to this branch
			return policies
				.filter((p) => {
					const settings = p.settings as {
						scope?: Array<{ refName?: string }>;
					};
					if (!settings?.scope) return false;
					return settings.scope.some(
						(s) => s.refName === branchRef || s.refName?.includes('*'),
					);
				})
				.map((p) => mapPolicyConfiguration(p as AzurePolicyConfiguration));
		});
	}

	/**
	 * Get policy evaluations for a pull request
	 */
	async getPolicyEvaluations(prId: number): Promise<PolicyEvaluation[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const artifactId = `vstfs:///CodeReview/CodeReviewId/${config.project}/${prId}`;

			const evaluations = await this.policyApi!.getPolicyEvaluations(
				config.project,
				artifactId,
			);

			if (!evaluations) return [];

			return evaluations.map((e) =>
				mapPolicyEvaluation(e as AzurePolicyEvaluation),
			);
		});
	}

	// ===========================================================================
	// Pipelines / Builds
	// ===========================================================================

	/**
	 * Get build status for a specific commit
	 */
	async getBuildStatus(commitSha: string): Promise<BuildDetails> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			const builds = await this.buildApi!.getBuilds(
				config.project,
				undefined, // definitions
				undefined, // queues
				undefined, // buildNumber
				undefined, // minTime
				undefined, // maxTime
				undefined, // requestedFor
				undefined, // reasonFilter
				undefined, // statusFilter
				undefined, // resultFilter
				undefined, // tagFilters
				undefined, // properties
				1, // top - just get the latest
				undefined, // continuationToken
				undefined, // maxBuildsPerDefinition
				undefined, // deletedFilter
				undefined, // queryOrder
				undefined, // branchName
				undefined, // buildIds
				this.repositoryId, // repositoryId
				'TfsGit', // repositoryType
			);

			// Find build matching the commit
			const build = builds?.find((b) => b.sourceVersion === commitSha);

			if (!build) {
				throw new AzureServiceError(
					`No build found for commit ${commitSha}`,
					'NOT_FOUND',
					404,
				);
			}

			return mapBuildDetails(build as AzureBuild);
		});
	}

	/**
	 * Get builds, optionally filtered by branch
	 */
	async getBuilds(branch?: string): Promise<BuildDetails[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			const builds = await this.buildApi!.getBuilds(
				config.project,
				undefined, // definitions
				undefined, // queues
				undefined, // buildNumber
				undefined, // minTime
				undefined, // maxTime
				undefined, // requestedFor
				undefined, // reasonFilter
				undefined, // statusFilter
				undefined, // resultFilter
				undefined, // tagFilters
				undefined, // properties
				50, // top
				undefined, // continuationToken
				undefined, // maxBuildsPerDefinition
				undefined, // deletedFilter
				undefined, // queryOrder
				branch ? toBranchRef(branch) : undefined, // branchName
				undefined, // buildIds
				this.repositoryId, // repositoryId
				'TfsGit', // repositoryType
			);

			if (!builds) return [];

			return builds.map((b) => mapBuildDetails(b as AzureBuild));
		});
	}

	/**
	 * Get test results for a build
	 */
	async getTestResults(buildId: number): Promise<TestResult[]> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			// Get test runs for the build
			const testRuns = await this.testApi!.getTestRuns(
				config.project,
				`vstfs:///Build/Build/${buildId}`,
			);

			if (!testRuns || testRuns.length === 0) return [];

			// Get results from all test runs
			const allResults: TestResult[] = [];

			for (const run of testRuns) {
				if (!run.id) continue;

				const results = await this.testApi!.getTestResults(
					config.project,
					run.id,
				);

				if (results) {
					allResults.push(
						...results.map((r) => mapTestResult(r as AzureTestCaseResult)),
					);
				}
			}

			return allResults;
		});
	}

	/**
	 * Get code coverage for a build
	 */
	async getCodeCoverage(buildId: number): Promise<CodeCoverage> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			const coverage = await this.testApi!.getCodeCoverageSummary(
				config.project,
				buildId,
			);

			if (!coverage || !coverage.coverageData) {
				return {
					lineCoverage: 0,
					branchCoverage: 0,
					modules: [],
				};
			}

			return mapCodeCoverage(coverage.coverageData as AzureCodeCoverageData[]);
		});
	}

	/**
	 * Trigger a new build
	 */
	async triggerBuild(
		definitionId: number,
		branch: string,
	): Promise<BuildDetails> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;

			const build = await this.buildApi!.queueBuild(
				{
					definition: { id: definitionId },
					sourceBranch: toBranchRef(branch),
				},
				config.project,
			);

			if (!build) {
				throw new AzureServiceError('Failed to trigger build', 'SERVER_ERROR');
			}

			return mapBuildDetails(build as AzureBuild);
		});
	}

	// ===========================================================================
	// Error Handling & Utilities
	// ===========================================================================

	/**
	 * Ensure the service is authenticated
	 */
	private ensureAuthenticated(): void {
		if (!this.isAuthenticated()) {
			throw new AzureServiceError(
				'Not authenticated to Azure DevOps',
				'UNAUTHORIZED',
			);
		}

		if (!this.gitApi) {
			throw new AzureServiceError(
				'Azure DevOps APIs not initialized',
				'UNAUTHORIZED',
			);
		}
	}

	/**
	 * Execute an API call with retry logic for rate limiting
	 */
	private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const result = await fn();
				// Reset backoff on success
				this.backoffDelay = DEFAULT_BACKOFF.initialDelayMs;
				return result;
			} catch (error) {
				lastError = error as Error;
				const azureError = this.handleApiError(error, 'API call failed');

				// Only retry on rate limiting
				if (azureError.code === 'RATE_LIMITED' && attempt < maxRetries) {
					await this.delay(this.backoffDelay);
					this.backoffDelay = Math.min(
						this.backoffDelay * DEFAULT_BACKOFF.multiplier,
						DEFAULT_BACKOFF.maxDelayMs,
					);
					continue;
				}

				throw azureError;
			}
		}

		throw lastError || new AzureServiceError('Unknown error', 'UNKNOWN');
	}

	/**
	 * Handle API errors and convert to AzureServiceError
	 */
	private handleApiError(error: unknown, context: string): AzureServiceError {
		if (error instanceof AzureServiceError) {
			return error;
		}

		const err = error as { statusCode?: number; message?: string };
		const statusCode = err.statusCode;
		const message = err.message || 'Unknown error';

		let errorCode: AzureErrorCode = 'UNKNOWN';
		let userMessage = `${context}: ${message}`;

		if (statusCode) {
			errorCode = mapHttpStatusToErrorCode(statusCode);

			switch (statusCode) {
				case 401:
					userMessage =
						'Authentication failed. Your PAT may be expired. Please re-authenticate.';
					// Trigger re-auth prompt
					vscode.commands.executeCommand('gitBoard.azure.authenticate');
					break;
				case 403:
					userMessage =
						'Permission denied. Your PAT may not have the required scopes.';
					break;
				case 404:
					userMessage = `Resource not found: ${message}`;
					break;
				case 429:
					userMessage = 'Rate limit exceeded. Retrying with backoff...';
					break;
				default:
					if (statusCode >= 500) {
						userMessage = `Azure DevOps server error: ${message}`;
					}
			}
		}

		return new AzureServiceError(
			userMessage,
			errorCode,
			statusCode,
			err as Error,
		);
	}

	/**
	 * Delay utility for backoff
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Set repository ID manually (useful when workspace doesn't match repo name)
	 */
	setRepositoryId(id: string): void {
		this.repositoryId = id;
	}

	/**
	 * Get available repositories in the project
	 */
	async getRepositories(): Promise<Array<{ id: string; name: string }>> {
		this.ensureAuthenticated();

		return this.withRetry(async () => {
			const config = this.authProvider.getConfig()!;
			const repos = await this.gitApi!.getRepositories(config.project);

			if (!repos) return [];

			return repos
				.filter((r) => r.id && r.name)
				.map((r) => ({ id: r.id!, name: r.name! }));
		});
	}
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create AzureService instance
 */
export function createAzureService(
	authProvider: AzureAuthProvider,
): AzureService {
	return new AzureService(authProvider);
}
