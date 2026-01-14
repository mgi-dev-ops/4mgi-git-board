# 4MGI Git Board - Development Plan

## Phase Overview

- **Phase 1: Foundation** - Setup & Scaffolding
- **Phase 2: Core Features** - Git Operations & Graph
- **Phase 3: Advanced** - Conflict Resolution & Rebase
- **Phase 4: Integrations** - Azure Repos & GitHub
- **Phase 5: Polish & Release** - Testing & Documentation

---

## Phase 1: Foundation

### 1.1 Project Setup

- [ ] Initialize VS Code Extension project with TypeScript
- [ ] Setup build toolchain (esbuild/webpack)
- [ ] Configure ESLint, Prettier
- [ ] Setup Git hooks (Husky, lint-staged)
- [ ] Create basic extension scaffolding
- [ ] Setup Webview with React

### 1.2 Core Infrastructure

- [ ] Implement Extension ↔ Webview message protocol
- [ ] Setup Zustand stores
- [ ] Implement GitService wrapper
- [ ] Create basic UI layout
- [ ] Implement VS Code theme integration

### 1.3 Deliverables

- Working extension loads in VS Code
- Basic webview renders
- Can read Git repository info

---

## Phase 2: Core Features

### 2.1 Visual Commit Graph

- [ ] Implement commit log fetching
- [ ] Create graph layout algorithm
- [ ] Render commit nodes with React Flow
- [ ] Branch line rendering
- [ ] Zoom/pan navigation
- [ ] Commit detail panel

### 2.2 Branch Operations

- [ ] Branch list sidebar
- [ ] Create branch
- [ ] Delete branch
- [ ] Rename branch
- [ ] Checkout branch
- [ ] Remote tracking

### 2.3 Commit Operations

- [ ] Stage/Unstage files
- [ ] Commit with message
- [ ] Amend commit
- [ ] Reset/Revert

### 2.4 Drag-and-Drop

- [ ] Drag commit nodes
- [ ] Drop zone detection
- [ ] Preview system
- [ ] Rebase via drag
- [ ] Cherry-pick via drag

### 2.5 Deliverables

- Functional commit graph
- Basic Git operations work
- Drag-drop for rebase

---

## Phase 3: Advanced Features

### 3.1 Conflict Resolution

- [ ] Conflict detection
- [ ] Conflict file list
- [ ] 3-way diff view
- [ ] Accept ours/theirs/both
- [ ] Manual editing

### 3.2 Interactive Rebase

- [ ] Rebase plan UI
- [ ] Pick/Squash/Fixup/Drop
- [ ] Reorder commits
- [ ] Abort/Continue

### 3.3 Stash Management

- [ ] Stash list
- [ ] Create stash
- [ ] Apply/Pop stash
- [ ] Drop stash

### 3.4 Deliverables

- Full conflict resolution
- Interactive rebase UI
- Stash management

---

## Phase 4: Integrations

### 4.1 Azure Repos Integration (Primary Focus)

- [ ] PAT authentication
- [ ] PR status on graph
- [ ] Create PR from branch
- [ ] View PR details
- [ ] Azure Pipelines status badges
- [ ] Work Items linking
- [ ] Branch policies display

### 4.2 GitHub Integration (Basic)

- [ ] PAT/OAuth authentication
- [ ] PR status display

### 4.3 Deliverables

- Azure Repos integration fully working
- GitHub basic support

---

## Phase 5: Polish & Release

### 5.1 UX Improvements

- [ ] Loading states
- [ ] Error handling
- [ ] Undo/Redo
- [ ] Keyboard shortcuts
- [ ] Animations

### 5.2 Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing

### 5.3 Documentation

- [ ] User guide
- [ ] API documentation
- [ ] Contributing guide

### 5.4 Release

- [ ] Marketplace listing
- [ ] Screenshots/Demo video
- [ ] Changelog
- [ ] Launch

---

## Phase Dependencies

- Phase 1 → Phase 2 → Phase 3
- Phase 2 + Phase 3 → Phase 4
- All phases → Phase 5

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large repo performance | High | Pagination, virtualization |
| Git edge cases | Medium | Comprehensive testing |
| VS Code API changes | Low | Pin VS Code version |
| Azure API rate limits | Medium | Caching, rate limiting |

---

*Version: 1.0*
