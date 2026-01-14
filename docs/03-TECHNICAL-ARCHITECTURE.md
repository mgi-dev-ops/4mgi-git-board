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

### 4.1 Message Flow (Extension ↔ Webview)

**Flow:**
1. User Action (Webview)
2. Dispatch Action (Store)
3. Post Message to Extension
4. Message Handler (Extension)
5. Git Service / Provider API
6. Post Result to Webview
7. Update Store
8. Re-render UI

### 4.2 Message Types

**Request Messages (Webview → Extension):**
- `git/getLog` - Get commit history
- `git/commit` - Create commit
- `git/checkout` - Switch branch
- `azure/getPRs` - Get Azure Repos PRs
- `azure/getWorkItems` - Get linked Work Items

**Response Messages (Extension → Webview):**
- `git/log` - Commit list
- `git/error` - Error information
- `azure/prs` - PR list
- `azure/workItems` - Work Items data

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
