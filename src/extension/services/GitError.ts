/**
 * Git Error handling
 * Maps simple-git errors to application error codes as defined in docs/07-ERROR-HANDLING.md
 */

// =============================================================================
// Error Codes (from docs/07-ERROR-HANDLING.md)
// =============================================================================

export enum GitErrorCode {
  // Git Errors (GIT-001 to GIT-099)
  NOT_A_REPOSITORY = "GIT-001",
  MERGE_CONFLICT = "GIT-002",
  REBASE_CONFLICT = "GIT-003",
  UNCOMMITTED_CHANGES = "GIT-004",
  BRANCH_EXISTS = "GIT-005",
  CANNOT_DELETE_CURRENT = "GIT-006",
  DETACHED_HEAD = "GIT-007",
  PUSH_REJECTED = "GIT-008",
  BRANCH_NOT_FOUND = "GIT-009",
  COMMIT_NOT_FOUND = "GIT-010",
  NOTHING_TO_COMMIT = "GIT-011",
  LOCK_FILE_EXISTS = "GIT-012",
  INVALID_BRANCH_NAME = "GIT-013",
  REBASE_IN_PROGRESS = "GIT-014",
  MERGE_IN_PROGRESS = "GIT-015",
  CHERRY_PICK_IN_PROGRESS = "GIT-016",
  STASH_NOT_FOUND = "GIT-017",
  NO_REMOTE = "GIT-018",
  SHALLOW_CLONE_LIMIT = "GIT-019",
  UNKNOWN_GIT_ERROR = "GIT-099",
}

// =============================================================================
// Error Messages
// =============================================================================

const ERROR_MESSAGES: Record<GitErrorCode, string> = {
  [GitErrorCode.NOT_A_REPOSITORY]: "This folder is not a Git repository",
  [GitErrorCode.MERGE_CONFLICT]: "Merge conflicts detected",
  [GitErrorCode.REBASE_CONFLICT]: "Rebase paused due to conflicts",
  [GitErrorCode.UNCOMMITTED_CHANGES]: "You have uncommitted changes",
  [GitErrorCode.BRANCH_EXISTS]: "Branch already exists",
  [GitErrorCode.CANNOT_DELETE_CURRENT]: "Cannot delete current branch",
  [GitErrorCode.DETACHED_HEAD]: "You are in detached HEAD state",
  [GitErrorCode.PUSH_REJECTED]: "Push rejected, pull first",
  [GitErrorCode.BRANCH_NOT_FOUND]: "Branch not found",
  [GitErrorCode.COMMIT_NOT_FOUND]: "Commit not found",
  [GitErrorCode.NOTHING_TO_COMMIT]: "Nothing to commit",
  [GitErrorCode.LOCK_FILE_EXISTS]: "Repository is locked. Another git process may be running",
  [GitErrorCode.INVALID_BRANCH_NAME]: "Invalid branch name",
  [GitErrorCode.REBASE_IN_PROGRESS]: "Rebase already in progress",
  [GitErrorCode.MERGE_IN_PROGRESS]: "Merge already in progress",
  [GitErrorCode.CHERRY_PICK_IN_PROGRESS]: "Cherry-pick already in progress",
  [GitErrorCode.STASH_NOT_FOUND]: "Stash entry not found",
  [GitErrorCode.NO_REMOTE]: "No remote repository configured",
  [GitErrorCode.SHALLOW_CLONE_LIMIT]: "Operation not supported on shallow clone",
  [GitErrorCode.UNKNOWN_GIT_ERROR]: "An unknown git error occurred",
};

// =============================================================================
// GitError Class
// =============================================================================

export class GitError extends Error {
  public readonly code: GitErrorCode;
  public readonly userMessage: string;
  public readonly recoverable: boolean;
  public readonly originalError?: Error;

  constructor(
    code: GitErrorCode,
    originalError?: Error,
    additionalInfo?: string
  ) {
    const userMessage = ERROR_MESSAGES[code];
    const fullMessage = additionalInfo
      ? `${userMessage}: ${additionalInfo}`
      : userMessage;

    super(fullMessage);
    this.name = "GitError";
    this.code = code;
    this.userMessage = fullMessage;
    this.originalError = originalError;
    this.recoverable = isRecoverableError(code);

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GitError);
    }
  }

  /**
   * Convert to JSON for logging/serialization
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }
}

// =============================================================================
// Error Detection Patterns
// =============================================================================

const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  code: GitErrorCode;
}> = [
  {
    pattern: /not a git repository/i,
    code: GitErrorCode.NOT_A_REPOSITORY,
  },
  {
    pattern: /conflict|CONFLICT/,
    code: GitErrorCode.MERGE_CONFLICT,
  },
  {
    pattern: /rebase.*conflict|conflict.*rebase/i,
    code: GitErrorCode.REBASE_CONFLICT,
  },
  {
    pattern: /uncommitted changes|dirty|local changes/i,
    code: GitErrorCode.UNCOMMITTED_CHANGES,
  },
  {
    pattern: /already exists|branch.*exists/i,
    code: GitErrorCode.BRANCH_EXISTS,
  },
  {
    pattern: /cannot delete.*checked out|delete.*current/i,
    code: GitErrorCode.CANNOT_DELETE_CURRENT,
  },
  {
    pattern: /HEAD detached|detached HEAD/i,
    code: GitErrorCode.DETACHED_HEAD,
  },
  {
    pattern: /rejected|non-fast-forward|fetch first/i,
    code: GitErrorCode.PUSH_REJECTED,
  },
  {
    pattern: /branch.*not found|no such branch|unknown branch/i,
    code: GitErrorCode.BRANCH_NOT_FOUND,
  },
  {
    pattern: /commit.*not found|unknown revision|bad revision/i,
    code: GitErrorCode.COMMIT_NOT_FOUND,
  },
  {
    pattern: /nothing to commit|no changes/i,
    code: GitErrorCode.NOTHING_TO_COMMIT,
  },
  {
    pattern: /\.lock|index\.lock|Unable to create.*lock/i,
    code: GitErrorCode.LOCK_FILE_EXISTS,
  },
  {
    pattern: /invalid.*branch.*name|bad branch name/i,
    code: GitErrorCode.INVALID_BRANCH_NAME,
  },
  {
    pattern: /rebase.*in progress|interactive rebase/i,
    code: GitErrorCode.REBASE_IN_PROGRESS,
  },
  {
    pattern: /merge.*in progress|you are in the middle of a merge/i,
    code: GitErrorCode.MERGE_IN_PROGRESS,
  },
  {
    pattern: /cherry-pick.*in progress/i,
    code: GitErrorCode.CHERRY_PICK_IN_PROGRESS,
  },
  {
    pattern: /no stash entries|stash.*not found/i,
    code: GitErrorCode.STASH_NOT_FOUND,
  },
  {
    pattern: /no.*remote|remote.*not.*found/i,
    code: GitErrorCode.NO_REMOTE,
  },
  {
    pattern: /shallow.*clone|--unshallow/i,
    code: GitErrorCode.SHALLOW_CLONE_LIMIT,
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if error code is recoverable
 */
function isRecoverableError(code: GitErrorCode): boolean {
  const recoverableCodes: GitErrorCode[] = [
    GitErrorCode.MERGE_CONFLICT,
    GitErrorCode.REBASE_CONFLICT,
    GitErrorCode.UNCOMMITTED_CHANGES,
    GitErrorCode.BRANCH_EXISTS,
    GitErrorCode.CANNOT_DELETE_CURRENT,
    GitErrorCode.DETACHED_HEAD,
    GitErrorCode.PUSH_REJECTED,
    GitErrorCode.NOTHING_TO_COMMIT,
    GitErrorCode.LOCK_FILE_EXISTS,
    GitErrorCode.REBASE_IN_PROGRESS,
    GitErrorCode.MERGE_IN_PROGRESS,
    GitErrorCode.CHERRY_PICK_IN_PROGRESS,
  ];

  return recoverableCodes.includes(code);
}

/**
 * Parse error from simple-git and convert to GitError
 */
export function parseGitError(error: unknown): GitError {
  if (error instanceof GitError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;

  // Try to match error patterns
  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return new GitError(code, originalError);
    }
  }

  // Default to unknown error
  return new GitError(GitErrorCode.UNKNOWN_GIT_ERROR, originalError, errorMessage);
}

/**
 * Wrap async function with error handling
 */
export function withGitErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw parseGitError(error);
    }
  };
}

/**
 * Type guard for GitError
 */
export function isGitError(error: unknown): error is GitError {
  return error instanceof GitError;
}

/**
 * Check if error indicates conflicts
 */
export function hasConflicts(error: unknown): boolean {
  if (!isGitError(error)) {
    return false;
  }

  return (
    error.code === GitErrorCode.MERGE_CONFLICT ||
    error.code === GitErrorCode.REBASE_CONFLICT
  );
}
