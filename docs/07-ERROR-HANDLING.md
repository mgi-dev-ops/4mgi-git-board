# 4MGI Git Board - Error Handling & Edge Cases

## 1. Error Categories

| Category | Code Range | Description |
|----------|------------|-------------|
| Git Errors | GIT-001 to GIT-099 | Git operation failures |
| Auth Errors | AUTH-001 to AUTH-099 | Authentication issues |
| Network Errors | NET-001 to NET-099 | Network/API failures |
| UI Errors | UI-001 to UI-099 | UI state issues |
| System Errors | SYS-001 to SYS-099 | System-level failures |

---

## 2. Git Error Handling

### 2.1 Common Git Errors

| Code | Error | Cause | User Message | Recovery |
|------|-------|-------|--------------|----------|
| GIT-001 | Not a git repository | No .git folder | "This folder is not a Git repository" | Show init option |
| GIT-002 | Merge conflict | Conflicting changes | "Merge conflicts detected" | Open conflict resolver |
| GIT-003 | Rebase conflict | Rebase interrupted | "Rebase paused due to conflicts" | Continue/Abort options |
| GIT-004 | Uncommitted changes | Dirty working tree | "You have uncommitted changes" | Stash/Commit options |
| GIT-005 | Branch exists | Duplicate name | "Branch already exists" | Suggest alternative |
| GIT-006 | Cannot delete current | On active branch | "Cannot delete current branch" | Checkout first |
| GIT-007 | Detached HEAD | Not on branch | "You are in detached HEAD state" | Create branch option |
| GIT-008 | Push rejected | Non-fast-forward | "Push rejected, pull first" | Pull with rebase option |

### 2.2 Recovery Strategies

**Flow:**
1. Error Detected
2. Check if recoverable
3. If yes: Show action options → User decides
4. If no: Log + Show error toast

---

## 3. Edge Cases

### 3.1 Repository States

| State | Detection | Handling |
|-------|-----------|----------|
| Large repository (>10k commits) | Check on load | Enable pagination mode |
| Shallow clone | Check depth | Show warning, limit features |
| Bare repository | Check config | Disable workspace features |
| Submodules | Detect .gitmodules | Handle separately |
| Worktrees | Detect linked worktrees | Show worktree mode |
| Locked repository | .git/index.lock exists | Wait or offer cleanup |

### 3.2 Branch Edge Cases

| Case | Detection | Handling |
|------|-----------|----------|
| Orphan branch | No parent commit | Show indicator |
| Very long branch name | Length > 50 | Truncate with tooltip |
| Special characters in name | Regex check | Escape properly |
| Remote-only branch | No local tracking | Show differently |
| Protected branch | Azure policy check | Disable destructive ops |

### 3.3 Commit Edge Cases

| Case | Detection | Handling |
|------|-----------|----------|
| Empty commit | No file changes | Allow with warning |
| Very large diff | Diff size check | Lazy load, warn user |
| Binary files | MIME detection | Show binary indicator |
| Merge commit | Multiple parents | Special visualization |
| Initial commit | No parent | Root node styling |

---

## 4. Network Error Handling

### 4.1 API Failures

| Error | Cause | Retry Strategy |
|-------|-------|----------------|
| 401 Unauthorized | Token expired | Prompt re-authentication |
| 403 Forbidden | Insufficient scope | Request new permissions |
| 404 Not Found | Resource deleted | Remove from UI |
| 429 Rate Limited | Too many requests | Exponential backoff |
| 500 Server Error | Provider issue | Retry with backoff |
| Timeout | Network slow | Retry once, then offline mode |

### 4.2 Offline Mode

When network unavailable:
- Hide provider-dependent features
- Cache last known PR status
- Queue sync operations for later
- Show offline indicator

---

## 5. Azure Repos Specific Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Invalid PAT | Token expired/revoked | Prompt new token |
| Project not found | Wrong organization/project | Show config dialog |
| No access to repo | Permission denied | Show access request info |
| Policy violation | Branch policy not met | Show policy requirements |

---

## 6. User Error Prevention

### 6.1 Destructive Operation Guards

| Operation | Guard | Implementation |
|-----------|-------|----------------|
| Force push | Double confirmation | Type branch name to confirm |
| Delete branch | Confirmation dialog | Show affected commits |
| Reset hard | Warning + confirmation | Preview lost changes |
| Rebase published | Strong warning | Check if pushed |
| Drop commit | Confirmation | Show commit contents |

### 6.2 Input Validation

| Input | Validation | Error Message |
|-------|------------|---------------|
| Branch name | No spaces, valid chars | "Invalid branch name" |
| Commit message | Not empty | "Commit message required" |
| Work Item ID | Valid number | "Invalid Work Item ID" |
| PAT | Valid format | "Invalid token format" |

---

## 7. Graceful Degradation

| Feature | Fallback |
|---------|----------|
| React Flow fails | Simple list view |
| Azure API unavailable | Local-only mode |
| Git command hangs | Timeout + cancel option |
| Large diff | Truncate with "Load more" |
| Theme detection fails | Default dark theme |

---

*Version: 1.0*
