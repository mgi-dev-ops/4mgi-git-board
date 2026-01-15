# 4MGI Git Board - Technical Architecture

## 1. System Overview

### 1.1 High-Level Architecture

**Components:**
- **VS Code Host** - The VS Code application environment
- **Extension Host** - Runs extension TypeScript code
- **Webview (UI)** - React-based user interface
- **Git Service** - Wrapper for Git operations
- **Provider Service** - Azure Repos and GitHub API integration

**Data Flow:**
- User interacts with Webview UI
- Webview sends messages to Extension Host
- Extension Host executes Git commands or API calls
- Results sent back to Webview for display

---

## 2. Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Extension Host** | TypeScript | Type safety, VS Code native |
| **UI Framework** | React | Component-based, ecosystem |
| **State Management** | Zustand | Lightweight, TypeScript-first |
| **Canvas Rendering** | @gitgraph/js | Git graph visualization (native branch/merge support) |
| **Git Operations** | simple-git | Node.js Git wrapper |
| **Azure API** | azure-devops-node-api | Official SDK |
| **GitHub API** | @octokit/rest | Official SDK |
| **Styling** | CSS Modules | VS Code theme integration |
| **Build Tool** | esbuild | Fast bundling |
| **Testing** | Vitest | Unit + integration tests |

---

## 3. Module Structure

**Directory Layout:**

- `src/extension/` - Extension host code
  - `commands/` - VS Code commands
  - `providers/` - Tree data providers
  - `services/` - Backend services (Git, Azure, GitHub)
  - `extension.ts` - Entry point

- `src/webview/` - Webview UI code
  - `components/` - React components
    - `graph/` - Graph visualization
    - `panels/` - Side panels
    - `common/` - Shared components
  - `hooks/` - Custom React hooks
  - `stores/` - Zustand stores
  - `App.tsx` - Root component

- `src/core/` - Shared core logic
  - `entities/` - Domain entities
  - `services/` - Domain services
  - `utils/` - Utility functions

- `src/types/` - TypeScript declarations

---

## 4. Data Flow

### 4.1 Initialization Flow

Khi webview được mở, quá trình khởi tạo diễn ra như sau:

1. **Webview Load** (`index.tsx`)
   - Setup theme listener
   - Mount React app
   - Gửi `webview-ready` message

2. **Extension Response** (`extension.ts`)
   - Nhận `webview-ready`
   - Fetch initial data từ GitService
   - Gửi `git/log`, `git/branches`, `repo/status`, `git/stashes`

3. **React Initialization** (`App.tsx`)
   - Setup `useMessageHandler` hook
   - `useEffect` gọi `fetchAll()` (backup mechanism)
   - Nhận data và map types

### 4.2 Message Flow (Extension ↔ Webview)

**Request Flow:**
1. User Action (Webview)
2. Store action gọi `postMessage()` (e.g., `git.getCommits`)
3. Extension nhận qua `onDidReceiveMessage`
4. `MessageProtocol.handleMessage()` dispatch to handler
5. Handler thực thi Git/API operation
6. Handler gọi `protocol.send()` với proper response type
7. Webview nhận qua `useMessageHandler` hook
8. Map API types → Store types
9. Update Zustand store
10. React re-render

**Handler Pattern:**
```typescript
// Extension sends proper response types, not auto-generated
protocol.registerHandler('git.getCommits', async (payload) => {
    const commits = await git.getLog({ limit: payload.limit });
    protocol.send({ type: 'git/log', payload: commits }); // Proper type
    return null; // Don't send auto-response
});
```

### 4.3 Message Types

**Request Messages (Webview → Extension):**
- `git.getCommits` - Get commit history
- `git.getBranches` - Get branches
- `git.getStatus` - Get working tree status
- `git.getStashes` - Get stash list
- `git.checkout` - Switch branch
- `azure.getPRs` - Get Azure Repos PRs

**Response Messages (Extension → Webview):**
- `git/log` - Commit list (Commit[])
- `git/branches` - Branch list (Branch[])
- `repo/status` - Repository status (StatusResult)
- `git/stashes` - Stash list (Stash[])
- `git/success` - Operation success
- `error` - Error information

**Event Messages (Extension → Webview):**
- `git/changed` - Git state changed, trigger refresh

### 4.4 Type Mapping

Do có 2 type systems (API types trong `src/types/` và Store types trong `gitStore.ts`), cần mapping:

| API Type | Store Type | Key Differences |
|----------|------------|-----------------|
| `Commit.sha` | `GitCommit.hash` | Property name |
| `Commit.shortSha` | `GitCommit.shortHash` | Property name |
| `Branch.current` | `GitBranch.isHead` | Property name |
| `Branch.tracking` | `GitBranch.upstream` | Property name |

Mapping functions trong `App.tsx`: `mapCommit()`, `mapBranch()`, `mapStash()`, `mapStatus()`

---

## 5. Provider Integration

### 5.1 Azure Repos

**Authentication:** Personal Access Token (PAT)
**API:** Azure DevOps REST API via azure-devops-node-api

**Features:**
- Pull Request CRUD
- Work Items linking
- Branch policies
- Pipeline status

### 5.2 Branch Policies Integration

**API Endpoints:**
- Policy Configurations: `GET /{org}/{project}/_apis/git/policy/configurations`
- Policy Evaluations: `GET /{org}/{project}/_apis/git/policy/evaluations`

**Policy Types Supported:**
- Minimum reviewers
- Work item linking
- Build validation
- Required reviewers
- Comment resolution

### 5.3 Azure Pipelines Integration

**API Endpoints:**
- Builds: `GET /{org}/{project}/_apis/build/builds`
- Build Details: `GET /{org}/{project}/_apis/build/builds/{buildId}`
- Test Results: `GET /{org}/{project}/_apis/test/runs`
- Code Coverage: `GET /{org}/{project}/_apis/test/codecoverage`
- Queue Build: `POST /{org}/{project}/_apis/build/builds`

**Features:**
- Build status on commit nodes
- Test results summary
- Code coverage display
- Rebuild trigger from context menu
- Deep link to Azure DevOps

### 5.4 GitHub

**Authentication:** PAT or OAuth
**API:** GitHub REST API via @octokit/rest

**Features:**
- Pull Request status
- Basic PR operations

---

## 6. Performance Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Initial load | < 500ms | < 1s |
| Graph render (1000 commits) | < 200ms | < 500ms |
| Commit operation | < 300ms | < 1s |
| API call | < 500ms | < 2s |

---

## 7. Security

| Aspect | Implementation |
|--------|----------------|
| Token Storage | VS Code Secret Storage API |
| Input Validation | Zod schema validation |
| Webview | Sandboxed + CSP |
| API Access | Minimal scopes |
| PAT Handling | Never logged, encrypted storage |

---

*Version: 1.0*
