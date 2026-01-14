/**
 * Utility functions for Git graph visualization
 * Handles data conversion, parsing, and formatting for @gitgraph/js
 */

import type { GitCommit, GitBranch, GitTag } from '../../stores/gitStore';

// =============================================================================
// Types
// =============================================================================

/**
 * Commit types from conventional commits specification
 */
export type CommitType =
  | 'feat'
  | 'fix'
  | 'chore'
  | 'refactor'
  | 'docs'
  | 'style'
  | 'test'
  | 'perf'
  | 'ci'
  | 'build'
  | 'revert'
  | 'other';

/**
 * Commit type configuration with emoji and color
 */
export interface CommitTypeConfig {
  type: CommitType;
  emoji: string;
  label: string;
  color: string;
  cssVar: string;
}

/**
 * Parsed commit information
 */
export interface ParsedCommit {
  type: CommitType;
  scope?: string;
  breaking: boolean;
  message: string;
  fullMessage: string;
}

/**
 * Graph commit data structure for rendering
 */
export interface GraphCommit {
  hash: string;
  shortHash: string;
  message: string;
  body: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  parents: string[];
  refs: string[];
  isMerge: boolean;
  parsedType: ParsedCommit;
  relativeDate: string;
  branchRefs: string[];
  tagRefs: string[];
  color: string;
}

/**
 * Branch node for graph visualization
 */
export interface BranchNode {
  name: string;
  color: string;
  commits: GraphCommit[];
  parentBranch?: string;
}

/**
 * Collapsed commits placeholder
 */
export interface CollapsedCommits {
  isCollapsed: true;
  count: number;
  startHash: string;
  endHash: string;
  message: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Commit type configurations with emojis and colors from docs
 */
export const COMMIT_TYPE_CONFIG: Record<CommitType, CommitTypeConfig> = {
  feat: {
    type: 'feat',
    emoji: '\u{1F4E6}', // 📦
    label: 'feat',
    color: '#4CAF50',
    cssVar: '--badge-feat',
  },
  fix: {
    type: 'fix',
    emoji: '\u{1F41B}', // 🐛
    label: 'fix',
    color: '#F44336',
    cssVar: '--badge-fix',
  },
  chore: {
    type: 'chore',
    emoji: '\u{1F527}', // 🔧
    label: 'chore',
    color: '#9E9E9E',
    cssVar: '--badge-chore',
  },
  refactor: {
    type: 'refactor',
    emoji: '\u{1F504}', // 🔄
    label: 'refactor',
    color: '#2196F3',
    cssVar: '--badge-refactor',
  },
  docs: {
    type: 'docs',
    emoji: '\u{1F4DA}', // 📚
    label: 'docs',
    color: '#9C27B0',
    cssVar: '--badge-docs',
  },
  style: {
    type: 'style',
    emoji: '\u{1F3A8}', // 🎨
    label: 'style',
    color: '#E91E63',
    cssVar: '--badge-style',
  },
  test: {
    type: 'test',
    emoji: '\u{1F9EA}', // 🧪
    label: 'test',
    color: '#00BCD4',
    cssVar: '--badge-test',
  },
  perf: {
    type: 'perf',
    emoji: '\u{26A1}', // ⚡
    label: 'perf',
    color: '#FF9800',
    cssVar: '--badge-perf',
  },
  ci: {
    type: 'ci',
    emoji: '\u{2699}\u{FE0F}', // ⚙️
    label: 'ci',
    color: '#607D8B',
    cssVar: '--badge-chore',
  },
  build: {
    type: 'build',
    emoji: '\u{1F3D7}\u{FE0F}', // 🏗️
    label: 'build',
    color: '#795548',
    cssVar: '--badge-chore',
  },
  revert: {
    type: 'revert',
    emoji: '\u{23EA}', // ⏪
    label: 'revert',
    color: '#FF5722',
    cssVar: '--badge-fix',
  },
  other: {
    type: 'other',
    emoji: '\u{1F4DD}', // 📝
    label: 'commit',
    color: '#757575',
    cssVar: '--badge-chore',
  },
};

/**
 * Branch color palette from docs/04-UI-UX-DESIGN.md
 */
export const BRANCH_COLORS: Record<string, string> = {
  main: '#4CAF50',
  master: '#4CAF50',
  develop: '#2196F3',
  development: '#2196F3',
  dev: '#2196F3',
  feature: '#9C27B0',
  release: '#FF9800',
  hotfix: '#F44336',
  bugfix: '#F44336',
};

/**
 * Graph line colors (indexed for branches without specific color)
 */
export const GRAPH_LINE_COLORS = [
  '#4CAF50', // main/master - green
  '#2196F3', // develop - blue
  '#9C27B0', // feature - purple
  '#FF9800', // release - orange
  '#F44336', // hotfix - red
  '#00BCD4', // other - cyan
  '#E91E63', // pink
  '#673AB7', // deep purple
  '#3F51B5', // indigo
  '#009688', // teal
];

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Parse conventional commit message to extract type, scope, and message
 *
 * Conventional commit format: type(scope)!: message
 * Examples:
 *   - feat: add new feature
 *   - fix(auth): resolve login issue
 *   - feat!: breaking change
 *   - refactor(core)!: major refactoring
 */
export function parseCommitType(message: string): ParsedCommit {
  // Conventional commit regex: type(scope)?!?: message
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = message.match(conventionalRegex);

  if (match) {
    const [, typeStr, scope, breaking, msg] = match;
    const type = (COMMIT_TYPE_CONFIG[typeStr as CommitType]
      ? typeStr
      : 'other') as CommitType;

    return {
      type,
      scope: scope || undefined,
      breaking: breaking === '!',
      message: msg,
      fullMessage: message,
    };
  }

  // Try to detect type from common prefixes
  const prefixMatch = message.match(/^\[(\w+)\]\s*(.+)$/);
  if (prefixMatch) {
    const [, prefix, msg] = prefixMatch;
    const type = (COMMIT_TYPE_CONFIG[prefix.toLowerCase() as CommitType]
      ? prefix.toLowerCase()
      : 'other') as CommitType;

    return {
      type,
      scope: undefined,
      breaking: false,
      message: msg,
      fullMessage: message,
    };
  }

  // Default to 'other' type
  return {
    type: 'other',
    scope: undefined,
    breaking: false,
    message: message,
    fullMessage: message,
  };
}

/**
 * Get commit type configuration
 */
export function getCommitTypeConfig(type: CommitType): CommitTypeConfig {
  return COMMIT_TYPE_CONFIG[type] || COMMIT_TYPE_CONFIG.other;
}

// =============================================================================
// Color Functions
// =============================================================================

/**
 * Get branch color based on branch name patterns
 */
export function getBranchColor(branchName: string, index = 0): string {
  // Normalize branch name (remove remote prefix)
  const normalizedName = branchName.replace(/^origin\//, '').toLowerCase();

  // Check for exact match
  if (BRANCH_COLORS[normalizedName]) {
    return BRANCH_COLORS[normalizedName];
  }

  // Check for prefix match
  for (const [prefix, color] of Object.entries(BRANCH_COLORS)) {
    if (normalizedName.startsWith(prefix + '/') || normalizedName.startsWith(prefix + '-')) {
      return color;
    }
  }

  // Use indexed color for unknown branches
  return GRAPH_LINE_COLORS[index % GRAPH_LINE_COLORS.length];
}

/**
 * Generate color map for all branches
 */
export function generateBranchColorMap(branches: GitBranch[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  let unknownIndex = 0;

  branches.forEach((branch) => {
    const color = getBranchColor(branch.name, unknownIndex);
    colorMap.set(branch.name, color);

    // Only increment index for branches without predefined colors
    const normalizedName = branch.name.replace(/^origin\//, '').toLowerCase();
    const hasPredefinedColor =
      BRANCH_COLORS[normalizedName] ||
      Object.keys(BRANCH_COLORS).some(
        (prefix) =>
          normalizedName.startsWith(prefix + '/') || normalizedName.startsWith(prefix + '-')
      );

    if (!hasPredefinedColor) {
      unknownIndex++;
    }
  });

  return colorMap;
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format date to relative time string (1d, 2w, 3mo, 1y)
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return 'now';
  }
  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks}w`;
  }
  if (diffMonths < 12) {
    return `${diffMonths}mo`;
  }
  return `${diffYears}y`;
}

/**
 * Format date to full date string
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// =============================================================================
// Commit Conversion
// =============================================================================

/**
 * Convert GitCommit from store to GraphCommit for rendering
 */
export function convertToGraphCommit(
  commit: GitCommit,
  branchColorMap: Map<string, string>
): GraphCommit {
  const parsedType = parseCommitType(commit.message);

  // Extract branch refs and tag refs
  const branchRefs = commit.refs.filter(
    (ref) => !ref.startsWith('tag:') && ref !== 'HEAD'
  );
  const tagRefs = commit.refs
    .filter((ref) => ref.startsWith('tag:'))
    .map((ref) => ref.replace('tag:', '').trim());

  // Determine color from first branch ref or use commit type color
  let color = getCommitTypeConfig(parsedType.type).color;
  if (branchRefs.length > 0) {
    color = branchColorMap.get(branchRefs[0]) || color;
  }

  return {
    hash: commit.hash,
    shortHash: commit.shortHash,
    message: commit.message,
    body: commit.body,
    author: {
      name: commit.author.name,
      email: commit.author.email,
      date: commit.author.date,
    },
    parents: commit.parents,
    refs: commit.refs,
    isMerge: commit.isMerge,
    parsedType,
    relativeDate: formatRelativeDate(commit.author.date),
    branchRefs,
    tagRefs,
    color,
  };
}

/**
 * Convert array of GitCommits to GraphCommits
 */
export function convertCommitsToGraphFormat(
  commits: GitCommit[],
  branches: GitBranch[]
): GraphCommit[] {
  const branchColorMap = generateBranchColorMap(branches);
  return commits.map((commit) => convertToGraphCommit(commit, branchColorMap));
}

// =============================================================================
// Collapsed Commits
// =============================================================================

/**
 * Create a collapsed commits placeholder
 */
export function createCollapsedCommitsPlaceholder(
  commits: GitCommit[],
  startIndex: number,
  count: number
): CollapsedCommits {
  const startCommit = commits[startIndex];
  const endCommit = commits[startIndex + count - 1];

  return {
    isCollapsed: true,
    count,
    startHash: startCommit?.hash || '',
    endHash: endCommit?.hash || '',
    message: `... ${count} commits`,
  };
}

/**
 * Check if an item is a collapsed commits placeholder
 */
export function isCollapsedCommits(
  item: GraphCommit | CollapsedCommits
): item is CollapsedCommits {
  return 'isCollapsed' in item && item.isCollapsed === true;
}

/**
 * Collapse sequential commits on the same branch
 * Useful for hiding long linear history
 */
export function collapseLinearCommits(
  commits: GraphCommit[],
  maxConsecutive = 3
): (GraphCommit | CollapsedCommits)[] {
  if (commits.length <= maxConsecutive + 2) {
    return commits;
  }

  const result: (GraphCommit | CollapsedCommits)[] = [];
  let consecutiveCount = 0;
  let consecutiveStart = -1;

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const prevCommit = commits[i - 1];
    const nextCommit = commits[i + 1];

    // Check if this is a "boring" commit (single parent, not a merge, no refs)
    const isBoring =
      commit.parents.length === 1 &&
      !commit.isMerge &&
      commit.branchRefs.length === 0 &&
      commit.tagRefs.length === 0;

    // Check if previous commit is parent of this commit (linear sequence)
    const isLinear = prevCommit && prevCommit.parents[0] === commit.hash;

    if (isBoring && isLinear) {
      if (consecutiveStart === -1) {
        consecutiveStart = i;
      }
      consecutiveCount++;
    } else {
      // End of consecutive sequence
      if (consecutiveCount > maxConsecutive) {
        // Add collapsed placeholder
        result.push({
          isCollapsed: true,
          count: consecutiveCount,
          startHash: commits[consecutiveStart].hash,
          endHash: commits[consecutiveStart + consecutiveCount - 1].hash,
          message: `... ${consecutiveCount} commits`,
        });
      } else {
        // Add individual commits
        for (let j = consecutiveStart; j < consecutiveStart + consecutiveCount; j++) {
          if (j >= 0 && j < commits.length) {
            result.push(commits[j]);
          }
        }
      }

      // Reset tracking
      consecutiveCount = 0;
      consecutiveStart = -1;

      // Add current commit
      result.push(commit);
    }
  }

  // Handle trailing consecutive commits
  if (consecutiveCount > maxConsecutive) {
    result.push({
      isCollapsed: true,
      count: consecutiveCount,
      startHash: commits[consecutiveStart].hash,
      endHash: commits[consecutiveStart + consecutiveCount - 1].hash,
      message: `... ${consecutiveCount} commits`,
    });
  } else {
    for (let j = consecutiveStart; j < consecutiveStart + consecutiveCount; j++) {
      if (j >= 0 && j < commits.length) {
        result.push(commits[j]);
      }
    }
  }

  return result;
}

// =============================================================================
// Graph Layout Helpers
// =============================================================================

/**
 * Build a map of commit hash to branch name
 */
export function buildCommitToBranchMap(
  commits: GitCommit[],
  branches: GitBranch[]
): Map<string, string> {
  const map = new Map<string, string>();

  // Map branch tips
  branches.forEach((branch) => {
    if (branch.lastCommitHash) {
      map.set(branch.lastCommitHash, branch.name);
    }
  });

  // Map commits with refs
  commits.forEach((commit) => {
    const branchRef = commit.refs.find(
      (ref) => !ref.startsWith('tag:') && ref !== 'HEAD'
    );
    if (branchRef && !map.has(commit.hash)) {
      map.set(commit.hash, branchRef);
    }
  });

  return map;
}

/**
 * Get branch names from refs array
 */
export function extractBranchNames(refs: string[]): string[] {
  return refs
    .filter((ref) => !ref.startsWith('tag:') && ref !== 'HEAD')
    .map((ref) => ref.replace(/^refs\/heads\//, '').replace(/^refs\/remotes\//, ''));
}

/**
 * Get tag names from refs array
 */
export function extractTagNames(refs: string[]): string[] {
  return refs
    .filter((ref) => ref.startsWith('tag:'))
    .map((ref) => ref.replace('tag:', '').trim());
}

/**
 * Truncate message to specified length
 */
export function truncateMessage(message: string, maxLength = 50): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength - 3) + '...';
}

// =============================================================================
// @gitgraph/js Integration
// =============================================================================

/**
 * Template options for @gitgraph/js
 */
export interface GitGraphTemplateOptions {
  colors: string[];
  branch: {
    lineWidth: number;
    spacing: number;
    mergeStyle: 'bezier' | 'straight';
  };
  commit: {
    spacing: number;
    dot: {
      size: number;
      strokeWidth: number;
    };
    message: {
      displayAuthor: boolean;
      displayHash: boolean;
    };
  };
}

/**
 * Get default template options for @gitgraph/js
 */
export function getDefaultTemplateOptions(): GitGraphTemplateOptions {
  return {
    colors: GRAPH_LINE_COLORS,
    branch: {
      lineWidth: 2,
      spacing: 50,
      mergeStyle: 'bezier',
    },
    commit: {
      spacing: 40,
      dot: {
        size: 6,
        strokeWidth: 2,
      },
      message: {
        displayAuthor: false,
        displayHash: false,
      },
    },
  };
}

/**
 * Build branch hierarchy from commits
 * Determines parent branches based on merge commits
 */
export function buildBranchHierarchy(
  commits: GitCommit[],
  branches: GitBranch[]
): Map<string, string | null> {
  const hierarchy = new Map<string, string | null>();

  // Set main/master as root
  branches.forEach((branch) => {
    const name = branch.name.toLowerCase();
    if (name === 'main' || name === 'master') {
      hierarchy.set(branch.name, null);
    }
  });

  // Analyze merge commits to determine branch parents
  commits.forEach((commit) => {
    if (commit.isMerge && commit.parents.length >= 2) {
      const branchRefs = commit.refs.filter(
        (ref) => !ref.startsWith('tag:') && ref !== 'HEAD'
      );
      if (branchRefs.length > 0) {
        // The branch receiving the merge is likely the parent
        const targetBranch = branchRefs[0];
        // This is a simplified heuristic
        hierarchy.set(targetBranch, null);
      }
    }
  });

  return hierarchy;
}
