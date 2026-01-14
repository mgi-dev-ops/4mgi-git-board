/**
 * ConflictService - Handles git conflict detection and resolution
 * Provides functionality for merge/rebase conflict resolution
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Conflict marker types
 */
export enum ConflictMarkerType {
  Start = "start", // <<<<<<<
  Separator = "separator", // =======
  End = "end", // >>>>>>>
  Base = "base", // |||||||
}

/**
 * Represents a single conflict hunk in a file
 */
export interface ConflictHunk {
  id: string;
  startLine: number;
  endLine: number;
  oursContent: string[];
  theirsContent: string[];
  baseContent?: string[];
  oursLabel: string;
  theirsLabel: string;
  baseLabel?: string;
  resolved: boolean;
  resolution?: "ours" | "theirs" | "both" | "manual";
  resolvedContent?: string[];
}

/**
 * Represents a conflicted file with all its hunks
 */
export interface ConflictedFile {
  path: string;
  relativePath: string;
  hunks: ConflictHunk[];
  resolved: boolean;
  originalContent: string;
}

/**
 * Conflict operation type
 */
export type ConflictOperationType = "merge" | "rebase" | "cherryPick" | "revert";

/**
 * Current conflict state
 */
export interface ConflictState {
  operation: ConflictOperationType;
  files: ConflictedFile[];
  currentCommit?: string;
  currentCommitMessage?: string;
  sourceBranch?: string;
  targetBranch?: string;
  progress?: {
    current: number;
    total: number;
  };
}

/**
 * Resolution result
 */
export interface ResolutionResult {
  success: boolean;
  error?: string;
}

/**
 * ConflictService class
 * Handles detection, parsing, and resolution of git conflicts
 */
export class ConflictService {
  private workspaceRoot: string;
  private gitDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.gitDir = path.join(workspaceRoot, ".git");
  }

  /**
   * Detect current conflict state from git repository
   */
  async detectConflicts(): Promise<ConflictState | null> {
    const operation = await this.detectOperation();
    if (!operation) {
      return null;
    }

    const conflictedFiles = await this.getConflictedFiles();
    if (conflictedFiles.length === 0) {
      return null;
    }

    const files: ConflictedFile[] = [];
    for (const filePath of conflictedFiles) {
      const parsed = await this.parseConflictedFile(filePath);
      if (parsed) {
        files.push(parsed);
      }
    }

    const state: ConflictState = {
      operation,
      files,
    };

    // Add operation-specific info
    if (operation === "rebase") {
      state.progress = await this.getRebaseProgress();
      state.currentCommit = await this.getCurrentRebaseCommit();
      state.currentCommitMessage = await this.getCurrentRebaseCommitMessage();
    } else if (operation === "merge") {
      state.sourceBranch = await this.getMergeHead();
      state.targetBranch = await this.getCurrentBranch();
    }

    return state;
  }

  /**
   * Detect the current git operation causing conflicts
   */
  private async detectOperation(): Promise<ConflictOperationType | null> {
    try {
      if (
        fs.existsSync(path.join(this.gitDir, "rebase-merge")) ||
        fs.existsSync(path.join(this.gitDir, "rebase-apply"))
      ) {
        return "rebase";
      }
      if (fs.existsSync(path.join(this.gitDir, "MERGE_HEAD"))) {
        return "merge";
      }
      if (fs.existsSync(path.join(this.gitDir, "CHERRY_PICK_HEAD"))) {
        return "cherryPick";
      }
      if (fs.existsSync(path.join(this.gitDir, "REVERT_HEAD"))) {
        return "revert";
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get list of conflicted files from git status
   */
  private async getConflictedFiles(): Promise<string[]> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const { stdout } = await execAsync("git diff --name-only --diff-filter=U", {
        cwd: this.workspaceRoot,
      });

      return stdout
        .trim()
        .split("\n")
        .filter((line) => line.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Parse conflict markers in a file
   */
  async parseConflictedFile(relativePath: string): Promise<ConflictedFile | null> {
    const fullPath = path.join(this.workspaceRoot, relativePath);

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      const hunks: ConflictHunk[] = [];

      let currentHunk: Partial<ConflictHunk> | null = null;
      let section: "ours" | "base" | "theirs" | null = null;
      let hunkIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Start of conflict: <<<<<<<
        if (line.startsWith("<<<<<<<")) {
          currentHunk = {
            id: `hunk-${hunkIndex++}`,
            startLine: i,
            oursContent: [],
            theirsContent: [],
            oursLabel: line.substring(8).trim() || "HEAD",
            resolved: false,
          };
          section = "ours";
          continue;
        }

        // Base section (diff3 style): |||||||
        if (line.startsWith("|||||||") && currentHunk) {
          currentHunk.baseContent = [];
          currentHunk.baseLabel = line.substring(8).trim() || "base";
          section = "base";
          continue;
        }

        // Separator: =======
        if (line.startsWith("=======") && currentHunk) {
          section = "theirs";
          continue;
        }

        // End of conflict: >>>>>>>
        if (line.startsWith(">>>>>>>") && currentHunk) {
          currentHunk.theirsLabel = line.substring(8).trim() || "incoming";
          currentHunk.endLine = i;
          hunks.push(currentHunk as ConflictHunk);
          currentHunk = null;
          section = null;
          continue;
        }

        // Add content to current section
        if (currentHunk && section) {
          if (section === "ours") {
            currentHunk.oursContent!.push(line);
          } else if (section === "base") {
            currentHunk.baseContent!.push(line);
          } else if (section === "theirs") {
            currentHunk.theirsContent!.push(line);
          }
        }
      }

      return {
        path: fullPath,
        relativePath,
        hunks,
        resolved: hunks.length === 0,
        originalContent: content,
      };
    } catch {
      return null;
    }
  }

  /**
   * Apply resolution for a specific hunk
   */
  async resolveHunk(
    filePath: string,
    hunkId: string,
    resolution: "ours" | "theirs" | "both",
    customContent?: string[]
  ): Promise<ResolutionResult> {
    try {
      const file = await this.parseConflictedFile(
        path.relative(this.workspaceRoot, filePath)
      );
      if (!file) {
        return { success: false, error: "File not found or no conflicts" };
      }

      const hunk = file.hunks.find((h) => h.id === hunkId);
      if (!hunk) {
        return { success: false, error: "Hunk not found" };
      }

      let resolvedContent: string[];
      switch (resolution) {
        case "ours":
          resolvedContent = hunk.oursContent;
          break;
        case "theirs":
          resolvedContent = hunk.theirsContent;
          break;
        case "both":
          resolvedContent = [...hunk.oursContent, ...hunk.theirsContent];
          break;
        default:
          resolvedContent = customContent || [];
      }

      // Apply resolution to file
      const lines = file.originalContent.split("\n");
      const beforeConflict = lines.slice(0, hunk.startLine);
      const afterConflict = lines.slice(hunk.endLine + 1);
      const newContent = [...beforeConflict, ...resolvedContent, ...afterConflict].join(
        "\n"
      );

      fs.writeFileSync(filePath, newContent, "utf-8");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply resolution for all hunks in a file
   */
  async resolveFile(
    filePath: string,
    resolution: "ours" | "theirs"
  ): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const flag = resolution === "ours" ? "--ours" : "--theirs";
      await execAsync(`git checkout ${flag} -- "${filePath}"`, {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Mark a file as resolved
   */
  async markFileResolved(filePath: string): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync(`git add "${filePath}"`, {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Abort current merge
   */
  async abortMerge(): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync("git merge --abort", {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Continue merge after resolving conflicts
   */
  async continueMerge(): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync('git commit --no-edit', {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Abort current rebase
   */
  async abortRebase(): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync("git rebase --abort", {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Continue rebase after resolving conflicts
   */
  async continueRebase(): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync("git rebase --continue", {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Skip current commit in rebase
   */
  async skipRebaseCommit(): Promise<ResolutionResult> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync("git rebase --skip", {
        cwd: this.workspaceRoot,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get rebase progress (current/total)
   */
  private async getRebaseProgress(): Promise<{ current: number; total: number } | undefined> {
    try {
      const rebaseMerge = path.join(this.gitDir, "rebase-merge");
      const rebaseApply = path.join(this.gitDir, "rebase-apply");

      let dir: string;
      if (fs.existsSync(rebaseMerge)) {
        dir = rebaseMerge;
      } else if (fs.existsSync(rebaseApply)) {
        dir = rebaseApply;
      } else {
        return undefined;
      }

      const msgnum = fs.readFileSync(path.join(dir, "msgnum"), "utf-8").trim();
      const end = fs.readFileSync(path.join(dir, "end"), "utf-8").trim();

      return {
        current: parseInt(msgnum, 10),
        total: parseInt(end, 10),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get current rebase commit SHA
   */
  private async getCurrentRebaseCommit(): Promise<string | undefined> {
    try {
      const rebaseMerge = path.join(this.gitDir, "rebase-merge");
      const stoppedSha = path.join(rebaseMerge, "stopped-sha");

      if (fs.existsSync(stoppedSha)) {
        return fs.readFileSync(stoppedSha, "utf-8").trim().substring(0, 7);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current rebase commit message
   */
  private async getCurrentRebaseCommitMessage(): Promise<string | undefined> {
    try {
      const rebaseMerge = path.join(this.gitDir, "rebase-merge");
      const message = path.join(rebaseMerge, "message");

      if (fs.existsSync(message)) {
        return fs.readFileSync(message, "utf-8").trim().split("\n")[0];
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get MERGE_HEAD (source branch of merge)
   */
  private async getMergeHead(): Promise<string | undefined> {
    try {
      const mergeHead = path.join(this.gitDir, "MERGE_HEAD");
      if (fs.existsSync(mergeHead)) {
        const sha = fs.readFileSync(mergeHead, "utf-8").trim();
        // Try to get branch name from reflog or use short sha
        return sha.substring(0, 7);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current branch name
   */
  private async getCurrentBranch(): Promise<string | undefined> {
    try {
      const head = fs.readFileSync(path.join(this.gitDir, "HEAD"), "utf-8").trim();
      const match = head.match(/^ref: refs\/heads\/(.+)$/);
      return match ? match[1] : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Open file in VS Code diff editor
   */
  async openInDiffEditor(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand("vscode.open", uri);
  }

  /**
   * Get three-way diff content for a file
   */
  async getThreeWayDiff(
    filePath: string
  ): Promise<{ base: string; ours: string; theirs: string } | null> {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const relativePath = path.relative(this.workspaceRoot, filePath);

      // Get base version (common ancestor)
      let base = "";
      try {
        const { stdout } = await execAsync(`git show :1:"${relativePath}"`, {
          cwd: this.workspaceRoot,
        });
        base = stdout;
      } catch {
        // Base may not exist for new files
      }

      // Get ours version
      let ours = "";
      try {
        const { stdout } = await execAsync(`git show :2:"${relativePath}"`, {
          cwd: this.workspaceRoot,
        });
        ours = stdout;
      } catch {
        // Ours may not exist for deleted files
      }

      // Get theirs version
      let theirs = "";
      try {
        const { stdout } = await execAsync(`git show :3:"${relativePath}"`, {
          cwd: this.workspaceRoot,
        });
        theirs = stdout;
      } catch {
        // Theirs may not exist for deleted files
      }

      return { base, ours, theirs };
    } catch {
      return null;
    }
  }
}

export default ConflictService;
