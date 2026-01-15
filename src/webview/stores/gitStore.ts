import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { vscode } from '../vscodeApi';

// ============================================================================
// Types
// ============================================================================

export interface GitCommit {
	hash: string;
	shortHash: string;
	message: string;
	body: string;
	author: {
		name: string;
		email: string;
		date: string;
	};
	committer: {
		name: string;
		email: string;
		date: string;
	};
	parents: string[];
	refs: string[];
	isMerge: boolean;
}

export interface GitBranch {
	name: string;
	isRemote: boolean;
	isHead: boolean;
	upstream?: string;
	ahead?: number;
	behind?: number;
	lastCommitHash?: string;
}

export interface GitStash {
	index: number;
	message: string;
	branch: string;
	hash: string;
	date: string;
}

export interface GitStatus {
	staged: GitFileChange[];
	unstaged: GitFileChange[];
	untracked: string[];
	conflicted: string[];
	isClean: boolean;
	isMerging: boolean;
	isRebasing: boolean;
	isCherryPicking: boolean;
}

export interface GitFileChange {
	path: string;
	status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
	oldPath?: string;
	additions?: number;
	deletions?: number;
}

export interface GitRemote {
	name: string;
	fetchUrl: string;
	pushUrl: string;
}

export interface GitTag {
	name: string;
	hash: string;
	message?: string;
	tagger?: {
		name: string;
		email: string;
		date: string;
	};
	isAnnotated: boolean;
}

// ============================================================================
// State Interface
// ============================================================================

interface GitState {
	// Data
	commits: GitCommit[];
	branches: GitBranch[];
	currentBranch: string | null;
	status: GitStatus | null;
	stashes: GitStash[];
	remotes: GitRemote[];
	tags: GitTag[];

	// UI State
	selectedCommitHash: string | null;
	loading: boolean;
	error: string | null;

	// Pagination
	hasMoreCommits: boolean;
	commitOffset: number;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface GitActions {
	// Setters
	setCommits: (commits: GitCommit[]) => void;
	appendCommits: (commits: GitCommit[]) => void;
	setBranches: (branches: GitBranch[]) => void;
	setCurrentBranch: (branch: string | null) => void;
	setStatus: (status: GitStatus | null) => void;
	setStashes: (stashes: GitStash[]) => void;
	setRemotes: (remotes: GitRemote[]) => void;
	setTags: (tags: GitTag[]) => void;

	// Selection
	selectCommit: (hash: string | null) => void;

	// Loading & Error
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	// Pagination
	setHasMoreCommits: (hasMore: boolean) => void;
	setCommitOffset: (offset: number) => void;
	incrementCommitOffset: (count: number) => void;

	// Async actions - post messages to extension
	fetchCommits: (limit?: number, offset?: number) => void;
	fetchBranches: () => void;
	fetchStatus: () => void;
	fetchStashes: () => void;
	fetchAll: () => void;

	// Git operations
	checkout: (ref: string) => void;
	createBranch: (name: string, startPoint?: string) => void;
	deleteBranch: (name: string, force?: boolean) => void;
	mergeBranch: (branch: string, noFf?: boolean) => void;
	pull: (remote?: string, branch?: string) => void;
	push: (remote?: string, branch?: string, force?: boolean) => void;
	fetch: (remote?: string, prune?: boolean) => void;
	stashSave: (message?: string, includeUntracked?: boolean) => void;
	stashApply: (index?: number) => void;
	stashPop: (index?: number) => void;
	stashDrop: (index?: number) => void;
	getStashFiles: (index: number) => void;
	getStashDiff: (index: number, filePath: string) => void;
	cherryPick: (hash: string) => void;
	revert: (hash: string) => void;
	reset: (hash: string, mode: 'soft' | 'mixed' | 'hard') => void;

	// Drag operations
	rebaseViaDrag: (targetBranch: string, sourceBranch?: string) => void;
	cherryPickViaDrag: (commitHash: string, targetBranch?: string) => void;

	// Undo/Redo
	undo: () => void;
	redo: () => void;
	getUndoRedoState: () => void;

	// Reset store
	resetStore: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: GitState = {
	commits: [],
	branches: [],
	currentBranch: null,
	status: null,
	stashes: [],
	remotes: [],
	tags: [],
	selectedCommitHash: null,
	loading: false,
	error: null,
	hasMoreCommits: true,
	commitOffset: 0,
};

// ============================================================================
// VS Code API Helper
// ============================================================================

function postMessage(type: string, payload?: Record<string, unknown>) {
	if (vscode) {
		vscode.postMessage({ type, ...payload });
	} else {
		console.warn(
			'[GitStore] VS Code API not available, message not sent:',
			type,
		);
	}
}

// ============================================================================
// Store
// ============================================================================

export const useGitStore = create<GitState & GitActions>()(
	devtools(
		immer((set, get) => ({
			...initialState,

			// Setters
			setCommits: (commits) =>
				set((state) => {
					state.commits = commits;
					state.commitOffset = commits.length;
				}),

			appendCommits: (commits) =>
				set((state) => {
					state.commits.push(...commits);
					state.commitOffset = state.commits.length;
				}),

			setBranches: (branches) =>
				set((state) => {
					state.branches = branches;
				}),

			setCurrentBranch: (branch) =>
				set((state) => {
					state.currentBranch = branch;
				}),

			setStatus: (status) =>
				set((state) => {
					state.status = status;
				}),

			setStashes: (stashes) =>
				set((state) => {
					state.stashes = stashes;
				}),

			setRemotes: (remotes) =>
				set((state) => {
					state.remotes = remotes;
				}),

			setTags: (tags) =>
				set((state) => {
					state.tags = tags;
				}),

			// Selection
			selectCommit: (hash) =>
				set((state) => {
					state.selectedCommitHash = hash;
				}),

			// Loading & Error
			setLoading: (loading) =>
				set((state) => {
					state.loading = loading;
				}),

			setError: (error) =>
				set((state) => {
					state.error = error;
					state.loading = false;
				}),

			clearError: () =>
				set((state) => {
					state.error = null;
				}),

			// Pagination
			setHasMoreCommits: (hasMore) =>
				set((state) => {
					state.hasMoreCommits = hasMore;
				}),

			setCommitOffset: (offset) =>
				set((state) => {
					state.commitOffset = offset;
				}),

			incrementCommitOffset: (count) =>
				set((state) => {
					state.commitOffset += count;
				}),

			// Async actions
			fetchCommits: (limit = 100, offset = 0) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.getCommits', { limit, offset });
			},

			fetchBranches: () => {
				postMessage('git.getBranches');
			},

			fetchStatus: () => {
				postMessage('git.getStatus');
			},

			fetchStashes: () => {
				postMessage('git.getStashes');
			},

			fetchAll: () => {
				const state = get();
				state.fetchCommits();
				state.fetchBranches();
				state.fetchStatus();
				state.fetchStashes();
			},

			// Git operations
			checkout: (ref) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.checkout', { ref });
			},

			createBranch: (name, startPoint) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.createBranch', { name, startPoint });
			},

			deleteBranch: (name, force = false) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.deleteBranch', { name, force });
			},

			mergeBranch: (branch, noFf = false) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.merge', { branch, noFf });
			},

			pull: (remote, branch) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.pull', { remote, branch });
			},

			push: (remote, branch, force = false) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.push', { remote, branch, force });
			},

			fetch: (remote, prune = false) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.fetch', { remote, prune });
			},

			stashSave: (message, includeUntracked = false) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.stashSave', { message, includeUntracked });
			},

			stashApply: (index = 0) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.stashApply', { index });
			},

			stashPop: (index = 0) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.stashPop', { index });
			},

			stashDrop: (index = 0) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.stashDrop', { index });
			},

			getStashFiles: (index) => {
				postMessage('git.getStashFiles', { index });
			},

			getStashDiff: (index, filePath) => {
				postMessage('git.getStashDiff', { index, filePath });
			},

			cherryPick: (hash) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.cherryPick', { hash });
			},

			revert: (hash) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.revert', { hash });
			},

			reset: (hash, mode) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.reset', { hash, mode });
			},

			// Drag operations
			rebaseViaDrag: (targetBranch, sourceBranch) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.rebaseViaDrag', { targetBranch, sourceBranch });
			},

			cherryPickViaDrag: (commitHash, targetBranch) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.cherryPickViaDrag', { commitHash, targetBranch });
			},

			// Undo/Redo
			undo: () => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.undo');
			},

			redo: () => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.redo');
			},

			getUndoRedoState: () => {
				postMessage('git.getUndoRedoState');
			},

			// Reset
			resetStore: () => set(() => initialState),
		})),
		{ name: 'git-store' },
	),
);

// ============================================================================
// Selectors
// ============================================================================

export const selectCommits = (state: GitState) => state.commits;
export const selectBranches = (state: GitState) => state.branches;
export const selectCurrentBranch = (state: GitState) => state.currentBranch;
export const selectStatus = (state: GitState) => state.status;
export const selectStashes = (state: GitState) => state.stashes;
export const selectSelectedCommit = (state: GitState) =>
	state.commits.find((c) => c.hash === state.selectedCommitHash) ?? null;
export const selectIsLoading = (state: GitState) => state.loading;
export const selectError = (state: GitState) => state.error;
export const selectLocalBranches = (state: GitState) =>
	state.branches.filter((b) => !b.isRemote);
export const selectRemoteBranches = (state: GitState) =>
	state.branches.filter((b) => b.isRemote);
export const selectHasChanges = (state: GitState) =>
	state.status ? !state.status.isClean : false;
