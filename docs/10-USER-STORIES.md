# 4MGI Git Board - User Stories

## Epic 1: Visual Git History

### US-001: View Commit Graph
**As a** developer  
**I want to** see my commit history as a visual graph  
**So that** I can understand the project's development flow

**Acceptance Criteria:**
- [ ] Graph displays commits as nodes
- [ ] Branches shown with different colors
- [ ] Lines connect related commits
- [ ] HEAD and current branch highlighted
- [ ] Can zoom and pan the graph

---

### US-002: View Commit Details
**As a** developer  
**I want to** click on a commit to see its details  
**So that** I can understand what changed

**Acceptance Criteria:**
- [ ] Shows commit message, author, date
- [ ] Lists changed files
- [ ] Can view diff for each file
- [ ] Shows linked Work Items (Azure)

---

## Epic 2: Branch Management

### US-003: Create Branch
**As a** developer  
**I want to** create a new branch from any commit  
**So that** I can start new work

**Acceptance Criteria:**
- [ ] Right-click commit → Create branch
- [ ] Enter branch name
- [ ] Optional: checkout immediately
- [ ] Branch appears in graph

---

### US-004: Switch Branches
**As a** developer  
**I want to** easily switch between branches  
**So that** I can work on different features

**Acceptance Criteria:**
- [ ] Double-click branch to checkout
- [ ] Warning if uncommitted changes
- [ ] Graph updates to show new HEAD

---

## Epic 3: Commit Operations

### US-005: Stage and Commit
**As a** developer  
**I want to** stage files and create commits  
**So that** I can save my work

**Acceptance Criteria:**
- [ ] See list of changed files
- [ ] Stage/unstage individual files
- [ ] Write commit message
- [ ] Commit creates new node in graph

---

### US-006: Amend Commit
**As a** developer  
**I want to** modify the last commit  
**So that** I can fix mistakes

**Acceptance Criteria:**
- [ ] Edit commit message
- [ ] Add/remove files
- [ ] Warning if already pushed

---

## Epic 4: Visual Rebase

### US-007: Rebase via Drag-and-Drop
**As a** developer  
**I want to** rebase by dragging commits  
**So that** I can reorganize history visually

**Acceptance Criteria:**
- [ ] Drag commit/branch to target
- [ ] Preview shows new position
- [ ] Confirmation before executing
- [ ] Graph updates after rebase

---

## Epic 5: Conflict Resolution

### US-008: Resolve Merge Conflicts
**As a** developer  
**I want to** resolve conflicts visually  
**So that** I can complete merges without CLI

**Acceptance Criteria:**
- [ ] See conflicted files list
- [ ] 3-way diff view
- [ ] Accept ours/theirs/both per hunk
- [ ] Mark as resolved
- [ ] Continue merge

---

## Epic 6: Azure Repos Integration

### US-009: View PR Status
**As a** developer  
**I want to** see Azure Repos PR status on branches  
**So that** I know review state

**Acceptance Criteria:**
- [ ] PR badge on branch
- [ ] Shows approval status
- [ ] Pipeline status indicator
- [ ] Click to open in Azure DevOps

---

### US-010: Link Work Items
**As a** developer  
**I want to** link commits to Azure Work Items  
**So that** I can track work completion

**Acceptance Criteria:**
- [ ] Link commit to Work Item by ID
- [ ] Show Work Item badge on commit
- [ ] View Work Item details in panel
- [ ] Click to open in Azure DevOps

---

### US-011: Create Pull Request
**As a** developer  
**I want to** create a PR from my branch  
**So that** I can request code review

**Acceptance Criteria:**
- [ ] Right-click branch → Create PR
- [ ] Select target branch
- [ ] Enter title and description
- [ ] Link Work Items
- [ ] Optionally auto-complete

---

### US-012: View Branch Policies
**As a** developer  
**I want to** see branch policy status  
**So that** I know what's required to merge

**Acceptance Criteria:**
- [ ] Show protected branch indicator
- [ ] Display required reviewers
- [ ] Show build policy status
- [ ] Link to policy settings

---

*Version: 1.0*
