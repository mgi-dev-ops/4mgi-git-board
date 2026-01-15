/**
 * Graph Components - Barrel Export
 *
 * Export all graph-related components and utilities
 */

export type { BuildStatus, CommitNodeProps, WorkItem } from './CommitNode';
export { CommitNode, default as CommitNodeDefault } from './CommitNode';
export type { GitGraphProps } from './GitGraph';
// Components
export { default as GitGraphDefault, GitGraph } from './GitGraph';

// Utilities
export {
	BRANCH_COLORS,
	type BranchNode,
	buildBranchHierarchy,
	// Graph Layout Helpers
	buildCommitToBranchMap,
	// Constants
	COMMIT_TYPE_CONFIG,
	type CollapsedCommits,
	// Types
	type CommitType,
	type CommitTypeConfig,
	collapseLinearCommits,
	convertCommitsToGraphFormat,
	// Commit Conversion
	convertToGraphCommit,
	// Collapsed Commits
	createCollapsedCommitsPlaceholder,
	extractBranchNames,
	extractTagNames,
	formatFullDate,
	// Date Formatting
	formatRelativeDate,
	type GitGraphTemplateOptions,
	GRAPH_LINE_COLORS,
	type GraphCommit,
	generateBranchColorMap,
	// Color Functions
	getBranchColor,
	getCommitTypeConfig,
	// @gitgraph/js Integration
	getDefaultTemplateOptions,
	isCollapsedCommits,
	type ParsedCommit,
	// Parsing Functions
	parseCommitType,
	truncateMessage,
} from './graphUtils';
