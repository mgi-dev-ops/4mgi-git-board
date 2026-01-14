# 4MGI Git Board - UI/UX Design Specification

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Intuitive** | Familiar Git concepts, minimal learning curve |
| **Visual** | Graph-first approach, icons over text |
| **Integrated** | Seamless VS Code experience |
| **Responsive** | Fast feedback, smooth animations |
| **Accessible** | Keyboard navigation, screen reader support |

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar                                                     │
│  [Fetch] [Pull] [Push] [Branch▼] [Search] [Filter] [⚙️]     │
├─────────────┬───────────────────────────────────────────────┤
│  Sidebar    │              Main Canvas                       │
│             │                                                │
│  Branches   │         ○ ─── commit1                         │
│  ├ main     │         │                                      │
│  ├ develop  │         ○ ─── commit2                         │
│  └ feature  │        /│\                                     │
│             │       ○ ○ ○ ── parallel branches              │
│  Stashes    │        \│/                                     │
│  └ WIP      │         ○ ─── merge commit                    │
│             │                                                │
│  Work Items │                                                │
│  └ #1234    │                                                │
│             ├───────────────────────────────────────────────┤
│             │  Detail Panel                                  │
│             │  [Commit Info] [Files Changed] [Diff]         │
│             │  [Work Items] [PR Status]                     │
└─────────────┴───────────────────────────────────────────────┘
```

### 2.1 Git Graph View (Default View)

Đây là trang mặc định khi mở extension. Hiển thị git graph với commit history và sidebar chi tiết.

#### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                                           │
│  ┌──────┐ ┌─────────────┬───┐  ┌───────────────────────────────────────┐   [Stash▼] [Branches+Tags]│
│  │ Pull │ │ Branch: dev │ ▼ │  │ 🔍 Search commits...                  │   [⟳ History] [⚙ Commits]│
│  └──────┘ └─────────────┴───┘  └───────────────────────────────────────┘                           │
├──────────────────────────────────────────────────────────────────────────────┬─────────────────────┤
│  DIFF SECTION (Collapsible)                                                  │                     │
│  ┌─ Unstaged ──────────────────────────────────────────────────────────────┐ │                     │
│  │  ● +6  -4   CONTINUITY.md                                       [Open]  │ │                     │
│  │  ● +103 -86  plans/deep-research-features.md                    [Open]  │ │                     │
│  └─────────────────────────────────────────────────────────────────────────┘ │                     │
│  [Commit] [Amend]                                                            │  COMMIT INFO        │
├──────────────────────────────────────────────────────────────────────────────┤  SIDEBAR            │
│  GRAPH AREA                                                                  │  (Right Panel)      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │                     │
│  │ ●────┬─────────────────────────────────────────────────────────────────┐│ │  ┌───────────────┐  │
│  │      │ 🔧 chore  Remove deadcode & obsolete file         [investm]  1d ││ │  │ [master] [dev]│  │
│  │ ●────┤ ← SELECTED (border highlight)                                   ││ │  │               │  │
│  │      │                                                                  ││ │  │ Title         │  │
│  │ ●────┤ 🔄 refactor  Convert WikiProgressWsDto...         Dan Lu    1w ││ │  │ feat: Remove  │  │
│  │      │                                                                  ││ │  │ deadcode...   │  │
│  │ ●────┤ ... 272 commits                                                 ││ │  │               │  │
│  │ │    │                                                                  ││ │  │ DESCRIPTION   │  │
│  │ ●────┼──● 📦 feat  Introduce Deep Research...   [origin/..] Dan 2w    ││ │  │ Signed-off-by │  │
│  │ │    │  │                                                               ││ │  │ <dan.lu@...>  │  │
│  │ ●────┼──● 🔧 chore  Enhance Azure DevOps integration...                ││ │  │               │  │
│  │ │    │  │                                                               ││ │  │ AUTHOR        │  │
│  │ ●────┼──● 🔄 refactor  Improve error handling...                       ││ │  │ Dan Lu        │  │
│  │ │    │  │                                                               ││ │  │ <email>       │  │
│  │ ●────┴──● 📦 feat  Enhance UI components...                            ││ │  │               │  │
│  │      │                                                                  ││ │  │ DATE          │  │
│  │ ●────┤ 🔧 chore  Implement dynamic model...                            ││ │  │ 1 week ago    │  │
│  │      │                                                                  ││ │  │ 1/9/2026 AM   │  │
│  │ ●────┤ 📦 feat  Introduce prompt migration...                          ││ │  │               │  │
│  │      │                                                                  ││ │  │ HEAD          │  │
│  │ ●────┤ 📦 feat  Migrate frontend wiki data...                          ││ │  │ cde6a...0106  │  │
│  │      │                                                                  ││ │  │               │  │
│  │ ●────┤ 🔄 refactor  Extract styles and prompts...                      ││ │  │ PARENT        │  │
│  │      │                                                                  ││ │  │ #f192be       │  │
│  │ ●────┤ 💥 feat(Backend)  Implement exponential backoff...              ││ │  └───────────────┘  │
│  │      │                                                                  ││ │                     │
│  │ ●────┤ 📦 feat  Introduce system prompt management...                  ││ │  FILES CHANGED      │
│  │      │                                                                  ││ │  ┌───────────────┐  │
│  └─────────────────────────────────────────────────────────────────────────┘│ │  │☐ -0  +1 AGENTS│  │
│                                                                              │ │  │☐ -608 Aski..  │  │
│  ● develop ← (new branch) 81 commit(s)                                       │ │  │☐ -899 AddIm.. │  │
└──────────────────────────────────────────────────────────────────────────────┴─┴───────────────────┘
```

#### Component Breakdown

##### A. Toolbar (Top Bar)

| Element | Description | Actions |
|---------|-------------|---------|
| **Pull Button** | Fetch and pull from remote | Click to pull |
| **Branch Selector** | Dropdown showing current branch | Switch branch, filter by branch |
| **Search Input** | Full-text search commits | Search by message, SHA, author |
| **Stash Dropdown** | Manage stashes | Apply, pop, drop stash |
| **Branches + Tags** | Toggle branch/tag display | Filter visible refs |
| **History Button** | Refresh commit history | Reload graph |
| **Commits Settings** | Graph display options | Columns, density, date format |

##### B. Diff Section (Collapsible)

```
┌─ Unstaged ─────────────────────────────────────────────────────────────────┐
│  File status │ +lines │ -lines │ Filename                          [Open] │
├────────────────────────────────────────────────────────────────────────────┤
│      ●       │   +6   │   -4   │ CONTINUITY.md                     [Open] │
│      ●       │  +103  │  -86   │ plans/deep-research-features.md   [Open] │
└────────────────────────────────────────────────────────────────────────────┘

Actions: [Commit] [Amend]
```

- **Staged/Unstaged tabs**: Toggle giữa staged và unstaged files
- **File row**: Status indicator, diff stats (+/-), filename, open button
- **Commit/Amend buttons**: Quick commit actions

##### C. Graph Area (Main Content)

| Column | Width | Content |
|--------|-------|---------|
| **Graph Lines** | ~50px | Visual branch/merge lines với colored dots |
| **Type Badge** | ~80px | Commit type icon + label (feat/fix/chore/refactor) |
| **Message** | flex | Commit message (truncated) |
| **Branch Refs** | auto | Branch/tag labels `[origin/main]` `[develop]` |
| **Author** | ~100px | Commit author name |
| **Date** | ~80px | Relative date (1d, 2w, 3mo) |

**Commit Type Badges:**

| Badge | Emoji | Color | Meaning |
|-------|-------|-------|---------|
| feat | 📦 | `#4CAF50` green | New feature |
| fix | 🐛 | `#F44336` red | Bug fix |
| chore | 🔧 | `#9E9E9E` gray | Maintenance |
| refactor | 🔄 | `#2196F3` blue | Code refactor |
| docs | 📚 | `#9C27B0` purple | Documentation |
| style | 🎨 | `#E91E63` pink | Styling |
| test | 🧪 | `#00BCD4` cyan | Tests |
| perf | ⚡ | `#FF9800` orange | Performance |

**Graph Line Colors:**

```css
--graph-line-1: #4CAF50;  /* main/master - green */
--graph-line-2: #2196F3;  /* develop - blue */
--graph-line-3: #9C27B0;  /* feature branches - purple */
--graph-line-4: #FF9800;  /* release - orange */
--graph-line-5: #F44336;  /* hotfix - red */
--graph-line-6: #00BCD4;  /* other - cyan */
```

##### D. Commit Info Sidebar (Right Panel)

Hiển thị khi click vào một commit (commit được highlight với border):

```
┌────────────────────────────────────────┐
│  BRANCH TAGS                           │
│  ┌─────────┐ ┌─────────┐               │
│  │ master  │ │ develop │               │
│  └─────────┘ └─────────┘               │
├────────────────────────────────────────┤
│  TITLE                                 │
│  feat: Remove deadcode & obsolete file │
├────────────────────────────────────────┤
│  DESCRIPTION                           │
│  Signed-off-by: Dan Lu                 │
│  <dan.lu@organization.com>             │
├────────────────────────────────────────┤
│  AUTHOR                                │
│  👤 Dan Lu                             │
│     dan.lu@organization.com            │
├────────────────────────────────────────┤
│  DATE                                  │
│  📅 1 week ago                         │
│     1/9/2026, 12:16:50 AM              │
├────────────────────────────────────────┤
│  HEAD                                  │
│  🔗 cde6a0d5483a251...3d1bd106         │
├────────────────────────────────────────┤
│  PARENT                                │
│  🔗 #f192be                            │
├────────────────────────────────────────┤
│  FILES CHANGED                         │
│  ┌────────────────────────────────────┐│
│  │☐│ -0   │ +1   │ AGENTS.md         ││
│  │☐│ -608 │      │ AskIntelClient.cs ││
│  │☐│ -899 │      │ AddIm...apps/fron ││
│  │☐│ -189 │      │ BranchSelection.. ││
│  │☐│ ...                              ││
│  └────────────────────────────────────┘│
│                                        │
│  [View Full Diff] [Cherry-pick] [Copy] │
└────────────────────────────────────────┘
```

**Files Changed Table:**

| Column | Description |
|--------|-------------|
| Checkbox | Select files for cherry-pick/diff |
| Lines Removed | `-N` in red |
| Lines Added | `+N` in green |
| Filepath | Truncated path, hover for full |

##### E. Status Bar (Bottom)

```
● develop ← (new branch) 81 commit(s)
```

- Current branch indicator
- Sync status with remote
- Total commits ahead/behind

#### Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select commit | Click on row | Highlight row + show sidebar |
| View diff | Double-click row | Open diff in editor |
| Context menu | Right-click row | Checkout, cherry-pick, revert, etc. |
| Expand collapsed | Click "... N commits" | Show hidden commits |
| Open file | Click [Open] in diff section | Open file in editor |
| Copy SHA | Click SHA in sidebar | Copy to clipboard |
| View parent | Click parent hash | Jump to parent commit |

---

### 2.2 Interactive Rebase View

Mở khi user chọn "Interactive Rebase" từ context menu hoặc command palette. Equivalent với `git rebase -i HEAD~N`.

#### Entry Points

| Trigger | Command |
|---------|---------|
| Right-click commit → "Interactive Rebase from here" | `git rebase -i <commit>^` |
| Command Palette → "Git: Interactive Rebase" | Prompt for range |
| Keyboard `r` on selected commit | `git rebase -i <commit>^` |
| Select multiple commits → Right-click → "Rebase Selected" | `git rebase -i` with selection |

#### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  INTERACTIVE REBASE                                                          [✕ Close] │
│  Rebasing onto: main (abc123f)                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─ COMMIT LIST ───────────────────────────────────────────────────────────────────┐  │
│  │                                                                                  │  │
│  │  ⋮⋮  [pick ▼]   abc123f   feat: Add new dashboard component          Dan Lu    │  │
│  │  ⋮⋮  [squash ▼] def456a   fix: Fix dashboard layout                  Dan Lu    │  │
│  │  ⋮⋮  [pick ▼]   ghi789b   feat: Add chart widget                     Dan Lu    │  │
│  │  ⋮⋮  [reword ▼] jkl012c   docs: Update README                        Dan Lu    │  │
│  │  ⋮⋮  [drop ▼]   mno345d   chore: Remove debug logs         ← STRIKETHROUGH     │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─ PREVIEW ────────────────────────────────────────────────────────────────────────┐  │
│  │  After rebase (4 commits):                                                       │  │
│  │  ● abc123f  feat: Add new dashboard component                                    │  │
│  │  ● def456a  fix: Fix dashboard layout (squashed into above)                      │  │
│  │  ● ghi789b  feat: Add chart widget                                               │  │
│  │  ● jkl012c  docs: Update README (message will be edited)                         │  │
│  │  ✕ mno345d  chore: Remove debug logs (will be dropped)                           │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ⚠️ Warning: This will rewrite 5 commits. Force push may be required.                 │
│                                                                                        │
│  [Cancel]                                              [Start Rebase]                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Commit Row Structure

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  ⋮⋮   [action ▼]   SHA        Message                              Author      Date   │
│  ↑                  ↑          ↑                                    ↑           ↑     │
│  Drag              Action     Commit                                Metadata          │
│  Handle            Dropdown   Info                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Drag Handle** `⋮⋮` | Grab để reorder commit lên/xuống |
| **Action Dropdown** | Chọn action cho commit này |
| **SHA** | Short commit hash, click để copy |
| **Message** | Commit message, truncated |
| **Author** | Commit author |
| **Date** | Relative date |

#### Commit Actions

##### Label Modes

Toggle: **"Simplified Labels"** trong Settings. Khi bật, tất cả Git terminology chuyển sang ngôn ngữ thông thường.

| Git Term | Simplified Label | Icon | Description |
|----------|------------------|------|-------------|
| `pick` | **Keep** | ✓ | Giữ commit nguyên vẹn |
| `reword` | **Edit Message** | ✏️ | Giữ code, chỉ sửa commit message |
| `edit` | **Edit Code** | ⏸️ | Pause để sửa code, sau đó tiếp tục |
| `squash` | **Merge (keep messages)** | 🔗 | Gộp vào commit trước, giữ cả 2 messages |
| `fixup` | **Merge (discard message)** | 🔧 | Gộp vào commit trước, bỏ message này |
| `drop` | **Delete** | 🗑️ | Xóa commit hoàn toàn |

##### Visual Effects by Action

| Action | Visual Effect |
|--------|---------------|
| Keep / pick | Normal appearance |
| Edit Message / reword | Italic message, blue left border |
| Edit Code / edit | Yellow highlight background |
| Merge (keep) / squash | Indented, connected line to above |
| Merge (discard) / fixup | Indented, faded, dashed line |
| Delete / drop | Strikethrough, red background |

#### Action Dropdown UI

**Standard Mode:**

```
┌────────────────────┐
│ ✓  pick            │
│ ✏️  reword          │
│ ⏸️  edit            │
│ 🔗  squash          │
│ 🔧  fixup           │
│ 🗑️  drop            │
└────────────────────┘
```

**Simplified Labels Mode:**

```
┌─────────────────────────────────────┐
│  KEEP / REMOVE                      │
│  ├ ✓  Keep                          │
│  └ 🗑️ Delete                        │
├─────────────────────────────────────┤
│  EDIT                               │
│  ├ ✏️  Edit Message                  │
│  └ ⏸️  Edit Code (will pause)        │
├─────────────────────────────────────┤
│  MERGE WITH PREVIOUS COMMIT         │
│  ├ 🔗 Merge (keep both messages)    │
│  └ 🔧 Merge (discard this message)  │
└─────────────────────────────────────┘
```

#### Tooltips (Always Shown on Hover)

Mỗi action có tooltip giải thích chi tiết:

```
┌────────────────────────────────────────┐
│ 🔧 Merge (discard this message)       │
│ ──────────────────────────────────     │
│ Combines this commit with the one      │
│ above it. The code changes are kept,   │
│ but this commit's message is removed.  │
│                                        │
│ ⌨️ Shortcut: f                          │
│ 📖 Git equivalent: fixup               │
└────────────────────────────────────────┘
```

**Tooltip content cho mỗi action:**

| Action | Tooltip Title | Tooltip Description |
|--------|---------------|---------------------|
| Keep | "Keep this commit" | "The commit stays exactly as it is. No changes." |
| Edit Message | "Change the commit message" | "Opens an editor to modify the message. Code stays the same." |
| Edit Code | "Pause to edit this commit" | "Rebase will stop here. Make changes, then run 'Continue Rebase'." |
| Merge (keep) | "Combine with previous commit" | "Merges into the commit above. You'll edit the combined message." |
| Merge (discard) | "Combine, remove this message" | "Merges into the commit above. Only the previous message is kept." |
| Delete | "Remove this commit entirely" | "The commit and its changes will be removed from history." |

#### Visual States by Action

```css
/* pick - default */
.commit-row.pick {
  opacity: 1;
  background: var(--bg-primary);
}

/* reword - pending message edit */
.commit-row.reword {
  border-left: 3px solid var(--info-blue);
}
.commit-row.reword .message {
  font-style: italic;
}

/* edit - will pause */
.commit-row.edit {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid var(--warning-yellow);
}

/* squash - merge up */
.commit-row.squash {
  margin-left: 20px;
  border-left: 2px solid var(--graph-line-2);
}
.commit-row.squash::before {
  content: "↳";
  color: var(--graph-line-2);
}

/* fixup - merge up, discard message */
.commit-row.fixup {
  margin-left: 20px;
  opacity: 0.7;
  border-left: 2px dashed var(--graph-line-2);
}

/* drop - remove */
.commit-row.drop {
  opacity: 0.5;
  background: rgba(244, 67, 54, 0.1);
}
.commit-row.drop .message,
.commit-row.drop .sha {
  text-decoration: line-through;
  color: var(--status-deleted);
}
```

#### Drag and Drop Reorder

| State | Visual |
|-------|--------|
| **Idle** | Normal row appearance |
| **Grab** | Cursor: `grab`, drag handle highlighted |
| **Dragging** | Row opacity 0.7, elevation shadow, cursor: `grabbing` |
| **Drop Zone** | Blue insertion line between rows |
| **Invalid Drop** | Red highlight, no insertion line |
| **After Drop** | Smooth animation to new position (200ms) |

```
DRAG STATE:
┌────────────────────────────────────────────────────────────────┐
│  ⋮⋮  [pick ▼]   abc123f   feat: Add new dashboard...          │  ← Fixed
├─────────────────── ▼ DROP HERE ▼ ──────────────────────────────┤  ← Drop zone
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ⋮⋮  [pick ▼]   ghi789b   feat: Add chart widget   ░░░░  │  │  ← Dragging
│  └──────────────────────────────────────────────────────────┘  │     (shadow)
│  ⋮⋮  [pick ▼]   def456a   fix: Fix dashboard layout           │  ← Fixed
└────────────────────────────────────────────────────────────────┘
```

#### Reword Dialog

Khi action = `reword` và user click "Start Rebase", hoặc double-click row:

```
┌────────────────────────────────────────────────────────────────┐
│  EDIT COMMIT MESSAGE                                    [✕]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Commit: jkl012c                                               │
│  Original message: docs: Update README                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ docs: Update README with installation guide              │  │
│  │                                                          │  │
│  │ - Added yarn install instructions                         │  │
│  │ - Added configuration examples                           │  │
│  │ - Fixed typos                                            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  💡 First line = subject (50 chars), body after blank line    │
│                                                                │
│  [Cancel]                                        [Save & Next] │
└────────────────────────────────────────────────────────────────┘
```

#### Squash Commit Message Editor

Khi có squash/fixup, after rebase execution:

```
┌────────────────────────────────────────────────────────────────┐
│  SQUASH COMMIT MESSAGE                                  [✕]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Combining 2 commits:                                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ feat: Add new dashboard component                        │  │
│  │                                                          │  │
│  │ # This is a combination of 2 commits.                    │  │
│  │ # This is the 1st commit message:                        │  │
│  │                                                          │  │
│  │ feat: Add new dashboard component                        │  │
│  │                                                          │  │
│  │ # This is the 2nd commit message:                        │  │
│  │                                                          │  │
│  │ fix: Fix dashboard layout                                │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Lines starting with # will be ignored.                        │
│                                                                │
│  [Abort Rebase]                               [Continue Rebase]│
└────────────────────────────────────────────────────────────────┘
```

#### Conflict Resolution View

Khi rebase gặp conflict:

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ REBASE CONFLICT                                     [✕]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Conflict in commit: ghi789b (feat: Add chart widget)          │
│  Progress: 2/5 commits applied                                 │
│                                                                │
│  ┌─ CONFLICTED FILES ───────────────────────────────────────┐  │
│  │  ⚠️  src/components/Chart.tsx                    [Resolve]│  │
│  │  ⚠️  src/styles/dashboard.css                    [Resolve]│  │
│  │  ✓  src/utils/helpers.ts                         Resolved │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  After resolving all conflicts, stage the changes and continue.│
│                                                                │
│  [Abort Rebase]    [Skip Commit]           [Continue Rebase]   │
└────────────────────────────────────────────────────────────────┘
```

| Button | Git Command | Description |
|--------|-------------|-------------|
| **Abort Rebase** | `git rebase --abort` | Cancel và restore original |
| **Skip Commit** | `git rebase --skip` | Bỏ qua commit này |
| **Continue Rebase** | `git rebase --continue` | Tiếp tục sau khi resolve |

#### Keyboard Shortcuts (trong Interactive Rebase View)

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate commits |
| `p` | Set action = pick |
| `r` | Set action = reword |
| `e` | Set action = edit |
| `s` | Set action = squash |
| `f` | Set action = fixup |
| `d` | Set action = drop |
| `Ctrl+↑` | Move commit up |
| `Ctrl+↓` | Move commit down |
| `Enter` | Edit message (if reword) |
| `Escape` | Cancel / Close dialog |
| `Ctrl+Enter` | Start Rebase |

#### Progress Indicator

During rebase execution:

```
┌────────────────────────────────────────────────────────────────┐
│  REBASE IN PROGRESS                                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░  3/5 commits            │
│                                                                │
│  ✓ abc123f  feat: Add new dashboard component                  │
│  ✓ def456a  fix: Fix dashboard layout (squashed)               │
│  ● ghi789b  feat: Add chart widget                   APPLYING  │
│  ○ jkl012c  docs: Update README                                │
│  ✕ mno345d  chore: Remove debug logs                 DROPPED   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

| Symbol | Status |
|--------|--------|
| ✓ | Completed |
| ● | In progress |
| ○ | Pending |
| ✕ | Dropped/Skipped |
| ⚠️ | Conflict |

#### Undo After Rebase

```
┌────────────────────────────────────────────────────────────────┐
│  ✓ Rebase completed successfully                               │
│                                                                │
│  5 commits rewritten. Branch: develop                          │
│                                                                │
│  [Undo Rebase]                                    [Force Push] │
└────────────────────────────────────────────────────────────────┘
```

| Action | Command | Notes |
|--------|---------|-------|
| **Undo Rebase** | `git reset --hard ORIG_HEAD` | Restore to before rebase |
| **Force Push** | `git push --force-with-lease` | Push rewritten history |

---

## 3. Component Specifications

### 3.1 Commit Node

```
┌──────────────────────────────────────┐
│  ●  abc123f  │  feat: add feature   │  ← Short message
│     Author   │  2h ago              │  ← Metadata
│  [main] [PR#42✓] [#WI-1234]         │  ← Labels
└──────────────────────────────────────┘

States: default, hover, selected, dragging
Colors: branch-specific color coding
Azure badge: Work Item linked indicator
```

### 3.2 Branch Line

- Bezier curves connecting commits
- Color-coded per branch
- Animated on changes
- Protected branch indicator (lock icon)

### 3.3 Context Menu

| Trigger | Actions |
|---------|---------|
| Commit right-click | Checkout, Cherry-pick, Revert, Reset, Copy SHA, Link Work Item, **View Build**, **Rebuild** |
| Branch right-click | Checkout, Merge, Rename, Delete, Push, Create PR, **View Policies** |
| Selection | Squash, Rebase onto |
| Build badge click | **View Build Details**, **Open in Azure DevOps** |

### 3.4 Work Item Panel

```
┌──────────────────────────────────────┐
│  Work Item #1234                     │
│  ─────────────────────────           │
│  Title: Implement feature X          │
│  State: Active                       │
│  Assigned: John Doe                  │
│  ─────────────────────────           │
│  Linked Commits: 3                   │
│  [Open in Azure DevOps]              │
└──────────────────────────────────────┘
```

### 3.5 Build Details Panel

```
┌──────────────────────────────────────┐
│  Build #20260114.5    ✓ Succeeded    │
│  ─────────────────────────           │
│  Pipeline: CI-Main                   │
│  Duration: 3m 42s                    │
│  ─────────────────────────           │
│  Tests: 147 passed │ 0 failed        │
│  Coverage: 82.3%                     │
│  ─────────────────────────           │
│  [View Logs] [Rebuild] [Open in ADO] │
└──────────────────────────────────────┘
```

### 3.6 Policy Status Panel

```
┌──────────────────────────────────────┐
│  Branch Policies: main               │
│  ─────────────────────────           │
│  ✓ Minimum 2 reviewers               │
│  ✓ Linked work items required        │
│  ✗ Build validation (failed)         │
│  ○ Comment resolution (pending)      │
│  ─────────────────────────           │
│  [View Details]                      │
└──────────────────────────────────────┘
```

---

## 4. Interaction Patterns

### 4.1 Drag and Drop

> **Implementation Note:** @gitgraph/js không hỗ trợ drag-drop native. Cần custom implementation layer với HTML5 Drag and Drop API hoặc thư viện như `@dnd-kit/core` overlay trên graph canvas.

| Action | Trigger | Preview | Result |
|--------|---------|---------|--------|
| Rebase | Drag commits onto branch | Ghost commits | Rebase dialog |
| Cherry-pick | Drag commit to branch | + indicator | Apply commit |
| Reorder | Drag within branch | Insertion line | Rebase -i |

### 4.2 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Toggle expand commit |
| `Enter` | Checkout/Open |
| `c` | Commit |
| `p` | Push |
| `f` | Fetch |
| `Ctrl+Z` | Undo |
| `/` | Search |
| `w` | Link Work Item |

---

## 5. Color Palette

```css
/* Branch Colors */
--branch-main: #4CAF50;
--branch-develop: #2196F3;
--branch-feature: #9C27B0;
--branch-hotfix: #F44336;
--branch-release: #FF9800;

/* Status Colors */
--status-added: #4CAF50;
--status-modified: #FF9800;
--status-deleted: #F44336;
--status-conflict: #E91E63;

/* Azure DevOps Colors */
--azure-pr-active: #0078D4;
--azure-pr-approved: #107C10;
--azure-workitem: #009CCC;

/* Pipeline Status Colors */
--pipeline-running: #0078D4;
--pipeline-succeeded: #107C10;
--pipeline-failed: #D13438;
--pipeline-canceled: #8A8886;
--pipeline-partial: #FFB900;

/* Policy Status Colors */
--policy-approved: #107C10;
--policy-rejected: #D13438;
--policy-pending: #FFB900;

/* UI Colors - follows VS Code theme */
--bg-primary: var(--vscode-editor-background);
--text-primary: var(--vscode-editor-foreground);
```

---

## 6. Animation Guidelines

| Element | Animation | Duration |
|---------|-----------|----------|
| Node appear | Fade + scale | 200ms |
| Node drag | Opacity 0.7 | - |
| Graph update | Smooth transition | 300ms |
| Panel slide | Slide in/out | 250ms |

---

## 7. Accessibility

- **Focus indicators**: Visible focus rings
- **Keyboard**: Full keyboard navigation
- **ARIA**: Labels for interactive elements
- **Contrast**: Meets WCAG AA standards
- **Motion**: Respect `prefers-reduced-motion`

---

*Version: 1.0*
