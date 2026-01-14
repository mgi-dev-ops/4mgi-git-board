# 4MGI Git Board - Testing Strategy

## 1. Testing Pyramid

**Levels (bottom to top):**
- **Unit Tests** - Many, fast, foundational
- **Integration Tests** - Some, medium speed
- **E2E Tests** - Few, slow, high confidence

---

## 2. Unit Testing

### 2.1 Coverage Targets

| Module | Target Coverage |
|--------|-----------------|
| Core entities | 90%+ |
| Git service | 85%+ |
| Utility functions | 95%+ |
| React components | 80%+ |
| Store logic | 85%+ |

### 2.2 Test Categories

**Git Service Tests:**
- Parse commit log correctly
- Handle branch operations
- Stage/unstage files
- Error cases

**Graph Layout Tests:**
- Calculate node positions
- Handle merge commits
- Handle parallel branches
- Edge connection logic

**UI Component Tests:**
- Render states
- User interactions
- Accessibility

**Azure Integration Tests:**
- API response parsing
- Work Item linking
- PR status handling

---

## 3. Integration Testing

### 3.1 Extension + Webview

| Test Case | Description |
|-----------|-------------|
| Message protocol | Request/response flow |
| State sync | Store updates after Git ops |
| Error propagation | Errors reach UI correctly |

### 3.2 Git Integration

| Test Case | Description |
|-----------|-------------|
| Real repository | Operations on test repo |
| Edge cases | Empty repo, large repo |
| Conflict scenarios | Merge/rebase conflicts |

### 3.3 Azure Repos Integration

| Test Case | Description |
|-----------|-------------|
| Authentication | PAT validation |
| PR operations | Create, list, status |
| Work Items | Link, fetch, display |

---

## 4. E2E Testing

### 4.1 User Flows

| Flow | Steps |
|------|-------|
| View history | Open extension → See graph |
| Create branch | Right-click → Create → Name → Verify |
| Commit changes | Stage → Message → Commit → Verify |
| Rebase | Drag commit → Drop target → Confirm |
| Resolve conflict | Trigger conflict → Open resolver → Accept → Continue |
| Link Work Item | Select commit → Link WI → Verify badge |

### 4.2 Tools

- `@vscode/test-electron` - VS Code testing
- Playwright - Webview automation

---

## 5. Test Data

### 5.1 Test Repositories

| Repository | Purpose |
|------------|---------|
| `test-simple` | Basic operations |
| `test-complex` | Many branches, merges |
| `test-large` | 10k+ commits |
| `test-conflict` | Pre-setup conflicts |

### 5.2 Mock Data

- Mock Git responses
- Mock Azure DevOps API responses
- Mock VS Code APIs

---

## 6. Performance Testing

| Metric | Test Method |
|--------|-------------|
| Load time | Measure extension activation |
| Graph render | Profile with 1000 commits |
| Memory usage | Monitor over time |
| Responsiveness | Measure interaction latency |

---

## 7. Accessibility Testing

- Keyboard navigation coverage
- Screen reader compatibility
- Color contrast checks
- Focus management

---

*Version: 1.0*
