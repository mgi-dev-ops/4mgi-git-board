# Changelog

All notable changes to the 4MGI Git Board extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Visual commit graph using @gitgraph/js
- Drag-and-drop operations for rebase and cherry-pick
- Interactive rebase view with commit reordering
- Conflict resolution view with 3-way diff
- Stash management panel
- Azure DevOps integration (PR, Work Items, Pipelines)
- GitHub integration (PR status)
- Keyboard shortcuts for all major operations
- Undo/Redo system for git operations
- Unit tests for GitService, stores, and message protocol

### Changed
- Migrated to esbuild for faster builds
- Updated build system to support React webview

## [0.0.1] - 2026-01-15

### Added

#### Core Features
- **Visual Commit Graph**: Interactive git graph visualization
  - Commit nodes with branch colors
  - Zoom/pan navigation
  - Commit filtering by author, date, message
  - Commit search by SHA/message

- **Branch Operations**
  - Create, delete, rename branches
  - Checkout branches
  - Remote branch tracking display

- **Commit Operations**
  - Stage/unstage files with diff section
  - Commit with message editor
  - Amend last commit
  - Reset/revert commits

- **Drag-and-Drop Operations**
  - Rebase via drag
  - Cherry-pick via drag
  - Drop zone detection with preview

- **Interactive Rebase**
  - Rebase plan display
  - Action dropdown (pick/reword/edit/squash/fixup/drop)
  - Commit reorder via drag
  - Reword dialog
  - Squash message editor
  - Abort/continue rebase

- **Conflict Resolution**
  - Conflict detection
  - 3-way diff view
  - Accept ours/theirs/both per hunk
  - Mark as resolved

- **Stash Management**
  - Stash list display
  - Create stash with message
  - Apply/pop/drop stash
  - View stash diff

#### Integrations

- **Azure DevOps**
  - PAT authentication with secure storage
  - PR status fetching and badges
  - Create PR from branch
  - Work Items linking
  - Branch policies display
  - Pipeline status badges
  - Trigger rebuild from context menu

- **GitHub**
  - PAT authentication
  - PR status fetching
  - GitHub PR badges

#### UX Improvements
- VS Code theme integration (CSS variables)
- Loading states (skeleton, spinners)
- Comprehensive error handling UI
- Keyboard shortcuts (637+ lines of shortcuts)
- Confirmation dialogs for destructive operations
- Animations for node appear and transitions

#### Infrastructure
- TypeScript with strict mode
- esbuild bundling for extension and webview
- ESLint + Prettier configuration
- Husky + lint-staged for git hooks
- Zustand state management with Immer
- Vitest testing framework

### Technical Details

- **Extension Entry**: VS Code extension with WebviewViewProvider
- **Message Protocol**: 200+ types for Extension ↔ Webview communication
- **GitService**: Wrapper for simple-git (800+ LOC)
- **AzureService**: Integration with azure-devops-node-api (867 LOC)
- **GitHubService**: Integration with @octokit/rest (360 LOC)
- **Test Coverage**: 102 unit tests across GitService, stores, and protocol

### Known Issues
- E2E tests not yet implemented
- React component tests pending
- VS Code Marketplace listing not yet created

---

[Unreleased]: https://github.com/4mgi/4mgi-git-board/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/4mgi/4mgi-git-board/releases/tag/v0.0.1
