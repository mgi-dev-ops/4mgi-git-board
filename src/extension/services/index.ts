/**
 * Services barrel export
 */

export { GitService, createGitService } from "./GitService";
export { GitError, GitErrorCode, parseGitError, isGitError, hasConflicts } from "./GitError";
export type {
  SimpleGitLogEntry,
  SimpleGitBranchSummary,
  SimpleGitStatusResult,
  SimpleGitDiffSummary,
  SimpleGitRemote,
  SimpleGitStashEntry,
} from "./GitService.types";
