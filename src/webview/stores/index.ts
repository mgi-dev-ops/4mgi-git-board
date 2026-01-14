/**
 * 4MGI Git Board - Zustand Stores
 *
 * Central export file for all Zustand stores.
 * Each store manages a specific domain of the application state.
 */

// ============================================================================
// Store Exports
// ============================================================================

export {
  useGitStore,
  // Types
  type GitCommit,
  type GitBranch,
  type GitStash,
  type GitStatus,
  type GitFileChange,
  type GitRemote,
  type GitTag,
  // Selectors
  selectCommits,
  selectBranches,
  selectCurrentBranch,
  selectStatus,
  selectStashes,
  selectSelectedCommit,
  selectIsLoading,
  selectError,
  selectLocalBranches,
  selectRemoteBranches,
  selectHasChanges,
} from './gitStore';

export {
  useUIStore,
  // Types
  type ViewMode,
  type ThemeMode,
  type SortOrder,
  type DateRange,
  type FilterState,
  type PanPosition,
  type ViewportState,
  type PanelState,
  type GraphSettings,
  type UINotification,
  // Selectors
  selectViewMode,
  selectTheme,
  selectZoom,
  selectPan,
  selectFilters,
  selectPanels,
  selectGraphSettings,
  selectIsSidebarOpen,
  selectIsDetailPanelOpen,
  selectActiveModal,
  selectNotifications,
} from './uiStore';

export {
  useAzureStore,
  // Types
  type PullRequestStatus,
  type PullRequestVoteStatus,
  type BuildStatus,
  type WorkItemState,
  type AzureIdentity,
  type PullRequest,
  type PullRequestReviewer,
  type PullRequestLabel,
  type PullRequestCompletionOptions,
  type WorkItem,
  type WorkItemReference,
  type BranchPolicy,
  type BranchPolicyType,
  type BuildValidation,
  type PolicyEvaluation,
  type CommitWorkItemLink,
  type CreatePROptions,
  // Selectors
  selectPullRequests,
  selectActivePullRequests,
  selectSelectedPullRequest,
  selectWorkItems,
  selectPolicies,
  selectIsAuthenticated,
  selectCurrentUser,
  selectPRsForBranch,
  selectPolicyEvaluationsForPR,
  selectBuildStatusesForPR,
} from './azureStore';

export {
  useRebaseStore,
  // Types
  type RebaseAction,
  type RebaseCommit,
  type RebasePlan,
  type ConflictFile,
  type RebaseConflict,
  type RebaseStage,
  // Selectors
  selectRebasePlan,
  selectIsRebasing,
  selectRebaseStage,
  selectCurrentStep,
  selectTotalSteps,
  selectProgress,
  selectConflicts,
  selectHasConflicts,
  selectCommitByIndex,
  selectShowRebaseDialog,
  selectRebaseError,
} from './rebaseStore';

// ============================================================================
// Combined Hooks
// ============================================================================

import { useGitStore } from './gitStore';
import { useUIStore } from './uiStore';
import { useAzureStore } from './azureStore';
import { useRebaseStore } from './rebaseStore';

/**
 * Hook to get selected commit with full details
 */
export function useSelectedCommit() {
  const selectedHash = useUIStore((state) => state.selectedCommitHash);
  const commits = useGitStore((state) => state.commits);

  if (!selectedHash) return null;
  return commits.find((c) => c.hash === selectedHash) ?? null;
}

/**
 * Hook to get current branch info
 */
export function useCurrentBranch() {
  const currentBranchName = useGitStore((state) => state.currentBranch);
  const branches = useGitStore((state) => state.branches);

  if (!currentBranchName) return null;
  return branches.find((b) => b.name === currentBranchName && !b.isRemote) ?? null;
}

/**
 * Hook to get PRs for current branch
 */
export function usePRsForCurrentBranch() {
  const currentBranch = useGitStore((state) => state.currentBranch);
  const pullRequests = useAzureStore((state) => state.pullRequests);

  if (!currentBranch) return [];
  return pullRequests.filter(
    (pr) => pr.sourceRefName === `refs/heads/${currentBranch}`
  );
}

/**
 * Hook to check if any async operation is loading
 */
export function useIsAnyLoading() {
  const gitLoading = useGitStore((state) => state.loading);
  const azureLoading = useAzureStore((state) => state.loading);
  const rebaseLoading = useRebaseStore((state) => state.loading);

  return gitLoading || azureLoading || rebaseLoading;
}

/**
 * Hook to get all errors from stores
 */
export function useAllErrors() {
  const gitError = useGitStore((state) => state.error);
  const azureError = useAzureStore((state) => state.error);
  const rebaseError = useRebaseStore((state) => state.error);

  return {
    git: gitError,
    azure: azureError,
    rebase: rebaseError,
    hasAnyError: !!(gitError || azureError || rebaseError),
  };
}

/**
 * Hook to reset all stores
 */
export function useResetAllStores() {
  const resetGit = useGitStore((state) => state.resetStore);
  const resetUI = useUIStore((state) => state.resetStore);
  const resetAzure = useAzureStore((state) => state.resetStore);
  const resetRebase = useRebaseStore((state) => state.resetStore);

  return () => {
    resetGit();
    resetUI();
    resetAzure();
    resetRebase();
  };
}

/**
 * Hook for commit selection with multi-select support
 */
export function useCommitSelection() {
  const selectedCommitHash = useUIStore((state) => state.selectedCommitHash);
  const multiSelectedCommits = useUIStore((state) => state.multiSelectedCommits);
  const selectCommit = useUIStore((state) => state.selectCommit);
  const toggleCommitSelection = useUIStore((state) => state.toggleCommitSelection);
  const clearMultiSelection = useUIStore((state) => state.clearMultiSelection);
  const selectCommitRange = useUIStore((state) => state.selectCommitRange);
  const commits = useGitStore((state) => state.commits);

  return {
    selectedCommitHash,
    multiSelectedCommits,
    hasMultiSelection: multiSelectedCommits.length > 1,
    selectCommit,
    toggleCommitSelection,
    clearMultiSelection,
    selectRange: (startHash: string, endHash: string) => {
      selectCommitRange(startHash, endHash, commits.map((c) => c.hash));
    },
  };
}

/**
 * Hook for viewport controls
 */
export function useViewportControls() {
  const zoom = useUIStore((state) => state.viewport.zoom);
  const pan = useUIStore((state) => state.viewport.pan);
  const setZoom = useUIStore((state) => state.setZoom);
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);
  const resetZoom = useUIStore((state) => state.resetZoom);
  const setPan = useUIStore((state) => state.setPan);
  const panBy = useUIStore((state) => state.panBy);
  const resetViewport = useUIStore((state) => state.resetViewport);

  return {
    zoom,
    pan,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
    panBy,
    resetViewport,
  };
}

/**
 * Hook for filter controls
 */
export function useFilterControls() {
  const filters = useUIStore((state) => state.filters);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);
  const setAuthorFilter = useUIStore((state) => state.setAuthorFilter);
  const setDateRange = useUIStore((state) => state.setDateRange);
  const setBranchFilter = useUIStore((state) => state.setBranchFilter);
  const toggleShowMergeCommits = useUIStore((state) => state.toggleShowMergeCommits);
  const setFilePathPattern = useUIStore((state) => state.setFilePathPattern);
  const clearFilters = useUIStore((state) => state.clearFilters);
  const hasActiveFilters = useUIStore((state) => state.hasActiveFilters);

  return {
    filters,
    setSearchQuery,
    setAuthorFilter,
    setDateRange,
    setBranchFilter,
    toggleShowMergeCommits,
    setFilePathPattern,
    clearFilters,
    hasActiveFilters,
  };
}

/**
 * Hook for rebase controls
 */
export function useRebaseControls() {
  const isRebasing = useRebaseStore((state) => state.isRebasing);
  const stage = useRebaseStore((state) => state.stage);
  const plan = useRebaseStore((state) => state.rebasePlan);
  const conflicts = useRebaseStore((state) => state.conflicts);
  const currentStep = useRebaseStore((state) => state.currentStep);
  const totalSteps = useRebaseStore((state) => state.totalSteps);

  const initRebasePlan = useRebaseStore((state) => state.initRebasePlan);
  const setCommitAction = useRebaseStore((state) => state.setCommitAction);
  const moveCommit = useRebaseStore((state) => state.moveCommit);
  const startRebase = useRebaseStore((state) => state.startRebase);
  const continueRebase = useRebaseStore((state) => state.continueRebase);
  const abortRebase = useRebaseStore((state) => state.abortRebase);
  const skipCommit = useRebaseStore((state) => state.skipCommit);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return {
    isRebasing,
    stage,
    plan,
    conflicts,
    currentStep,
    totalSteps,
    progress,
    initRebasePlan,
    setCommitAction,
    moveCommit,
    startRebase,
    continueRebase,
    abortRebase,
    skipCommit,
  };
}
