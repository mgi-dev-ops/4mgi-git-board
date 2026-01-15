/**
 * GitService - Wrapper for simple-git operations
 * Provides all Git operations for 4MGI Git Board extension
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import simpleGit, { type SimpleGit, type SimpleGitOptions } from 'simple-git';

import type {
	Branch,
	Commit,
	CommitOptions,
	ConflictInfo,
	DiffResult,
	LogOptions,
	MergeOptions,
	MergeResult,
	RebaseOptions,
	RemoteInfo,
	RepositoryInfo,
	RepositoryState,
	Stash,
	StatusResult,
} from '../../types/git';
import { GitError, GitErrorCode, parseGitError } from './GitError';
import {
	detectRepositoryState,
	mapBranchSummaryToBranches,
	mapDiffSummary,
	mapRemote,
	mapStatusResult,
	parseStashList,
	type SimpleGitBranchSummary,
	type SimpleGitDiffSummary,
	type SimpleGitRemote,
	type SimpleGitStatusResult,
} from './GitService.types';

// =============================================================================
// GitService Class
// =============================================================================

export class GitService {
	private git: SimpleGit;
	private workspacePath: string;
	private gitDir: string;

	constructor(workspacePath: string) {
		this.workspacePath = workspacePath;
		this.gitDir = path.join(workspacePath, '.git');

		const options: Partial<SimpleGitOptions> = {
			baseDir: workspacePath,
			binary: 'git',
			maxConcurrentProcesses: 6,
			trimmed: true,
		};

		this.git = simpleGit(options);
	}

	// ===========================================================================
	// Repository Operations
	// ===========================================================================

	/**
	 * Get repository information
	 */
	async getRepositoryInfo(): Promise<RepositoryInfo> {
		try {
			const isRepo = await this.git.checkIsRepo();
			if (!isRepo) {
				throw new GitError(GitErrorCode.NOT_A_REPOSITORY);
			}

			const [remotesRaw, isShallow, isBare] = await Promise.all([
				this.git.getRemotes(true),
				this.isShallowClone(),
				this.isBareRepository(),
			]);

			const remotes: RemoteInfo[] = (
				remotesRaw as unknown as SimpleGitRemote[]
			).map(mapRemote);
			const hasSubmodules = fs.existsSync(
				path.join(this.workspacePath, '.gitmodules'),
			);
			const hasWorktrees = fs.existsSync(path.join(this.gitDir, 'worktrees'));

			return {
				path: this.workspacePath,
				name: path.basename(this.workspacePath),
				isGitRepository: true,
				isShallowClone: isShallow,
				isBare: isBare,
				hasSubmodules,
				hasWorktrees,
				remotes,
			};
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Get working tree status
	 */
	async getStatus(): Promise<StatusResult> {
		try {
			const status =
				(await this.git.status()) as unknown as SimpleGitStatusResult;
			return mapStatusResult(status);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Get current repository state (normal, merging, rebasing, etc.)
	 */
	getRepositoryState(): RepositoryState {
		return detectRepositoryState(this.gitDir);
	}

	/**
	 * Get conflict information if in conflict state
	 */
	async getConflictInfo(): Promise<ConflictInfo | null> {
		const state = this.getRepositoryState();
		if (state === 'normal') {
			return null;
		}

		const status = await this.getStatus();
		return {
			state,
			conflictedFiles: status.conflicted,
			currentBranch: status.current,
		};
	}

	// ===========================================================================
	// Commit Operations
	// ===========================================================================

	/**
	 * Get commit log
	 */
	async getLog(options: LogOptions = {}): Promise<Commit[]> {
		try {
			const logOptions: string[] = [
				'--pretty=format:%H|%h|%s|%b|%an|%ae|%aI|%P|%D',
				'--date=iso',
			];

			if (options.limit) {
				logOptions.push(`-n${options.limit}`);
			}
			if (options.author) {
				logOptions.push(`--author=${options.author}`);
			}
			if (options.since) {
				logOptions.push(`--since=${options.since}`);
			}
			if (options.until) {
				logOptions.push(`--until=${options.until}`);
			}
			if (options.file) {
				logOptions.push('--', options.file);
			}
			if (options.all) {
				logOptions.push('--all');
			}

			const branchArg = options.branch || 'HEAD';

			// Use raw git log for better control
			const result = await this.git.raw(['log', branchArg, ...logOptions]);

			if (!result || result.trim() === '') {
				return [];
			}

			const commits: Commit[] = [];
			const entries = result.split('\n').filter((line) => line.includes('|'));

			for (const entry of entries) {
				const parts = entry.split('|');
				if (parts.length >= 8) {
					const [
						sha,
						shortSha,
						message,
						body,
						authorName,
						authorEmail,
						date,
						parentsStr,
						refs,
					] = parts;

					commits.push({
						sha,
						shortSha,
						message,
						body: body || undefined,
						author: {
							name: authorName,
							email: authorEmail,
						},
						date,
						parents: parentsStr ? parentsStr.split(' ').filter(Boolean) : [],
						refs: refs
							? refs.split(', ').map((r) => {
									const trimmed = r.trim();
									if (trimmed.startsWith('tag: ')) {
										return {
											name: trimmed.replace('tag: ', ''),
											type: 'tag' as const,
										};
									}
									if (trimmed.includes('/')) {
										return { name: trimmed, type: 'remote' as const };
									}
									return { name: trimmed, type: 'head' as const };
								})
							: [],
						workItemIds: [],
					});
				}
			}

			return commits;
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Create a commit
	 */
	async commit(
		message: string,
		files: string[] = [],
		options: CommitOptions = {},
	): Promise<string> {
		try {
			// Stage files if provided
			if (files.length > 0) {
				await this.stage(files);
			}

			const commitOptions: string[] = ['-m', message];

			if (options.amend) {
				commitOptions.push('--amend');
			}
			if (options.allowEmpty) {
				commitOptions.push('--allow-empty');
			}
			if (options.noVerify) {
				commitOptions.push('--no-verify');
			}

			const result = await this.git.commit(
				message,
				files,
				commitOptions as Record<string, string | number | boolean>,
			);
			return result.commit;
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Amend the last commit
	 */
	async amend(message?: string): Promise<string> {
		try {
			const options: string[] = ['--amend'];
			if (message) {
				options.push('-m', message);
			} else {
				options.push('--no-edit');
			}

			const result = await this.git.raw(['commit', ...options]);
			// Extract commit hash from result
			const match = result.match(/\[[\w/]+ ([a-f0-9]+)\]/);
			return match ? match[1] : '';
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Branch Operations
	// ===========================================================================

	/**
	 * Get all branches
	 */
	async getBranches(): Promise<Branch[]> {
		try {
			const [localBranches, remoteBranches] = await Promise.all([
				this.git.branchLocal(),
				this.git.branch(['-r']),
			]);

			// Get tracking info for local branches
			const trackingInfo = new Map<
				string,
				{ ahead: number; behind: number; tracking?: string }
			>();

			for (const branchName of Object.keys(localBranches.branches)) {
				try {
					const trackingResult = await this.git.raw([
						'rev-list',
						'--left-right',
						'--count',
						`${branchName}...@{upstream}`,
					]);
					const [ahead, behind] = trackingResult
						.trim()
						.split(/\s+/)
						.map(Number);

					const trackingBranch = await this.git
						.raw(['config', '--get', `branch.${branchName}.remote`])
						.catch(() => '');

					trackingInfo.set(branchName, {
						ahead: ahead || 0,
						behind: behind || 0,
						tracking: trackingBranch.trim() || undefined,
					});
				} catch {
					// No upstream configured
					trackingInfo.set(branchName, { ahead: 0, behind: 0 });
				}
			}

			const localBranchList = mapBranchSummaryToBranches(
				localBranches as unknown as SimpleGitBranchSummary,
				trackingInfo,
				false, // not remote branches
			);

			const remoteBranchList = mapBranchSummaryToBranches(
				remoteBranches as unknown as SimpleGitBranchSummary,
				undefined, // no tracking info for remote branches
				true, // these are remote branches
			);

			return [...localBranchList, ...remoteBranchList];
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Checkout a branch or commit
	 */
	async checkout(branchOrCommit: string): Promise<void> {
		try {
			await this.git.checkout(branchOrCommit);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Create a new branch
	 */
	async createBranch(name: string, from?: string): Promise<void> {
		try {
			if (from) {
				await this.git.checkoutBranch(name, from);
			} else {
				await this.git.checkoutLocalBranch(name);
			}
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Delete a branch
	 */
	async deleteBranch(name: string, force: boolean = false): Promise<void> {
		try {
			const flag = force ? '-D' : '-d';
			await this.git.branch([flag, name]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Rename a branch
	 */
	async renameBranch(oldName: string, newName: string): Promise<void> {
		try {
			await this.git.branch(['-m', oldName, newName]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Merge/Rebase Operations
	// ===========================================================================

	/**
	 * Merge a branch
	 */
	async merge(
		branch: string,
		options: MergeOptions = {},
	): Promise<MergeResult> {
		try {
			const mergeOptions: string[] = [];

			if (options.noFastForward) {
				mergeOptions.push('--no-ff');
			}
			if (options.squash) {
				mergeOptions.push('--squash');
			}
			if (options.message) {
				mergeOptions.push('-m', options.message);
			}
			if (options.noCommit) {
				mergeOptions.push('--no-commit');
			}

			await this.git.merge([branch, ...mergeOptions]);

			// Get merge commit hash
			const log = await this.git.log(['-1']);
			const mergeCommit = log.latest?.hash;

			return {
				success: true,
				conflicts: [],
				mergeCommit,
			};
		} catch (error) {
			const gitError = parseGitError(error);

			if (gitError.code === GitErrorCode.MERGE_CONFLICT) {
				const status = await this.getStatus();
				return {
					success: false,
					conflicts: status.conflicted,
					message: 'Merge conflict detected',
				};
			}

			throw gitError;
		}
	}

	/**
	 * Rebase onto a branch
	 */
	async rebase(onto: string, options: RebaseOptions = {}): Promise<void> {
		try {
			const rebaseArgs: string[] = [onto];

			if (options.interactive) {
				// Note: Interactive rebase requires user input, not fully supported
				rebaseArgs.unshift('-i');
			}
			if (options.autosquash) {
				rebaseArgs.unshift('--autosquash');
			}
			if (options.onto) {
				rebaseArgs.unshift('--onto', options.onto);
			}

			await this.git.rebase(rebaseArgs);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Cherry-pick a commit
	 */
	async cherryPick(commitSha: string): Promise<void> {
		try {
			await this.git.raw(['cherry-pick', commitSha]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Abort merge
	 */
	async abortMerge(): Promise<void> {
		try {
			await this.git.merge(['--abort']);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Abort rebase
	 */
	async abortRebase(): Promise<void> {
		try {
			await this.git.rebase(['--abort']);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Continue rebase
	 */
	async continueRebase(): Promise<void> {
		try {
			await this.git.rebase(['--continue']);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Staging Operations
	// ===========================================================================

	/**
	 * Stage files
	 */
	async stage(files: string[]): Promise<void> {
		try {
			await this.git.add(files);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Unstage files
	 */
	async unstage(files: string[]): Promise<void> {
		try {
			await this.git.reset(['HEAD', '--', ...files]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Stage all changes
	 */
	async stageAll(): Promise<void> {
		try {
			await this.git.add(['-A']);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Stash Operations
	// ===========================================================================

	/**
	 * Get stash list
	 */
	async stashList(): Promise<Stash[]> {
		try {
			const result = await this.git.raw([
				'stash',
				'list',
				'--format=%h|%aI|%s',
			]);
			return parseStashList(result);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Create a stash
	 */
	async stashCreate(message?: string): Promise<void> {
		try {
			const args = ['stash', 'push'];
			if (message) {
				args.push('-m', message);
			}
			await this.git.raw(args);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Apply a stash (keep in list)
	 */
	async stashApply(index: number): Promise<void> {
		try {
			await this.git.raw(['stash', 'apply', `stash@{${index}}`]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Pop a stash (remove from list)
	 */
	async stashPop(index: number): Promise<void> {
		try {
			await this.git.raw(['stash', 'pop', `stash@{${index}}`]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Drop a stash
	 */
	async stashDrop(index: number): Promise<void> {
		try {
			await this.git.raw(['stash', 'drop', `stash@{${index}}`]);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Diff Operations
	// ===========================================================================

	/**
	 * Get diff for a commit
	 */
	async getDiff(commitSha: string): Promise<DiffResult> {
		try {
			const [summary, raw] = await Promise.all([
				this.git.diffSummary([`${commitSha}^`, commitSha]),
				this.git.diff([`${commitSha}^`, commitSha]),
			]);

			return mapDiffSummary(summary as unknown as SimpleGitDiffSummary, raw);
		} catch (error) {
			// Handle first commit (no parent)
			if (String(error).includes('unknown revision')) {
				const [summary, raw] = await Promise.all([
					this.git.diffSummary([commitSha, '--root']),
					this.git.diff([commitSha, '--root']),
				]);
				return mapDiffSummary(summary as unknown as SimpleGitDiffSummary, raw);
			}
			throw parseGitError(error);
		}
	}

	/**
	 * Get diff for a specific file
	 */
	async getFileDiff(file: string, staged: boolean = false): Promise<string> {
		try {
			const args = staged ? ['--cached', '--', file] : ['--', file];
			return await this.git.diff(args);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Remote Operations
	// ===========================================================================

	/**
	 * Fetch from remote
	 */
	async fetch(remote?: string, prune: boolean = false): Promise<void> {
		try {
			const args: string[] = [];
			if (remote) {
				args.push(remote);
			}
			if (prune) {
				args.push('--prune');
			}
			await this.git.fetch(args);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Pull from remote
	 */
	async pull(
		remote?: string,
		branch?: string,
		rebase: boolean = false,
	): Promise<void> {
		try {
			const options: string[] = [];
			if (rebase) {
				options.push('--rebase');
			}

			if (remote && branch) {
				await this.git.pull(remote, branch, options);
			} else {
				await this.git.pull(options);
			}
		} catch (error) {
			throw parseGitError(error);
		}
	}

	/**
	 * Push to remote
	 */
	async push(
		remote?: string,
		branch?: string,
		options: { force?: boolean; setUpstream?: boolean } = {},
	): Promise<void> {
		try {
			const args: string[] = [];

			if (options.force) {
				args.push('--force');
			}
			if (options.setUpstream) {
				args.push('-u');
			}
			if (remote) {
				args.push(remote);
			}
			if (branch) {
				args.push(branch);
			}

			await this.git.push(args);
		} catch (error) {
			throw parseGitError(error);
		}
	}

	// ===========================================================================
	// Utility Methods
	// ===========================================================================

	/**
	 * Check if repository is shallow clone
	 */
	private async isShallowClone(): Promise<boolean> {
		try {
			const result = await this.git.raw([
				'rev-parse',
				'--is-shallow-repository',
			]);
			return result.trim() === 'true';
		} catch {
			return false;
		}
	}

	/**
	 * Check if repository is bare
	 */
	private async isBareRepository(): Promise<boolean> {
		try {
			const result = await this.git.raw(['rev-parse', '--is-bare-repository']);
			return result.trim() === 'true';
		} catch {
			return false;
		}
	}

	/**
	 * Check if lock file exists
	 */
	isLocked(): boolean {
		return fs.existsSync(path.join(this.gitDir, 'index.lock'));
	}

	/**
	 * Remove lock file (use with caution)
	 */
	removeLock(): void {
		const lockFile = path.join(this.gitDir, 'index.lock');
		if (fs.existsSync(lockFile)) {
			fs.unlinkSync(lockFile);
		}
	}

	/**
	 * Get workspace path
	 */
	getWorkspacePath(): string {
		return this.workspacePath;
	}

	/**
	 * Execute raw git command
	 * Use for commands not covered by simple-git methods
	 */
	async raw(args: string[]): Promise<string> {
		try {
			return await this.git.raw(args);
		} catch (error) {
			throw parseGitError(error);
		}
	}
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create GitService instance for a workspace
 */
export function createGitService(workspacePath: string): GitService {
	return new GitService(workspacePath);
}

// =============================================================================
// Exports
// =============================================================================

export {
	GitError,
	GitErrorCode,
	hasConflicts,
	isGitError,
	parseGitError,
} from './GitError';
