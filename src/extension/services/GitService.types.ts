/**
 * Internal types for simple-git responses and mappers
 * These types handle the conversion between simple-git output and our domain types
 */

import type { DefaultLogFields, ListLogLine } from "simple-git";
import type {
  Branch,
  Commit,
  DiffFile,
  DiffResult,
  FileStatus,
  FileStatusType,
  Ref,
  RemoteInfo,
  RepositoryState,
  Stash,
  StatusResult,
} from "../../types/git";

// =============================================================================
// Simple-git Response Types (internal use)
// =============================================================================

export interface SimpleGitLogEntry extends DefaultLogFields, ListLogLine {
  refs: string;
}

export interface SimpleGitBranchSummary {
  all: string[];
  branches: Record<
    string,
    {
      current: boolean;
      name: string;
      commit: string;
      label: string;
      linkedWorkTree: boolean;
    }
  >;
  current: string;
  detached: boolean;
}

export interface SimpleGitStatusResult {
  current: string | null;
  tracking: string | null;
  detached: boolean;
  ahead: number;
  behind: number;
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: { from: string; to: string }[];
  staged: string[];
  not_added: string[];
  conflicted: string[];
  files: { path: string; index: string; working_dir: string }[];
}

export interface SimpleGitDiffSummary {
  changed: number;
  insertions: number;
  deletions: number;
  files: {
    file: string;
    changes: number;
    insertions: number;
    deletions: number;
    binary: boolean;
  }[];
}

export interface SimpleGitRemote {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

export interface SimpleGitStashEntry {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

// =============================================================================
// Mappers
// =============================================================================

/**
 * Parse refs string from git log into structured Ref array
 */
export function parseRefs(refsString: string): Ref[] {
  if (!refsString || refsString.trim() === "") {
    return [];
  }

  const refs: Ref[] = [];
  const refParts = refsString.split(", ");

  for (const part of refParts) {
    const trimmed = part.trim();

    if (trimmed.startsWith("HEAD -> ")) {
      refs.push({
        name: trimmed.replace("HEAD -> ", ""),
        type: "head",
      });
    } else if (trimmed.startsWith("tag: ")) {
      refs.push({
        name: trimmed.replace("tag: ", ""),
        type: "tag",
      });
    } else if (trimmed.startsWith("origin/") || trimmed.includes("/")) {
      refs.push({
        name: trimmed,
        type: "remote",
      });
    } else if (trimmed === "HEAD") {
      // Skip standalone HEAD
      continue;
    } else {
      refs.push({
        name: trimmed,
        type: "head",
      });
    }
  }

  return refs;
}

/**
 * Extract Work Item IDs from commit message
 * Supports formats: #123, AB#123, workitem:123
 */
export function extractWorkItemIds(message: string): number[] {
  const ids: number[] = [];
  const patterns = [
    /#(\d+)/g, // #123
    /AB#(\d+)/gi, // AB#123
    /workitem[:\s]+(\d+)/gi, // workitem:123 or workitem 123
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id) && !ids.includes(id)) {
        ids.push(id);
      }
    }
  }

  return ids;
}

/**
 * Map simple-git log entry to domain Commit
 */
export function mapLogEntryToCommit(entry: SimpleGitLogEntry): Commit {
  const message = entry.message || "";
  const body = entry.body || undefined;

  return {
    sha: entry.hash,
    shortSha: entry.hash.substring(0, 7),
    message,
    body,
    author: {
      name: entry.author_name,
      email: entry.author_email,
    },
    date: entry.date,
    parents: entry.refs ? [] : [], // Parents handled separately
    refs: parseRefs(entry.refs || ""),
    workItemIds: extractWorkItemIds(message + (body || "")),
  };
}

/**
 * Map simple-git branch info to domain Branch
 */
export function mapBranchSummaryToBranches(
  summary: SimpleGitBranchSummary,
  trackingInfo?: Map<string, { ahead: number; behind: number; tracking?: string }>
): Branch[] {
  const branches: Branch[] = [];

  for (const [name, info] of Object.entries(summary.branches)) {
    const tracking = trackingInfo?.get(name);
    const isRemote = name.startsWith("remotes/");
    const cleanName = isRemote ? name.replace(/^remotes\//, "") : name;

    branches.push({
      name: cleanName,
      current: info.current,
      commit: info.commit,
      label: info.label,
      remote: isRemote ? cleanName.split("/")[0] : undefined,
      tracking: tracking?.tracking,
      ahead: tracking?.ahead || 0,
      behind: tracking?.behind || 0,
    });
  }

  return branches;
}

/**
 * Map file status index code to FileStatusType
 */
export function mapStatusCode(indexCode: string, workdirCode: string): FileStatusType {
  // Check index first (staged changes)
  switch (indexCode) {
    case "A":
      return "added";
    case "M":
      return "modified";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
  }

  // Then check working directory
  switch (workdirCode) {
    case "A":
      return "added";
    case "M":
      return "modified";
    case "D":
      return "deleted";
    case "?":
      return "untracked";
  }

  return "modified"; // default
}

/**
 * Map simple-git status to domain StatusResult
 */
export function mapStatusResult(status: SimpleGitStatusResult): StatusResult {
  const staged: FileStatus[] = [];
  const unstaged: FileStatus[] = [];

  for (const file of status.files) {
    const indexStatus = file.index;
    const workdirStatus = file.working_dir;

    // Staged changes (index has status)
    if (indexStatus && indexStatus !== " " && indexStatus !== "?") {
      staged.push({
        path: file.path,
        status: mapStatusCode(indexStatus, ""),
      });
    }

    // Unstaged changes (working dir has status)
    if (workdirStatus && workdirStatus !== " " && workdirStatus !== "?") {
      unstaged.push({
        path: file.path,
        status: mapStatusCode("", workdirStatus),
      });
    }
  }

  // Handle renamed files
  for (const renamed of status.renamed) {
    staged.push({
      path: renamed.to,
      status: "renamed",
      oldPath: renamed.from,
    });
  }

  return {
    current: status.current || "HEAD",
    tracking: status.tracking || undefined,
    detached: status.detached,
    staged,
    unstaged,
    untracked: status.not_added,
    conflicted: status.conflicted,
    ahead: status.ahead,
    behind: status.behind,
  };
}

/**
 * Map simple-git diff summary to domain DiffResult
 */
export function mapDiffSummary(summary: SimpleGitDiffSummary, raw: string = ""): DiffResult {
  const files: DiffFile[] = summary.files.map((file) => ({
    path: file.file,
    status: "modified" as FileStatusType, // Default, can be refined
    insertions: file.insertions,
    deletions: file.deletions,
    binary: file.binary,
  }));

  return {
    files,
    insertions: summary.insertions,
    deletions: summary.deletions,
    raw,
  };
}

/**
 * Map simple-git remote to domain RemoteInfo
 */
export function mapRemote(remote: SimpleGitRemote): RemoteInfo {
  return {
    name: remote.name,
    fetchUrl: remote.refs.fetch,
    pushUrl: remote.refs.push,
  };
}

/**
 * Parse stash list output to Stash array
 */
export function parseStashList(output: string): Stash[] {
  if (!output || output.trim() === "") {
    return [];
  }

  const stashes: Stash[] = [];
  const lines = output.trim().split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Format: stash@{0}: WIP on branch: message
    // Or: hash|date|message from custom format
    const match = line.match(/^([a-f0-9]+)\|(.+?)\|(.+)$/);
    if (match) {
      stashes.push({
        index: i,
        hash: match[1],
        date: match[2],
        message: match[3],
      });
    } else {
      // Fallback for standard format
      const stdMatch = line.match(/^stash@\{(\d+)\}:\s*(.+)$/);
      if (stdMatch) {
        stashes.push({
          index: parseInt(stdMatch[1], 10),
          hash: `stash@{${stdMatch[1]}}`,
          date: "",
          message: stdMatch[2],
        });
      }
    }
  }

  return stashes;
}

/**
 * Detect repository state from .git folder
 */
export function detectRepositoryState(gitDir: string): RepositoryState {
  const fs = require("fs");
  const path = require("path");

  if (fs.existsSync(path.join(gitDir, "MERGE_HEAD"))) {
    return "merging";
  }
  if (fs.existsSync(path.join(gitDir, "rebase-merge")) || fs.existsSync(path.join(gitDir, "rebase-apply"))) {
    return "rebasing";
  }
  if (fs.existsSync(path.join(gitDir, "CHERRY_PICK_HEAD"))) {
    return "cherryPicking";
  }
  if (fs.existsSync(path.join(gitDir, "REVERT_HEAD"))) {
    return "reverting";
  }
  if (fs.existsSync(path.join(gitDir, "BISECT_LOG"))) {
    return "bisecting";
  }

  return "normal";
}
