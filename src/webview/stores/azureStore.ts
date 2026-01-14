import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type PullRequestStatus = 'active' | 'completed' | 'abandoned' | 'all';
export type PullRequestVoteStatus = 'approved' | 'approvedWithSuggestions' | 'waitingForAuthor' | 'rejected' | 'noVote';
export type BuildStatus = 'succeeded' | 'failed' | 'inProgress' | 'notStarted' | 'canceled' | 'partiallySucceeded';
export type WorkItemState = 'New' | 'Active' | 'Resolved' | 'Closed' | 'Removed';

export interface AzureIdentity {
  id: string;
  displayName: string;
  uniqueName: string;
  imageUrl?: string;
}

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  status: PullRequestStatus;
  createdBy: AzureIdentity;
  creationDate: string;
  closedDate?: string;
  sourceRefName: string;
  targetRefName: string;
  mergeStatus: 'succeeded' | 'conflicts' | 'queued' | 'notSet' | 'rejectedByPolicy';
  isDraft: boolean;
  url: string;
  webUrl: string;
  reviewers: PullRequestReviewer[];
  workItemRefs: WorkItemReference[];
  labels: PullRequestLabel[];
  autoCompleteSetBy?: AzureIdentity;
  completionOptions?: PullRequestCompletionOptions;
}

export interface PullRequestReviewer {
  id: string;
  displayName: string;
  uniqueName: string;
  imageUrl?: string;
  vote: number; // -10 to 10
  voteStatus: PullRequestVoteStatus;
  isRequired: boolean;
  hasDeclined: boolean;
}

export interface PullRequestLabel {
  id: string;
  name: string;
  active: boolean;
}

export interface PullRequestCompletionOptions {
  deleteSourceBranch: boolean;
  squashMerge: boolean;
  mergeCommitMessage?: string;
  bypassPolicy: boolean;
  transitionWorkItems: boolean;
}

export interface WorkItem {
  id: number;
  type: string; // Bug, Task, User Story, Feature, Epic, etc.
  title: string;
  state: WorkItemState;
  assignedTo?: AzureIdentity;
  createdDate: string;
  changedDate: string;
  areaPath: string;
  iterationPath: string;
  tags: string[];
  url: string;
  webUrl: string;
  priority?: number;
  storyPoints?: number;
  description?: string;
  acceptanceCriteria?: string;
  parentId?: number;
  childIds?: number[];
}

export interface WorkItemReference {
  id: number;
  url: string;
}

export interface BranchPolicy {
  id: number;
  type: BranchPolicyType;
  isEnabled: boolean;
  isBlocking: boolean;
  settings: Record<string, unknown>;
  displayName: string;
}

export type BranchPolicyType =
  | 'minimumApprovers'
  | 'workItemLinking'
  | 'commentRequirements'
  | 'buildValidation'
  | 'statusCheck'
  | 'mergeStrategy'
  | 'requiredReviewers';

export interface BuildValidation {
  id: number;
  buildDefinitionId: number;
  buildDefinitionName: string;
  status: BuildStatus;
  queueTime?: string;
  startTime?: string;
  finishTime?: string;
  result?: string;
  url: string;
  sourceBranch: string;
  sourceVersion: string;
}

export interface PolicyEvaluation {
  policyId: number;
  policyType: BranchPolicyType;
  displayName: string;
  status: 'approved' | 'rejected' | 'running' | 'queued' | 'notApplicable' | 'broken';
  isBlocking: boolean;
  context?: Record<string, unknown>;
}

export interface CommitWorkItemLink {
  commitHash: string;
  workItemId: number;
}

// ============================================================================
// State Interface
// ============================================================================

interface AzureState {
  // Authentication
  authenticated: boolean;
  currentUser: AzureIdentity | null;
  organization: string | null;
  project: string | null;
  repository: string | null;

  // Pull Requests
  pullRequests: PullRequest[];
  selectedPullRequestId: number | null;
  prLoading: boolean;
  prError: string | null;

  // Work Items
  workItems: WorkItem[];
  workItemsLoading: boolean;
  workItemsError: string | null;

  // Policies
  policies: BranchPolicy[];
  policyEvaluations: Map<number, PolicyEvaluation[]>; // PR ID -> evaluations
  policiesLoading: boolean;

  // Build Status
  buildStatuses: Map<number, BuildValidation[]>; // PR ID -> builds
  buildsLoading: boolean;

  // Commit-WorkItem Links
  commitWorkItemLinks: CommitWorkItemLink[];

  // Global loading/error
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface AzureActions {
  // Authentication
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentUser: (user: AzureIdentity | null) => void;
  setOrganization: (org: string | null) => void;
  setProject: (project: string | null) => void;
  setRepository: (repo: string | null) => void;

  // Pull Requests
  setPullRequests: (prs: PullRequest[]) => void;
  addPullRequest: (pr: PullRequest) => void;
  updatePullRequest: (pr: PullRequest) => void;
  removePullRequest: (id: number) => void;
  selectPullRequest: (id: number | null) => void;
  setPRLoading: (loading: boolean) => void;
  setPRError: (error: string | null) => void;

  // Work Items
  setWorkItems: (items: WorkItem[]) => void;
  addWorkItem: (item: WorkItem) => void;
  updateWorkItem: (item: WorkItem) => void;
  setWorkItemsLoading: (loading: boolean) => void;
  setWorkItemsError: (error: string | null) => void;

  // Policies
  setPolicies: (policies: BranchPolicy[]) => void;
  setPolicyEvaluations: (prId: number, evaluations: PolicyEvaluation[]) => void;
  setPoliciesLoading: (loading: boolean) => void;

  // Build Status
  setBuildStatuses: (prId: number, builds: BuildValidation[]) => void;
  updateBuildStatus: (prId: number, build: BuildValidation) => void;
  setBuildsLoading: (loading: boolean) => void;

  // Commit-WorkItem Links
  setCommitWorkItemLinks: (links: CommitWorkItemLink[]) => void;
  linkCommitToWorkItem: (commitHash: string, workItemId: number) => void;
  unlinkCommitFromWorkItem: (commitHash: string, workItemId: number) => void;
  getWorkItemsForCommit: (commitHash: string) => number[];

  // Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Async actions - post messages to extension
  fetchPullRequests: (status?: PullRequestStatus) => void;
  fetchWorkItems: (ids?: number[]) => void;
  fetchPolicies: (branch?: string) => void;
  fetchPolicyEvaluations: (prId: number) => void;
  fetchBuildStatuses: (prId: number) => void;
  fetchCommitWorkItemLinks: (commitHash: string) => void;

  // PR operations
  createPullRequest: (options: CreatePROptions) => void;
  approvePullRequest: (prId: number) => void;
  rejectPullRequest: (prId: number) => void;
  completePullRequest: (prId: number, options?: PullRequestCompletionOptions) => void;
  abandonPullRequest: (prId: number) => void;
  addPRComment: (prId: number, content: string, threadId?: number) => void;
  addPRReviewer: (prId: number, reviewerId: string, isRequired?: boolean) => void;

  // Work Item operations
  createWorkItemLink: (commitHash: string, workItemId: number) => void;
  removeWorkItemLink: (commitHash: string, workItemId: number) => void;

  // Build operations
  triggerRebuild: (definitionId: number, branch: string) => void;
  fetchBuilds: (branch?: string) => void;
  fetchBuildDetails: (commitSha: string) => void;

  // Reset
  resetStore: () => void;
}

export interface CreatePROptions {
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  isDraft?: boolean;
  workItemIds?: number[];
  reviewerIds?: string[];
  autoComplete?: boolean;
  deleteSourceBranch?: boolean;
  squashMerge?: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AzureState = {
  authenticated: false,
  currentUser: null,
  organization: null,
  project: null,
  repository: null,
  pullRequests: [],
  selectedPullRequestId: null,
  prLoading: false,
  prError: null,
  workItems: [],
  workItemsLoading: false,
  workItemsError: null,
  policies: [],
  policyEvaluations: new Map(),
  policiesLoading: false,
  buildStatuses: new Map(),
  buildsLoading: false,
  commitWorkItemLinks: [],
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
    console.warn('[AzureStore] VS Code API not available, message not sent:', type);
  }
}

// ============================================================================
// Store
// ============================================================================

export const useAzureStore = create<AzureState & AzureActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Authentication
      setAuthenticated: (authenticated) => set((state) => {
        state.authenticated = authenticated;
      }),

      setCurrentUser: (user) => set((state) => {
        state.currentUser = user;
      }),

      setOrganization: (org) => set((state) => {
        state.organization = org;
      }),

      setProject: (project) => set((state) => {
        state.project = project;
      }),

      setRepository: (repo) => set((state) => {
        state.repository = repo;
      }),

      // Pull Requests
      setPullRequests: (prs) => set((state) => {
        state.pullRequests = prs;
        state.prLoading = false;
      }),

      addPullRequest: (pr) => set((state) => {
        state.pullRequests.unshift(pr);
      }),

      updatePullRequest: (pr) => set((state) => {
        const idx = state.pullRequests.findIndex(p => p.id === pr.id);
        if (idx !== -1) {
          state.pullRequests[idx] = pr;
        }
      }),

      removePullRequest: (id) => set((state) => {
        const idx = state.pullRequests.findIndex(p => p.id === id);
        if (idx !== -1) {
          state.pullRequests.splice(idx, 1);
        }
      }),

      selectPullRequest: (id) => set((state) => {
        state.selectedPullRequestId = id;
      }),

      setPRLoading: (loading) => set((state) => {
        state.prLoading = loading;
      }),

      setPRError: (error) => set((state) => {
        state.prError = error;
        state.prLoading = false;
      }),

      // Work Items
      setWorkItems: (items) => set((state) => {
        state.workItems = items;
        state.workItemsLoading = false;
      }),

      addWorkItem: (item) => set((state) => {
        const exists = state.workItems.some(w => w.id === item.id);
        if (!exists) {
          state.workItems.push(item);
        }
      }),

      updateWorkItem: (item) => set((state) => {
        const idx = state.workItems.findIndex(w => w.id === item.id);
        if (idx !== -1) {
          state.workItems[idx] = item;
        }
      }),

      setWorkItemsLoading: (loading) => set((state) => {
        state.workItemsLoading = loading;
      }),

      setWorkItemsError: (error) => set((state) => {
        state.workItemsError = error;
        state.workItemsLoading = false;
      }),

      // Policies
      setPolicies: (policies) => set((state) => {
        state.policies = policies;
        state.policiesLoading = false;
      }),

      setPolicyEvaluations: (prId, evaluations) => set((state) => {
        state.policyEvaluations.set(prId, evaluations);
      }),

      setPoliciesLoading: (loading) => set((state) => {
        state.policiesLoading = loading;
      }),

      // Build Status
      setBuildStatuses: (prId, builds) => set((state) => {
        state.buildStatuses.set(prId, builds);
        state.buildsLoading = false;
      }),

      updateBuildStatus: (prId, build) => set((state) => {
        const builds = state.buildStatuses.get(prId) ?? [];
        const idx = builds.findIndex(b => b.id === build.id);
        if (idx !== -1) {
          builds[idx] = build;
        } else {
          builds.push(build);
        }
        state.buildStatuses.set(prId, builds);
      }),

      setBuildsLoading: (loading) => set((state) => {
        state.buildsLoading = loading;
      }),

      // Commit-WorkItem Links
      setCommitWorkItemLinks: (links) => set((state) => {
        state.commitWorkItemLinks = links;
      }),

      linkCommitToWorkItem: (commitHash, workItemId) => set((state) => {
        const exists = state.commitWorkItemLinks.some(
          l => l.commitHash === commitHash && l.workItemId === workItemId
        );
        if (!exists) {
          state.commitWorkItemLinks.push({ commitHash, workItemId });
        }
      }),

      unlinkCommitFromWorkItem: (commitHash, workItemId) => set((state) => {
        const idx = state.commitWorkItemLinks.findIndex(
          l => l.commitHash === commitHash && l.workItemId === workItemId
        );
        if (idx !== -1) {
          state.commitWorkItemLinks.splice(idx, 1);
        }
      }),

      getWorkItemsForCommit: (commitHash) => {
        const { commitWorkItemLinks } = get();
        return commitWorkItemLinks
          .filter(l => l.commitHash === commitHash)
          .map(l => l.workItemId);
      },

      // Loading & Error
      setLoading: (loading) => set((state) => {
        state.loading = loading;
      }),

      setError: (error) => set((state) => {
        state.error = error;
        state.loading = false;
      }),

      clearError: () => set((state) => {
        state.error = null;
        state.prError = null;
        state.workItemsError = null;
      }),

      // Async actions
      fetchPullRequests: (status = 'active') => {
        set((state) => { state.prLoading = true; });
        postMessage('azure.getPullRequests', { status });
      },

      fetchWorkItems: (ids) => {
        set((state) => { state.workItemsLoading = true; });
        postMessage('azure.getWorkItems', { ids });
      },

      fetchPolicies: (branch) => {
        set((state) => { state.policiesLoading = true; });
        postMessage('azure.getPolicies', { branch });
      },

      fetchPolicyEvaluations: (prId) => {
        postMessage('azure.getPolicyEvaluations', { prId });
      },

      fetchBuildStatuses: (prId) => {
        set((state) => { state.buildsLoading = true; });
        postMessage('azure.getBuildStatuses', { prId });
      },

      fetchCommitWorkItemLinks: (commitHash) => {
        postMessage('azure.getCommitWorkItemLinks', { commitHash });
      },

      // PR operations
      createPullRequest: (options) => {
        set((state) => { state.prLoading = true; });
        postMessage('azure.createPullRequest', options as unknown as Record<string, unknown>);
      },

      approvePullRequest: (prId) => {
        postMessage('azure.approvePullRequest', { prId });
      },

      rejectPullRequest: (prId) => {
        postMessage('azure.rejectPullRequest', { prId });
      },

      completePullRequest: (prId, options) => {
        set((state) => { state.prLoading = true; });
        postMessage('azure.completePullRequest', { prId, options });
      },

      abandonPullRequest: (prId) => {
        set((state) => { state.prLoading = true; });
        postMessage('azure.abandonPullRequest', { prId });
      },

      addPRComment: (prId, content, threadId) => {
        postMessage('azure.addPRComment', { prId, content, threadId });
      },

      addPRReviewer: (prId, reviewerId, isRequired = false) => {
        postMessage('azure.addPRReviewer', { prId, reviewerId, isRequired });
      },

      // Work Item operations
      createWorkItemLink: (commitHash, workItemId) => {
        postMessage('azure.createWorkItemLink', { commitHash, workItemId });
      },

      removeWorkItemLink: (commitHash, workItemId) => {
        postMessage('azure.removeWorkItemLink', { commitHash, workItemId });
      },

      // Build operations
      triggerRebuild: (definitionId, branch) => {
        set((state) => { state.buildsLoading = true; });
        postMessage('azure.triggerRebuild', { definitionId, branch });
      },

      fetchBuilds: (branch) => {
        set((state) => { state.buildsLoading = true; });
        postMessage('azure.getBuilds', { branch });
      },

      fetchBuildDetails: (commitSha) => {
        set((state) => { state.buildsLoading = true; });
        postMessage('azure.getBuildDetails', { commitSha });
      },

      // Reset
      resetStore: () => set(() => initialState),
    })),
    { name: 'azure-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectPullRequests = (state: AzureState) => state.pullRequests;
export const selectActivePullRequests = (state: AzureState) =>
  state.pullRequests.filter(pr => pr.status === 'active');
export const selectSelectedPullRequest = (state: AzureState) =>
  state.pullRequests.find(pr => pr.id === state.selectedPullRequestId) ?? null;
export const selectWorkItems = (state: AzureState) => state.workItems;
export const selectPolicies = (state: AzureState) => state.policies;
export const selectIsAuthenticated = (state: AzureState) => state.authenticated;
export const selectCurrentUser = (state: AzureState) => state.currentUser;
export const selectPRsForBranch = (branch: string) => (state: AzureState) =>
  state.pullRequests.filter(pr => pr.sourceRefName === `refs/heads/${branch}`);
export const selectPolicyEvaluationsForPR = (prId: number) => (state: AzureState) =>
  state.policyEvaluations.get(prId) ?? [];
export const selectBuildStatusesForPR = (prId: number) => (state: AzureState) =>
  state.buildStatuses.get(prId) ?? [];
