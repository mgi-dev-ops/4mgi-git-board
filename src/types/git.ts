/**
 * Git-related type definitions
 * Based on 06-API-REFERENCE.md
 */

// =============================================================================
// Core Entities
// =============================================================================

/**
 * Author information for a commit
 */
export interface Author {
  name: string;
  email: string;
}

/**
 * Reference (tag, branch) pointing to a commit
 */
export interface Ref {
  name: string;
  type: "head" | "tag" | "remote";
}

/**
 * Git commit information
 */
export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  body?: string;
  author: Author;
  date: string;
  parents: string[];
  refs: Ref[];
  workItemIds?: number[];
}

/**
 * Git branch information
 */
export interface Branch {
  name: string;
  current: boolean;
  remote?: string;
  tracking?: string;
  ahead: number;
  behind: number;
  commit?: string;
  label?: string;
  hasPolicy?: boolean;
}

/**
 * Git stash entry
 */
export interface Stash {
  index: number;
  message: string;
  date: string;
  hash: string;
}

// =============================================================================
// Status Types
// =============================================================================

/**
 * File status type
 */
export type FileStatusType =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "untracked";

/**
 * File status in staging area or working directory
 */
export interface FileStatus {
  path: string;
  status: FileStatusType;
  oldPath?: string;
}

/**
 * Git repository status
 */
export interface StatusResult {
  current: string;
  tracking?: string;
  detached: boolean;
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: string[];
  conflicted: string[];
  ahead: number;
  behind: number;
}

// =============================================================================
// Repository Info
// =============================================================================

/**
 * Remote repository info
 */
export interface RemoteInfo {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

/**
 * Repository basic information
 */
export interface RepositoryInfo {
  path: string;
  name: string;
  isGitRepository: boolean;
  isShallowClone: boolean;
  isBare: boolean;
  hasSubmodules: boolean;
  hasWorktrees: boolean;
  remotes: RemoteInfo[];
}

// =============================================================================
// Operation Results
// =============================================================================

/**
 * Merge operation result
 */
export interface MergeResult {
  success: boolean;
  conflicts: string[];
  mergeCommit?: string;
  message?: string;
}

/**
 * Diff file info
 */
export interface DiffFile {
  path: string;
  status: FileStatusType;
  insertions: number;
  deletions: number;
  binary: boolean;
  oldPath?: string;
}

/**
 * Diff result
 */
export interface DiffResult {
  files: DiffFile[];
  insertions: number;
  deletions: number;
  raw: string;
}

// =============================================================================
// Options
// =============================================================================

/**
 * Log options
 */
export interface LogOptions {
  limit?: number;
  branch?: string;
  author?: string;
  since?: string;
  until?: string;
  file?: string;
  all?: boolean;
}

/**
 * Commit options
 */
export interface CommitOptions {
  amend?: boolean;
  allowEmpty?: boolean;
  noVerify?: boolean;
}

/**
 * Merge options
 */
export interface MergeOptions {
  noFastForward?: boolean;
  squash?: boolean;
  message?: string;
  noCommit?: boolean;
}

/**
 * Rebase options
 */
export interface RebaseOptions {
  interactive?: boolean;
  autosquash?: boolean;
  onto?: string;
}

// =============================================================================
// Repository States
// =============================================================================

/**
 * Repository operation state
 */
export type RepositoryState =
  | "normal"
  | "merging"
  | "rebasing"
  | "cherryPicking"
  | "reverting"
  | "bisecting";

/**
 * Conflict information when merge/rebase fails
 */
export interface ConflictInfo {
  state: RepositoryState;
  conflictedFiles: string[];
  currentBranch?: string;
  incomingBranch?: string;
}
