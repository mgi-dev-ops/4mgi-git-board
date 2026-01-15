import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type RebaseAction =
	| 'pick'
	| 'reword'
	| 'edit'
	| 'squash'
	| 'fixup'
	| 'drop';

export interface RebaseCommit {
	hash: string;
	shortHash: string;
	message: string;
	author: string;
	date: string;
	action: RebaseAction;
	originalIndex: number;
}

export interface RebasePlan {
	commits: RebaseCommit[];
	onto: string; // Base commit/branch
	branch: string; // Current branch being rebased
}

export interface ConflictFile {
	path: string;
	status: 'unresolved' | 'resolved' | 'ours' | 'theirs';
	oursContent?: string;
	theirsContent?: string;
	mergedContent?: string;
}

export interface RebaseConflict {
	currentCommit: RebaseCommit;
	files: ConflictFile[];
	message?: string;
}

export type RebaseStage =
	| 'idle'
	| 'planning' // User is editing the rebase plan
	| 'executing' // Rebase is in progress
	| 'paused' // Paused for edit action
	| 'conflicted' // Merge conflicts need resolution
	| 'completed' // Rebase finished successfully
	| 'aborted'; // Rebase was aborted

// ============================================================================
// State Interface
// ============================================================================

interface RebaseState {
	// Rebase status
	isRebasing: boolean;
	stage: RebaseStage;

	// Rebase plan
	rebasePlan: RebasePlan | null;
	originalPlan: RebasePlan | null; // For comparison/reset

	// Progress
	currentStep: number;
	totalSteps: number;
	processedCommits: string[]; // Hashes of completed commits

	// Conflicts
	conflicts: RebaseConflict | null;
	hasUnresolvedConflicts: boolean;

	// Interactive edit mode
	editingCommitHash: string | null;
	amendedMessage: string | null;

	// UI state
	showRebaseDialog: boolean;
	selectedCommitIndex: number | null;
	draggedCommitIndex: number | null;

	// Loading & Error
	loading: boolean;
	error: string | null;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface RebaseActions {
	// Plan management
	initRebasePlan: (
		commits: RebaseCommit[],
		onto: string,
		branch: string,
	) => void;
	setRebasePlan: (plan: RebasePlan | null) => void;
	resetPlanToOriginal: () => void;
	clearPlan: () => void;

	// Commit actions
	setCommitAction: (index: number, action: RebaseAction) => void;
	setAllCommitsAction: (action: RebaseAction) => void;
	rewordCommit: (index: number, newMessage: string) => void;

	// Reorder commits
	moveCommit: (fromIndex: number, toIndex: number) => void;
	swapCommits: (index1: number, index2: number) => void;
	moveCommitUp: (index: number) => void;
	moveCommitDown: (index: number) => void;

	// Rebase execution
	startRebase: () => void;
	continueRebase: () => void;
	skipCommit: () => void;
	abortRebase: () => void;
	completeRebase: () => void;

	// Stage management
	setStage: (stage: RebaseStage) => void;
	setIsRebasing: (isRebasing: boolean) => void;

	// Progress
	setCurrentStep: (step: number) => void;
	setTotalSteps: (total: number) => void;
	markCommitProcessed: (hash: string) => void;
	resetProgress: () => void;

	// Conflict handling
	setConflicts: (conflicts: RebaseConflict | null) => void;
	resolveConflictFile: (
		path: string,
		resolution: 'ours' | 'theirs' | 'merged',
		content?: string,
	) => void;
	markFileResolved: (path: string) => void;
	markAllFilesResolved: () => void;
	checkUnresolvedConflicts: () => boolean;

	// Edit mode
	setEditingCommit: (hash: string | null) => void;
	setAmendedMessage: (message: string | null) => void;
	amendCurrentCommit: (message: string) => void;

	// UI
	setShowRebaseDialog: (show: boolean) => void;
	selectCommit: (index: number | null) => void;
	setDraggedCommit: (index: number | null) => void;

	// Loading & Error
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	// Validation
	validatePlan: () => { valid: boolean; errors: string[] };
	canStartRebase: () => boolean;
	canContinueRebase: () => boolean;

	// Async actions - post messages to extension
	fetchRebaseStatus: () => void;
	executeRebasePlan: (plan: RebasePlan) => void;

	// Reset
	resetStore: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: RebaseState = {
	isRebasing: false,
	stage: 'idle',
	rebasePlan: null,
	originalPlan: null,
	currentStep: 0,
	totalSteps: 0,
	processedCommits: [],
	conflicts: null,
	hasUnresolvedConflicts: false,
	editingCommitHash: null,
	amendedMessage: null,
	showRebaseDialog: false,
	selectedCommitIndex: null,
	draggedCommitIndex: null,
	loading: false,
	error: null,
};

// ============================================================================
// VS Code API Helper
// ============================================================================

declare function acquireVsCodeApi(): {
	postMessage: (message: unknown) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | null = null;

function getVsCodeApi() {
	if (!vscodeApi && typeof acquireVsCodeApi !== 'undefined') {
		vscodeApi = acquireVsCodeApi();
	}
	return vscodeApi;
}

function postMessage(type: string, payload?: Record<string, unknown>) {
	const api = getVsCodeApi();
	if (api) {
		api.postMessage({ type, ...payload });
	} else {
		console.warn(
			'[RebaseStore] VS Code API not available, message not sent:',
			type,
		);
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

function deepClonePlan(plan: RebasePlan): RebasePlan {
	return {
		commits: plan.commits.map((c) => ({ ...c })),
		onto: plan.onto,
		branch: plan.branch,
	};
}

// ============================================================================
// Store
// ============================================================================

export const useRebaseStore = create<RebaseState & RebaseActions>()(
	devtools(
		immer((set, get) => ({
			...initialState,

			// Plan management
			initRebasePlan: (commits, onto, branch) =>
				set((state) => {
					const plan: RebasePlan = { commits, onto, branch };
					state.rebasePlan = plan;
					state.originalPlan = deepClonePlan(plan);
					state.stage = 'planning';
					state.totalSteps = commits.length;
					state.currentStep = 0;
					state.showRebaseDialog = true;
				}),

			setRebasePlan: (plan) =>
				set((state) => {
					state.rebasePlan = plan;
					if (plan) {
						state.totalSteps = plan.commits.length;
					}
				}),

			resetPlanToOriginal: () =>
				set((state) => {
					if (state.originalPlan) {
						state.rebasePlan = deepClonePlan(state.originalPlan);
					}
				}),

			clearPlan: () =>
				set((state) => {
					state.rebasePlan = null;
					state.originalPlan = null;
					state.stage = 'idle';
				}),

			// Commit actions
			setCommitAction: (index, action) =>
				set((state) => {
					if (
						state.rebasePlan &&
						index >= 0 &&
						index < state.rebasePlan.commits.length
					) {
						state.rebasePlan.commits[index].action = action;
					}
				}),

			setAllCommitsAction: (action) =>
				set((state) => {
					if (state.rebasePlan) {
						state.rebasePlan.commits.forEach((c) => {
							c.action = action;
						});
					}
				}),

			rewordCommit: (index, newMessage) =>
				set((state) => {
					if (
						state.rebasePlan &&
						index >= 0 &&
						index < state.rebasePlan.commits.length
					) {
						state.rebasePlan.commits[index].message = newMessage;
						state.rebasePlan.commits[index].action = 'reword';
					}
				}),

			// Reorder commits
			moveCommit: (fromIndex, toIndex) =>
				set((state) => {
					if (!state.rebasePlan) return;
					const commits = state.rebasePlan.commits;
					if (fromIndex < 0 || fromIndex >= commits.length) return;
					if (toIndex < 0 || toIndex >= commits.length) return;
					if (fromIndex === toIndex) return;

					const [removed] = commits.splice(fromIndex, 1);
					commits.splice(toIndex, 0, removed);
				}),

			swapCommits: (index1, index2) =>
				set((state) => {
					if (!state.rebasePlan) return;
					const commits = state.rebasePlan.commits;
					if (index1 < 0 || index1 >= commits.length) return;
					if (index2 < 0 || index2 >= commits.length) return;

					[commits[index1], commits[index2]] = [
						commits[index2],
						commits[index1],
					];
				}),

			moveCommitUp: (index) => {
				if (index > 0) {
					get().swapCommits(index, index - 1);
				}
			},

			moveCommitDown: (index) => {
				const plan = get().rebasePlan;
				if (plan && index < plan.commits.length - 1) {
					get().swapCommits(index, index + 1);
				}
			},

			// Rebase execution
			startRebase: () => {
				const state = get();
				if (!state.canStartRebase()) {
					set((s) => {
						s.error = 'Cannot start rebase: invalid plan or already rebasing';
					});
					return;
				}
				set((s) => {
					s.loading = true;
					s.stage = 'executing';
					s.isRebasing = true;
				});
				postMessage('git.startRebase', { plan: state.rebasePlan });
			},

			continueRebase: () => {
				const state = get();
				if (!state.canContinueRebase()) {
					set((s) => {
						s.error = 'Cannot continue rebase: unresolved conflicts';
					});
					return;
				}
				set((s) => {
					s.loading = true;
					s.stage = 'executing';
				});
				postMessage('git.continueRebase');
			},

			skipCommit: () => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.skipRebaseCommit');
			},

			abortRebase: () => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.abortRebase');
			},

			completeRebase: () =>
				set((state) => {
					state.isRebasing = false;
					state.stage = 'completed';
					state.loading = false;
					state.conflicts = null;
					state.hasUnresolvedConflicts = false;
				}),

			// Stage management
			setStage: (stage) =>
				set((state) => {
					state.stage = stage;
					if (
						stage === 'idle' ||
						stage === 'completed' ||
						stage === 'aborted'
					) {
						state.isRebasing = false;
					}
				}),

			setIsRebasing: (isRebasing) =>
				set((state) => {
					state.isRebasing = isRebasing;
				}),

			// Progress
			setCurrentStep: (step) =>
				set((state) => {
					state.currentStep = step;
				}),

			setTotalSteps: (total) =>
				set((state) => {
					state.totalSteps = total;
				}),

			markCommitProcessed: (hash) =>
				set((state) => {
					if (!state.processedCommits.includes(hash)) {
						state.processedCommits.push(hash);
						state.currentStep = state.processedCommits.length;
					}
				}),

			resetProgress: () =>
				set((state) => {
					state.currentStep = 0;
					state.processedCommits = [];
				}),

			// Conflict handling
			setConflicts: (conflicts) =>
				set((state) => {
					state.conflicts = conflicts;
					state.hasUnresolvedConflicts = conflicts
						? conflicts.files.some((f) => f.status === 'unresolved')
						: false;
					if (conflicts) {
						state.stage = 'conflicted';
					}
				}),

			resolveConflictFile: (path, resolution, content) =>
				set((state) => {
					if (!state.conflicts) return;
					const file = state.conflicts.files.find((f) => f.path === path);
					if (file) {
						file.status = resolution === 'merged' ? 'resolved' : resolution;
						if (content !== undefined) {
							file.mergedContent = content;
						}
					}
					state.hasUnresolvedConflicts = state.conflicts.files.some(
						(f) => f.status === 'unresolved',
					);
				}),

			markFileResolved: (path) =>
				set((state) => {
					if (!state.conflicts) return;
					const file = state.conflicts.files.find((f) => f.path === path);
					if (file) {
						file.status = 'resolved';
					}
					state.hasUnresolvedConflicts = state.conflicts.files.some(
						(f) => f.status === 'unresolved',
					);
				}),

			markAllFilesResolved: () =>
				set((state) => {
					if (!state.conflicts) return;
					state.conflicts.files.forEach((f) => {
						f.status = 'resolved';
					});
					state.hasUnresolvedConflicts = false;
				}),

			checkUnresolvedConflicts: () => {
				const { conflicts } = get();
				return conflicts
					? conflicts.files.some((f) => f.status === 'unresolved')
					: false;
			},

			// Edit mode
			setEditingCommit: (hash) =>
				set((state) => {
					state.editingCommitHash = hash;
					if (hash) {
						state.stage = 'paused';
					}
				}),

			setAmendedMessage: (message) =>
				set((state) => {
					state.amendedMessage = message;
				}),

			amendCurrentCommit: (message) => {
				set((state) => {
					state.loading = true;
				});
				postMessage('git.amendCommit', { message });
			},

			// UI
			setShowRebaseDialog: (show) =>
				set((state) => {
					state.showRebaseDialog = show;
				}),

			selectCommit: (index) =>
				set((state) => {
					state.selectedCommitIndex = index;
				}),

			setDraggedCommit: (index) =>
				set((state) => {
					state.draggedCommitIndex = index;
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

			// Validation
			validatePlan: () => {
				const { rebasePlan } = get();
				const errors: string[] = [];

				if (!rebasePlan) {
					return { valid: false, errors: ['No rebase plan'] };
				}

				if (rebasePlan.commits.length === 0) {
					errors.push('No commits in rebase plan');
				}

				// Check for consecutive squash/fixup without a pick
				let hasPickBefore = false;
				for (const commit of rebasePlan.commits) {
					if (
						commit.action === 'pick' ||
						commit.action === 'reword' ||
						commit.action === 'edit'
					) {
						hasPickBefore = true;
					} else if (
						(commit.action === 'squash' || commit.action === 'fixup') &&
						!hasPickBefore
					) {
						errors.push(
							'Squash/fixup must follow a pick, reword, or edit action',
						);
						break;
					}
				}

				// Check if all commits are dropped
				const allDropped = rebasePlan.commits.every((c) => c.action === 'drop');
				if (allDropped && rebasePlan.commits.length > 0) {
					errors.push('Cannot drop all commits');
				}

				return { valid: errors.length === 0, errors };
			},

			canStartRebase: () => {
				const state = get();
				if (state.isRebasing) return false;
				if (!state.rebasePlan) return false;
				const { valid } = state.validatePlan();
				return valid;
			},

			canContinueRebase: () => {
				const state = get();
				if (!state.isRebasing) return false;
				if (state.hasUnresolvedConflicts) return false;
				return true;
			},

			// Async actions
			fetchRebaseStatus: () => {
				postMessage('git.getRebaseStatus');
			},

			executeRebasePlan: (plan) => {
				set((state) => {
					state.loading = true;
					state.stage = 'executing';
					state.isRebasing = true;
				});
				postMessage('git.executeRebasePlan', {
					plan: plan as unknown as Record<string, unknown>,
				});
			},

			// Reset
			resetStore: () => set(() => initialState),
		})),
		{ name: 'rebase-store' },
	),
);

// ============================================================================
// Selectors
// ============================================================================

export const selectRebasePlan = (state: RebaseState) => state.rebasePlan;
export const selectIsRebasing = (state: RebaseState) => state.isRebasing;
export const selectRebaseStage = (state: RebaseState) => state.stage;
export const selectCurrentStep = (state: RebaseState) => state.currentStep;
export const selectTotalSteps = (state: RebaseState) => state.totalSteps;
export const selectProgress = (state: RebaseState) =>
	state.totalSteps > 0 ? (state.currentStep / state.totalSteps) * 100 : 0;
export const selectConflicts = (state: RebaseState) => state.conflicts;
export const selectHasConflicts = (state: RebaseState) =>
	state.hasUnresolvedConflicts;
export const selectCommitByIndex = (index: number) => (state: RebaseState) =>
	state.rebasePlan?.commits[index] ?? null;
export const selectShowRebaseDialog = (state: RebaseState) =>
	state.showRebaseDialog;
export const selectRebaseError = (state: RebaseState) => state.error;
