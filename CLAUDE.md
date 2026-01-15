# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

4MGI Git Board là VS Code Extension quản lý Git workflow bằng visual UI, hỗ trợ Azure Repos và GitHub integration.

## Commands

```bash
# Build
yarn run build              # Build extension và webview
yarn run build:watch        # Watch mode
yarn run build:prod         # Production build

# Test
yarn run test               # Run all tests
yarn run test:watch         # Watch mode
yarn run test:coverage      # With coverage report

# Lint
yarn run lint               # Biome check
```

Chạy single test file:
```bash
yarn vitest run src/path/to/file.test.ts
```

## Architecture

### Module Structure

```
src/
├── extension/           # VS Code extension host (Node.js)
│   ├── commands/        # VS Code commands
│   ├── services/        # GitService, AzureService, GitHubService
│   ├── webview/         # WebviewProvider
│   └── extension.ts     # Entry point (activate/deactivate)
├── webview/             # React UI (runs in webview)
│   ├── components/      # React components (graph/, layout/, azure/, rebase/, etc.)
│   ├── stores/          # Zustand stores (gitStore, uiStore, azureStore, rebaseStore)
│   ├── hooks/           # Custom hooks
│   └── App.tsx          # Root component
├── core/                # Shared code
│   └── messages/        # Message protocol types & handlers
└── types/               # TypeScript type definitions
```

### Extension ↔ Webview Communication

Extension và Webview giao tiếp qua message protocol (`postMessage`):

1. **Webview** gửi request message (e.g., `git.getCommits`, `azure.getPRs`)
2. **Extension** xử lý qua `MessageProtocol.registerHandler()` trong `extension.ts`
3. **Extension** gửi response/event message về Webview
4. **Webview** cập nhật Zustand store → React re-render

Message types defined in `src/core/messages/types.ts`.

### Key Services

- **GitService** (`src/extension/services/GitService.ts`): Wrapper cho `simple-git`, xử lý tất cả Git operations
- **AzureService** (`src/extension/services/AzureService.ts`): Azure DevOps API (PRs, Work Items, Pipelines, Branch Policies)
- **GitHubService** (`src/extension/services/GitHubService.ts`): GitHub API via Octokit

### State Management

Zustand stores trong `src/webview/stores/`:
- `gitStore`: Commits, branches, status, stashes
- `uiStore`: UI state (selected commit, modals, loading)
- `azureStore`: Azure PRs, Work Items, Pipelines
- `rebaseStore`: Interactive rebase state

### Build System

Dual esbuild configuration:
- `esbuild.extension.mjs`: Build extension code (Node.js target)
- `esbuild.webview.mjs`: Build webview code (browser target, React JSX)

Output: `dist/extension.js` và `dist/webview.js`

## Testing

Vitest với environment matching:
- `src/webview/**/*.test.ts` → jsdom environment
- `src/extension/**/*.test.ts` → node environment

## TypeScript

Strict mode với additional checks:
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`

