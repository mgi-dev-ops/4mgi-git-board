# 4MGI Git Board - API Reference

## 1. Extension Commands

### Registered Commands

| Command ID | Title | Description |
|------------|-------|-------------|
| `gitBoard.open` | Open Git Board | Open main panel |
| `gitBoard.refresh` | Refresh | Reload repository data |
| `gitBoard.commit` | Quick Commit | Open commit dialog |
| `gitBoard.checkout` | Checkout Branch | Switch branch |
| `gitBoard.fetch` | Fetch | Fetch from remotes |
| `gitBoard.pull` | Pull | Pull current branch |
| `gitBoard.push` | Push | Push current branch |
| `gitBoard.linkWorkItem` | Link Work Item | Link commit to Azure Work Item |

---

## 2. Message Protocol

### 2.1 Internal Request Messages (Webview → Extension)

Webview sử dụng simplified message format với dot notation. Extension handlers map sang proper response types.

**Initialization:**
- `{ type: 'webview-ready' }` - Webview đã load xong, trigger initial data fetch

**Git Data (simplified format):**
- `{ type: 'git.getCommits', limit?: number, offset?: number }` → Response: `git/log`
- `{ type: 'git.getBranches' }` → Response: `git/branches`
- `{ type: 'git.getStatus' }` → Response: `repo/status`
- `{ type: 'git.getStashes' }` → Response: `git/stashes`

**Git Operations:**
- `{ type: 'git.checkout', ref: string }` → Response: `git/success`
- `{ type: 'git.createBranch', name: string, startPoint?: string }` → Response: `git/success`
- `{ type: 'git.deleteBranch', name: string, force?: boolean }` → Response: `git/success`
- `{ type: 'git.merge', branch: string, noFf?: boolean }` → Response: `git/success`
- `{ type: 'git.pull', remote?: string, branch?: string }` → Response: `git/success`
- `{ type: 'git.push', remote?: string, branch?: string, force?: boolean }` → Response: `git/success`

### 2.2 Formal Request Messages (Reference)

Formal message types defined in `src/core/messages/types.ts`:

**Repository:**
- `{ type: 'repo/getInfo' }`
- `{ type: 'repo/getStatus' }`

**Commits:**
- `{ type: 'git/getLog', payload: { limit: number, branch?: string } }`
- `{ type: 'git/commit', payload: { message: string, files: string[], workItemId?: string } }`
- `{ type: 'git/amend', payload: { message: string } }`

**Branches:**
- `{ type: 'git/getBranches' }`
- `{ type: 'git/checkout', payload: { branch: string } }`
- `{ type: 'git/createBranch', payload: { name: string, from?: string } }`
- `{ type: 'git/deleteBranch', payload: { name: string, force?: boolean } }`

**Merge/Rebase:**
- `{ type: 'git/merge', payload: { branch: string } }`
- `{ type: 'git/rebase', payload: { onto: string, commits?: string[] } }`
- `{ type: 'git/cherryPick', payload: { commit: string } }`

**Staging:**
- `{ type: 'git/stage', payload: { files: string[] } }`
- `{ type: 'git/unstage', payload: { files: string[] } }`

**Stash:**
- `{ type: 'git/stashList' }`
- `{ type: 'git/stashCreate', payload: { message?: string } }`
- `{ type: 'git/stashApply', payload: { index: number } }`
- `{ type: 'git/stashDrop', payload: { index: number } }`

**Azure Repos:**
- `{ type: 'azure/getPRs', payload: { branch?: string } }`
- `{ type: 'azure/createPR', payload: { source: string, target: string, title: string } }`
- `{ type: 'azure/getWorkItems', payload: { ids: number[] } }`
- `{ type: 'azure/linkWorkItem', payload: { commitSha: string, workItemId: number } }`
- `{ type: 'azure/getPipelineStatus', payload: { branch: string } }`

**Azure Branch Policies:**
- `{ type: 'azure/getPolicyConfigurations', payload: { branch: string } }`
- `{ type: 'azure/getPolicyEvaluations', payload: { prId: number } }`

**Azure Pipelines:**
- `{ type: 'azure/getBuildDetails', payload: { commitSha: string } }`
- `{ type: 'azure/getTestResults', payload: { buildId: number } }`
- `{ type: 'azure/getCodeCoverage', payload: { buildId: number } }`
- `{ type: 'azure/triggerRebuild', payload: { commitSha: string, definitionId: number } }`

**GitHub:**
- `{ type: 'github/getPRs', payload: { branch?: string } }`

### 2.3 Response Messages (Extension → Webview)

**Success responses:**
- `{ type: 'repo/info', payload: RepositoryInfo }`
- `{ type: 'repo/status', payload: StatusResult }`
- `{ type: 'git/log', payload: Commit[] }`
- `{ type: 'git/branches', payload: Branch[] }`
- `{ type: 'git/stashes', payload: Stash[] }`
- `{ type: 'git/success', payload: { operation: string, message?: string } }`
- `{ type: 'azure/prs', payload: PullRequest[] }`
- `{ type: 'azure/workItems', payload: WorkItem[] }`
- `{ type: 'azure/pipelineStatus', payload: PipelineStatus }`
- `{ type: 'azure/policyConfigurations', payload: PolicyConfiguration[] }`
- `{ type: 'azure/policyEvaluations', payload: PolicyEvaluation[] }`
- `{ type: 'azure/buildDetails', payload: BuildDetails }`
- `{ type: 'azure/testResults', payload: TestResult[] }`
- `{ type: 'azure/codeCoverage', payload: CodeCoverage }`
- `{ type: 'azure/rebuildTriggered', payload: { buildId: number, url: string } }`

**Events:**
- `{ type: 'git/changed' }` - Triggers data refresh in webview
- `{ type: 'git/conflict', payload: ConflictInfo }`

**Errors:**
- `{ type: 'error', payload: { code: string, message: string, requestType?: string } }`

### 2.4 Message Handling Architecture

**Extension Side (`extension.ts`):**
```typescript
// Handlers send proper response types directly
protocol.registerHandler('git.getCommits', async (payload) => {
    const commits = await git.getLog({ limit: payload?.limit ?? 100 });
    protocol.send({ type: 'git/log', payload: commits });
    return null; // Suppress auto-response
});
```

**Webview Side (`App.tsx`):**
```typescript
// useMessageHandler dispatches to callbacks
useMessageHandler({
    dispatchers: {
        onGitLog: (payload) => {
            setCommits(payload.map(mapCommit)); // Map API → Store types
            setLoading(false);
        },
        onGitChanged: () => fetchAll(), // Refresh on git changes
    },
});
```

---

## 3. Data Types

### 3.1 Core Entities

```typescript
interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  body?: string;
  author: Author;
  date: string;
  parents: string[];
  refs: Ref[];
  workItemIds?: number[];
}

interface Branch {
  name: string;
  current: boolean;
  remote?: string;
  tracking?: string;
  ahead: number;
  behind: number;
  hasPolicy?: boolean;
}

interface Author {
  name: string;
  email: string;
}
```

### 3.1.1 Store Types (gitStore.ts)

Webview uses different type names in Zustand store. Mapping required in `App.tsx`:

```typescript
// Store uses different property names
interface GitCommit {
  hash: string;        // API: sha
  shortHash: string;   // API: shortSha
  message: string;
  body: string;
  author: { name: string; email: string; date: string };
  committer: { name: string; email: string; date: string };
  parents: string[];
  refs: string[];      // API: Ref[] → string[]
  isMerge: boolean;    // Computed from parents.length > 1
}

interface GitBranch {
  name: string;
  isRemote: boolean;   // API: !!remote
  isHead: boolean;     // API: current
  upstream?: string;   // API: tracking
  ahead?: number;
  behind?: number;
  lastCommitHash?: string; // API: commit
}
```

**Mapping Functions (App.tsx):**
- `mapCommit(commit: Commit): GitCommit`
- `mapBranch(branch: Branch): GitBranch`
- `mapStash(stash: Stash): GitStash`
- `mapStatus(status: StatusResult): GitStatus`

### 3.2 Azure Repos Types

```typescript
interface PullRequest {
  id: number;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  sourceBranch: string;
  targetBranch: string;
  createdBy: string;
  reviewers: Reviewer[];
  workItemIds: number[];
}

interface WorkItem {
  id: number;
  title: string;
  state: string;
  type: string;
  assignedTo?: string;
  url: string;
}

interface PipelineStatus {
  name: string;
  status: 'running' | 'succeeded' | 'failed' | 'canceled';
  url: string;
}

interface PolicyConfiguration {
  id: number;
  type: PolicyType;
  isEnabled: boolean;
  isBlocking: boolean;
  settings: Record<string, unknown>;
}

type PolicyType = 
  | 'minimumApprovers'
  | 'workItemLinking'
  | 'buildValidation'
  | 'requiredReviewers'
  | 'commentRequirements';

interface PolicyEvaluation {
  configurationId: number;
  status: 'queued' | 'running' | 'approved' | 'rejected' | 'notApplicable';
  context: string;
}

interface BuildDetails {
  id: number;
  buildNumber: string;
  status: 'notStarted' | 'inProgress' | 'completed' | 'cancelling' | 'postponed';
  result?: 'succeeded' | 'partiallySucceeded' | 'failed' | 'canceled' | 'none';
  startTime?: string;
  finishTime?: string;
  sourceBranch: string;
  sourceCommit: string;
  definition: { id: number; name: string };
  url: string;
  logsUrl: string;
}

interface TestResult {
  testName: string;
  outcome: 'Passed' | 'Failed' | 'Skipped' | 'NotExecuted';
  duration: number;
  errorMessage?: string;
}

interface CodeCoverage {
  lineCoverage: number;   // percentage 0-100
  branchCoverage: number; // percentage 0-100
  modules: { name: string; lineCoverage: number }[];
}
```

### 3.3 Status Types

```typescript
interface StatusResult {
  current: string;
  tracking?: string;
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: string[];
  conflicted: string[];
}

interface FileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
}
```

---

## 4. Configuration Schema

```typescript
interface ExtensionConfig {
  'gitBoard.autoFetch': boolean;              // default: true
  'gitBoard.fetchInterval': number;           // default: 300 (seconds)
  'gitBoard.commitLimit': number;             // default: 100
  'gitBoard.showRemoteBranches': boolean;     // default: true
  'gitBoard.graphOrientation': 'vertical' | 'horizontal';
  'gitBoard.confirmDestructive': boolean;     // default: true
  'gitBoard.defaultProvider': 'azure' | 'github'; // default: 'azure'
  'gitBoard.azure.organization': string;
  'gitBoard.azure.project': string;
}
```

---

## 5. Events

### VS Code Events Subscribed

| Event | Usage |
|-------|-------|
| `workspace.onDidChangeWorkspaceFolders` | Repository change |
| `workspace.onDidSaveTextDocument` | Auto refresh |
| `window.onDidChangeActiveTextEditor` | Context update |

### Internal Events

| Event | Payload | Description |
|-------|---------|-------------|
| `repository:changed` | void | Git state changed |
| `branch:checkout` | branch name | Branch switched |
| `commit:created` | commit sha | New commit |
| `azure:prUpdated` | PR id | PR status changed |

---

*Version: 1.0*
