import type React from 'react';
import { useEffect, useCallback } from 'react';
import { GitGraph } from './components/graph';
import { Layout } from './components/layout';
import { useMessageHandler } from './hooks/useMessageHandler';
import {
	useGitStore,
	type GitCommit,
	type GitBranch,
	type GitStash,
	type GitStatus,
} from './stores/gitStore';
import type { Commit, Branch, Stash, StatusResult } from '../core/messages/types';

// =============================================================================
// Type Mapping Functions
// Map between API types (Commit, Branch) and Store types (GitCommit, GitBranch)
// =============================================================================

function mapCommit(commit: Commit): GitCommit {
	return {
		hash: commit.sha,
		shortHash: commit.shortSha,
		message: commit.message,
		body: commit.body ?? '',
		author: {
			name: commit.author.name,
			email: commit.author.email,
			date: commit.date,
		},
		committer: {
			name: commit.author.name,
			email: commit.author.email,
			date: commit.date,
		},
		parents: commit.parents,
		refs: commit.refs.map((r) => r.name),
		isMerge: commit.parents.length > 1,
	};
}

function mapBranch(branch: Branch): GitBranch {
	return {
		name: branch.name,
		isRemote: !!branch.remote,
		isHead: branch.current,
		upstream: branch.tracking,
		ahead: branch.ahead,
		behind: branch.behind,
		lastCommitHash: branch.commit,
	};
}

function mapStash(stash: Stash): GitStash {
	return {
		index: stash.index,
		message: stash.message,
		branch: '', // Not provided in API type
		hash: stash.hash,
		date: stash.date,
	};
}

function mapStatus(status: StatusResult): GitStatus {
	return {
		staged: status.staged.map((f) => ({
			path: f.path,
			status: f.status as GitStatus['staged'][0]['status'],
			oldPath: f.oldPath,
		})),
		unstaged: status.unstaged.map((f) => ({
			path: f.path,
			status: f.status as GitStatus['unstaged'][0]['status'],
			oldPath: f.oldPath,
		})),
		untracked: status.untracked,
		conflicted: status.conflicted,
		isClean:
			status.staged.length === 0 &&
			status.unstaged.length === 0 &&
			status.untracked.length === 0,
		isMerging: false, // Would need separate check
		isRebasing: false,
		isCherryPicking: false,
	};
}

/**
 * Root component for 4MGI Git Board
 * Layout structure based on docs/04-UI-UX-DESIGN.md
 */
export const App: React.FC = () => {
	// Git state
	const loading = useGitStore((state) => state.loading);
	const error = useGitStore((state) => state.error);
	const commits = useGitStore((state) => state.commits);
	const status = useGitStore((state) => state.status);

	// Git actions
	const fetchAll = useGitStore((state) => state.fetchAll);
	const setCommits = useGitStore((state) => state.setCommits);
	const setBranches = useGitStore((state) => state.setBranches);
	const setCurrentBranch = useGitStore((state) => state.setCurrentBranch);
	const setStatus = useGitStore((state) => state.setStatus);
	const setStashes = useGitStore((state) => state.setStashes);
	const setLoading = useGitStore((state) => state.setLoading);
	const setError = useGitStore((state) => state.setError);

	// Memoized handlers to avoid re-creating on every render
	const handleGitLog = useCallback(
		(payload: Commit[]) => {
			setCommits(payload.map(mapCommit));
			setLoading(false);
		},
		[setCommits, setLoading],
	);

	const handleGitBranches = useCallback(
		(payload: Branch[]) => {
			const mappedBranches = payload.map(mapBranch);
			setBranches(mappedBranches);
			// Set current branch from the branch marked as head
			const headBranch = mappedBranches.find((b) => b.isHead && !b.isRemote);
			if (headBranch) {
				setCurrentBranch(headBranch.name);
			}
		},
		[setBranches, setCurrentBranch],
	);

	const handleGitStashes = useCallback(
		(payload: Stash[]) => {
			setStashes(payload.map(mapStash));
		},
		[setStashes],
	);

	const handleRepoStatus = useCallback(
		(payload: StatusResult) => {
			setStatus(mapStatus(payload));
		},
		[setStatus],
	);

	const handleGitChanged = useCallback(() => {
		fetchAll();
	}, [fetchAll]);

	const handleGitSuccess = useCallback(() => {
		setLoading(false);
		fetchAll();
	}, [setLoading, fetchAll]);

	const handleError = useCallback(
		(payload: { code: string; message: string }) => {
			setError(payload.message);
			setLoading(false);
		},
		[setError, setLoading],
	);

	// Setup message handler to receive data from extension
	useMessageHandler({
		dispatchers: {
			onGitLog: handleGitLog,
			onGitBranches: handleGitBranches,
			onGitStashes: handleGitStashes,
			onRepoStatus: handleRepoStatus,
			onGitChanged: handleGitChanged,
			onGitSuccess: handleGitSuccess,
			onError: handleError,
		},
	});

	// Fetch initial data on mount
	useEffect(() => {
		fetchAll();
	}, [fetchAll]);

	// Calculate unstaged/staged counts
	const unstagedCount = status
		? status.unstaged.length + status.untracked.length
		: 0;
	const stagedCount = status ? status.staged.length : 0;

	return (
		<Layout>
			{/* Diff Section (Collapsible) */}
			<section className="git-board__diff-section">
				<details className="diff-section__container" open>
					<summary className="diff-section__header">
						<span>Unstaged Changes</span>
						<span className="diff-section__count">{unstagedCount} files</span>
					</summary>
					<div className="diff-section__files">
						{unstagedCount === 0 ? (
							<p className="diff-section__empty">No changes to commit</p>
						) : (
							<p className="diff-section__empty">
								{unstagedCount} file(s) changed
							</p>
						)}
					</div>
				</details>
				{stagedCount > 0 && (
					<details className="diff-section__container">
						<summary className="diff-section__header">
							<span>Staged Changes</span>
							<span className="diff-section__count">{stagedCount} files</span>
						</summary>
						<div className="diff-section__files">
							<p className="diff-section__empty">
								{stagedCount} file(s) staged
							</p>
						</div>
					</details>
				)}
				<div className="diff-section__actions">
					<button
						type="button"
						className="action-button action-button--primary"
						disabled={stagedCount === 0}
					>
						Commit
					</button>
					<button
						type="button"
						className="action-button action-button--secondary"
					>
						Amend
					</button>
				</div>
			</section>

			{/* Graph Area */}
			<div className="graph__container">
				{loading && <p className="graph__loading">Loading git history...</p>}
				{error && <p className="graph__error">Error: {error}</p>}
				{!loading && !error && commits.length === 0 && (
					<p className="graph__empty">No commits found</p>
				)}
				{!loading && !error && commits.length > 0 && (
					<GitGraph orientation="vertical" maxCommits={100} showTooltips />
				)}
			</div>
		</Layout>
	);
};

export default App;
