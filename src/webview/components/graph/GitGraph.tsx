/**
 * GitGraph Component
 *
 * Git commit history visualization component
 * Renders commits as an interactive list with branch/tag indicators
 */

import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useGraphInteraction } from '../../hooks/useGraphInteraction';
import {
	selectBranches,
	selectCommits,
	useGitStore,
} from '../../stores/gitStore';
import { CommitNode } from './CommitNode';
import styles from './GitGraph.module.css';
import {
	convertCommitsToGraphFormat,
	type GraphCommit,
	getBranchColor,
} from './graphUtils';

// =============================================================================
// Types
// =============================================================================

export interface GitGraphProps {
	/**
	 * Graph orientation: vertical (default) or horizontal
	 */
	orientation?: 'vertical' | 'horizontal';

	/**
	 * Maximum number of commits to display
	 */
	maxCommits?: number;

	/**
	 * Whether to show commit details on hover
	 */
	showTooltips?: boolean;

	/**
	 * Whether to use compact mode (smaller nodes)
	 */
	compact?: boolean;

	/**
	 * Callback when a commit is selected
	 */
	onCommitSelect?: (hash: string) => void;

	/**
	 * Callback when a commit is double-clicked
	 */
	onCommitDoubleClick?: (hash: string) => void;

	/**
	 * Callback for commit context menu
	 */
	onCommitContextMenu?: (hash: string, event: React.MouseEvent) => void;

	/**
	 * Custom class name
	 */
	className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function GitGraph({
	orientation = 'vertical',
	maxCommits = 100,
	showTooltips = true,
	compact = false,
	onCommitSelect,
	onCommitDoubleClick,
	onCommitContextMenu,
	className,
}: GitGraphProps) {
	// Store
	const commits = useGitStore(selectCommits);
	const branches = useGitStore(selectBranches);
	const selectedCommitHash = useGitStore((state) => state.selectedCommitHash);
	const selectCommit = useGitStore((state) => state.selectCommit);

	// Interactions
	const {
		handleCommitClick,
		handleCommitDoubleClick,
		handleCommitContextMenu,
		handleCommitHover,
		hoveredCommit,
		tooltipPosition,
	} = useGraphInteraction({
		onSelect: onCommitSelect || selectCommit,
		onDoubleClick: onCommitDoubleClick,
		onContextMenu: onCommitContextMenu,
	});

	// Convert commits to graph format
	const graphCommits = useMemo(() => {
		const limitedCommits = commits.slice(0, maxCommits);
		return convertCommitsToGraphFormat(limitedCommits, branches);
	}, [commits, branches, maxCommits]);

	// Build a simple branch color indicator based on first branchRef or parent chain
	const commitBranchColors = useMemo(() => {
		const colorMap = new Map<string, string>();
		let colorIndex = 0;
		const branchColorCache = new Map<string, string>();

		graphCommits.forEach((commit) => {
			if (commit.branchRefs.length > 0) {
				const branchName = commit.branchRefs[0];
				if (!branchColorCache.has(branchName)) {
					branchColorCache.set(branchName, getBranchColor(branchName, colorIndex++));
				}
				colorMap.set(commit.hash, branchColorCache.get(branchName)!);
			} else {
				// Default color for commits without branch refs
				colorMap.set(commit.hash, '#6e7681');
			}
		});

		return colorMap;
	}, [graphCommits]);

	// Render commit list
	const renderCommitList = useCallback(() => {
		return graphCommits.map((commit: GraphCommit) => {
			const isSelected = commit.hash === selectedCommitHash;
			const isHovered = commit.hash === hoveredCommit?.hash;
			const branchColor = commitBranchColors.get(commit.hash) || '#6e7681';

			return (
				<div
					key={commit.hash}
					className={styles.commitRow}
					style={{
						borderLeftColor: branchColor,
						borderLeftWidth: commit.branchRefs.length > 0 ? '3px' : '2px',
					}}
				>
					<CommitNode
						commit={commit}
						isSelected={isSelected}
						isHovered={isHovered}
						compact={compact}
						onClick={() => handleCommitClick(commit)}
						onDoubleClick={() => handleCommitDoubleClick(commit)}
						onContextMenu={(e) => handleCommitContextMenu(commit, e)}
						onMouseEnter={(e) => handleCommitHover(commit, e)}
						onMouseLeave={() => handleCommitHover(null, null)}
					/>
				</div>
			);
		});
	}, [
		graphCommits,
		selectedCommitHash,
		hoveredCommit,
		compact,
		commitBranchColors,
		handleCommitClick,
		handleCommitDoubleClick,
		handleCommitContextMenu,
		handleCommitHover,
	]);

	// Tooltip component
	const renderTooltip = useCallback(() => {
		if (!showTooltips || !hoveredCommit || !tooltipPosition) return null;

		return (
			<div
				className={styles.tooltip}
				style={{
					left: tooltipPosition.x + 10,
					top: tooltipPosition.y + 10,
				}}
			>
				<div className={styles.tooltipHash}>{hoveredCommit.shortHash}</div>
				<div className={styles.tooltipMessage}>{hoveredCommit.message}</div>
				<div className={styles.tooltipMeta}>
					<span>{hoveredCommit.author.name}</span>
					<span>{hoveredCommit.relativeDate}</span>
				</div>
			</div>
		);
	}, [showTooltips, hoveredCommit, tooltipPosition]);

	// Loading state
	if (commits.length === 0) {
		return (
			<div
				className={`${styles.container} ${styles.loading} ${className || ''}`}
			>
				<div className={styles.loadingSpinner} />
				<p>Loading git history...</p>
			</div>
		);
	}

	return (
		<div
			className={`${styles.container} ${className || ''}`}
			data-orientation={orientation}
		>
			{/* Commit List */}
			<div className={styles.commitList}>
				{renderCommitList()}
			</div>

			{/* Tooltip */}
			{renderTooltip()}
		</div>
	);
}

export default GitGraph;
