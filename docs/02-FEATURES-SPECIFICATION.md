# 4MGI Git Board - Features Specification

## Table of Contents

1. [Core Features](#1-core-features)
2. [Advanced Features](#2-advanced-features)
3. [Integration Features](#3-integration-features)
4. [Settings & Configuration](#4-settings--configuration)

---

## 1. Core Features

### 1.1 Visual Commit Graph

**Description:** Display commit history as a visual graph, allowing users to easily track and interact with Git history.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| VCG-01 | Display commit history as graph with nodes and connections | Must Have |
| VCG-02 | Color-code different branches | Must Have |
| VCG-03 | Show branch labels and tags | Must Have |
| VCG-04 | Zoom in/out and pan (drag canvas) | Must Have |
| VCG-05 | Click on commit to view details | Must Have |
| VCG-06 | Filter commits by author, date range, message | Should Have |
| VCG-07 | Search commits by message or SHA | Should Have |
| VCG-08 | Highlight HEAD, remotes, and stash | Must Have |
| VCG-09 | Collapse/expand branches | Should Have |

**User Interactions:**

| User Action | System Response |
|-------------|-----------------|
| Click commit node | Show commit detail panel |
| Double-click commit | Open diff view |
| Right-click commit | Show context menu |
| Hover commit | Show tooltip with summary |
| Scroll wheel | Zoom in/out |
| Drag canvas | Pan view |

---

### 1.2 Drag-and-Drop Operations

**Description:** Enable complex Git operations through visual drag-and-drop.

**Supported Operations:**

| Operation | Drag Source | Drop Target | Git Command |
|-----------|-------------|-------------|-------------|
| Rebase | Branch/Commit | Commit | `git rebase` |
| Cherry-pick | Commit | Branch | `git cherry-pick` |
| Move branch | Branch pointer | Commit | `git branch -f` |
| Merge | Branch | Branch | `git merge` |
| Create branch | Commit | Empty space | `git branch` |
| Reorder commits | Commit | Position | `git rebase -i` |

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| DND-01 | Visual preview when dragging (ghost element) | Must Have |
| DND-02 | Highlight valid drop targets | Must Have |
| DND-03 | Preview result before execution | Must Have |
| DND-04 | Undo/Redo support | Must Have |
| DND-05 | Confirmation dialog for destructive operations | Must Have |
| DND-06 | Animation on drop | Should Have |

---

### 1.3 Branch Management

**Description:** Visual branch management.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| BRM-01 | Display all branches (local + remote) | Must Have |
| BRM-02 | Create new branch from any commit | Must Have |
| BRM-03 | Rename branch | Must Have |
| BRM-04 | Delete branch (with confirmation) | Must Have |
| BRM-05 | Checkout branch (click or double-click) | Must Have |
| BRM-06 | Compare two branches | Should Have |
| BRM-07 | Track remote branch | Should Have |
| BRM-08 | Push/Pull branch | Must Have |
| BRM-09 | Branch protection warnings | Should Have |

---

### 1.4 Commit Operations

**Description:** Commit-related operations.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| COM-01 | Stage/Unstage files and hunks | Must Have |
| COM-02 | Commit with message editor | Must Have |
| COM-03 | Amend last commit | Must Have |
| COM-04 | Uncommit (soft reset) | Must Have |
| COM-05 | Split commit | Should Have |
| COM-06 | Squash commits | Should Have |
| COM-07 | Reword commit message | Should Have |
| COM-08 | Drop commit | Should Have |

---

### 1.5 Conflict Resolution

**Description:** Visual interface for resolving merge/rebase conflicts.

**Functional Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| CFR-01 | Display conflicted files list | Must Have |
| CFR-02 | 3-way diff view (base, ours, theirs) | Must Have |
| CFR-03 | Accept changes (ours/theirs/both) per hunk | Must Have |
| CFR-04 | Manual edit in conflict view | Must Have |
| CFR-05 | Mark as resolved | Must Have |
| CFR-06 | Abort merge/rebase | Must Have |
| CFR-07 | Continue merge/rebase | Must Have |
| CFR-08 | Conflict preview before merge | Should Have |

---

## 2. Advanced Features

### 2.1 Interactive Rebase

**Description:** Visual interface for interactive rebase.

| ID | Requirement | Priority |
|----|-------------|----------|
| IRB-01 | Display rebase plan with commits | Must Have |
| IRB-02 | Reorder commits via drag-and-drop | Must Have |
| IRB-03 | Pick/Reword/Edit/Squash/Fixup/Drop per commit | Must Have |
| IRB-04 | Preview result | Should Have |
| IRB-05 | Abort rebase any time | Must Have |

---

### 2.2 Stash Management

**Description:** Manage Git stash entries.

| ID | Requirement | Priority |
|----|-------------|----------|
| STM-01 | Display stash entries list | Must Have |
| STM-02 | Create stash with message | Must Have |
| STM-03 | Apply/Pop stash | Must Have |
| STM-04 | Drop stash | Must Have |
| STM-05 | View stash diff | Must Have |
| STM-06 | Partial stash (selected files) | Should Have |

---

## 3. Integration Features

### 3.1 Azure Repos Integration (Primary)

**Description:** Deep integration with Azure DevOps/Azure Repos.

| ID | Requirement | Priority |
|----|-------------|----------|
| AZR-01 | PAT (Personal Access Token) authentication | Must Have |
| AZR-02 | Display PR status on graph | Must Have |
| AZR-03 | Create PR from branch | Must Have |
| AZR-04 | View PR details and comments | Should Have |
| AZR-05 | Azure Pipelines status badges | Must Have |
| AZR-06 | Link commits with Work Items | Must Have |
| AZR-07 | Display Work Item info on commits | Should Have |
| AZR-08 | Branch policies indicator | Must Have |
| AZR-09 | Required reviewers display | Should Have |

---

### 3.2 Branch Policies Deep Integration

**Description:** Visual representation and management of Azure Repos branch policies.

| ID | Requirement | Priority |
|----|-------------|----------|
| AZR-10 | Display policy configuration per branch | Must Have |
| AZR-11 | Show policy violation status on commits/PRs | Must Have |
| AZR-12 | Policy types: minimum reviewers, linked work items, build validation | Must Have |
| AZR-13 | Policy types: required reviewers, comment resolution | Should Have |
| AZR-14 | Visual lock icon on protected branches | Must Have |
| AZR-15 | Policy details tooltip on hover | Should Have |
| AZR-16 | Policy violation panel with details | Should Have |

**API Reference:**
- Policy Configurations: `GET /{org}/{project}/_apis/git/policy/configurations`
- PR Status Server: Custom Azure Functions for status checks

---

### 3.3 Azure Pipelines Deep Integration

**Description:** CI/CD pipeline status and actions directly on the commit graph.

| ID | Requirement | Priority |
|----|-------------|----------|
| AZR-17 | Display build status badge on commit nodes | Must Have |
| AZR-18 | Click commit → view build details panel | Must Have |
| AZR-19 | Show test results summary (passed/failed/skipped) | Should Have |
| AZR-20 | Show code coverage percentage | Should Have |
| AZR-21 | View build logs link | Should Have |
| AZR-22 | Context menu: "Rebuild this commit" | Should Have |
| AZR-23 | Context menu: "View in Azure DevOps" | Must Have |
| AZR-24 | Pipeline run history per branch | Nice to Have |

**Build Status Badge States:**

| Status | Icon | Color |
|--------|------|-------|
| Running | ⟳ spinner | Blue #0078D4 |
| Succeeded | ✓ checkmark | Green #107C10 |
| Failed | ✗ cross | Red #D13438 |
| Canceled | ⊘ stop | Gray #8A8886 |
| Partial | ⚠ warning | Yellow #FFB900 |

**API Reference:**
- Build API: `GET /{org}/{project}/_apis/build/builds`
- Status Badge: `GET /{org}/{project}/_apis/build/status/{definition}`

---

### 3.4 GitHub Integration (Basic)

**Description:** Basic GitHub support for occasional use.

| ID | Requirement | Priority |
|----|-------------|----------|
| GHI-01 | PAT or OAuth authentication | Should Have |
| GHI-02 | Display PR status on graph | Should Have |
| GHI-03 | Create PR from branch | Nice to Have |
| GHI-04 | GitHub Actions status | Nice to Have |

---

## 4. Settings & Configuration

### 4.1 User Preferences

| Setting | Type | Default |
|---------|------|---------|
| Theme | Light/Dark/Auto | Auto |
| Default view mode | Graph/List | Graph |
| Commit display format | Short/Full | Short |
| Auto-fetch interval | Number (minutes) | 5 |
| Confirm destructive operations | Boolean | true |
| Show remote branches | Boolean | true |
| Graph orientation | Vertical/Horizontal | Vertical |
| Default provider | Azure Repos/GitHub | Azure Repos |

### 4.2 Repository Settings

| Setting | Type | Description |
|---------|------|-------------|
| Default branch | String | Main development branch |
| Protected branches | Array | Branches with restrictions |
| Commit message template | String | Template for new commits |
| Work Item linking pattern | String | Pattern to link Work Items |

---

*Created: 2026-01-14*
*Version: 1.0*
