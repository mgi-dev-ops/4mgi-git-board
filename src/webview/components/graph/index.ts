/**
 * Graph Components - Barrel Export
 *
 * Export all graph-related components and utilities
 */

// Components
export { GitGraph, default as GitGraphDefault } from './GitGraph';
export type { GitGraphProps } from './GitGraph';

export { CommitNode, default as CommitNodeDefault } from './CommitNode';
export type { CommitNodeProps, BuildStatus, WorkItem } from './CommitNode';

// Utilities
export {
  // Types
  type CommitType,
  type CommitTypeConfig,
  type ParsedCommit,
  type GraphCommit,
  type BranchNode,
  type CollapsedCommits,
  type GitGraphTemplateOptions,

  // Constants
  COMMIT_TYPE_CONFIG,
  BRANCH_COLORS,
  GRAPH_LINE_COLORS,

  // Parsing Functions
  parseCommitType,
  getCommitTypeConfig,

  // Color Functions
  getBranchColor,
  generateBranchColorMap,

  // Date Formatting
  formatRelativeDate,
  formatFullDate,

  // Commit Conversion
  convertToGraphCommit,
  convertCommitsToGraphFormat,

  // Collapsed Commits
  createCollapsedCommitsPlaceholder,
  isCollapsedCommits,
  collapseLinearCommits,

  // Graph Layout Helpers
  buildCommitToBranchMap,
  extractBranchNames,
  extractTagNames,
  truncateMessage,

  // @gitgraph/js Integration
  getDefaultTemplateOptions,
  buildBranchHierarchy,
} from './graphUtils';
