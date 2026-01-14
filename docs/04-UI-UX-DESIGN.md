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
| Commit right-click | Checkout, Cherry-pick, Revert, Reset, Copy SHA, Link Work Item |
| Branch right-click | Checkout, Merge, Rename, Delete, Push, Create PR |
| Selection | Squash, Rebase onto |

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

---

## 4. Interaction Patterns

### 4.1 Drag and Drop

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
