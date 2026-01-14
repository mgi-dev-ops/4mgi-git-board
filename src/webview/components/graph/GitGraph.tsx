/**
 * GitGraph Component
 *
 * Main Git graph visualization component using @gitgraph/js
 * Renders commit history with branch visualization
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { createGitgraph, templateExtend, TemplateName, Orientation } from '@gitgraph/js';
import type { GitgraphOptions, BranchUserApi, GitgraphUserApi } from '@gitgraph/js';
import { useGitStore, selectCommits, selectBranches, selectTags } from '../../stores/gitStore';
import {
  convertCommitsToGraphFormat,
  generateBranchColorMap,
  getBranchColor,
  GRAPH_LINE_COLORS,
  type GraphCommit,
} from './graphUtils';
import { CommitNode } from './CommitNode';
import { useGraphInteraction } from '../../hooks/useGraphInteraction';
import styles from './GitGraph.module.css';

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
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gitgraphRef = useRef<GitgraphUserApi<SVGElement> | null>(null);
  const branchMapRef = useRef<Map<string, BranchUserApi<SVGElement>>>(new Map());

  // Store
  const commits = useGitStore(selectCommits);
  const branches = useGitStore(selectBranches);
  const tags = useGitStore(selectTags);
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

  // Generate branch color map
  const branchColorMap = useMemo(() => generateBranchColorMap(branches), [branches]);

  // Initialize gitgraph
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous graph
    containerRef.current.innerHTML = '';
    branchMapRef.current.clear();

    // Create template with custom options
    const template = templateExtend(TemplateName.Metro, {
      colors: GRAPH_LINE_COLORS,
      branch: {
        lineWidth: compact ? 1.5 : 2,
        spacing: compact ? 30 : 50,
        mergeStyle: 'bezier' as const,
        label: {
          display: false,
        },
      },
      commit: {
        spacing: compact ? 30 : 40,
        dot: {
          size: compact ? 4 : 6,
          strokeWidth: compact ? 1.5 : 2,
        },
        message: {
          display: false,
          displayAuthor: false,
          displayHash: false,
        },
      },
      tag: {
        pointerWidth: 6,
      },
    });

    // Create gitgraph options
    const options: GitgraphOptions = {
      template,
      orientation:
        orientation === 'horizontal' ? Orientation.Horizontal : Orientation.VerticalReverse,
      author: 'GitBoard',
      mode: undefined,
    };

    // Create gitgraph instance
    gitgraphRef.current = createGitgraph(containerRef.current, options);

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      branchMapRef.current.clear();
    };
  }, [orientation, compact]);

  // Render commits to graph
  useEffect(() => {
    if (!gitgraphRef.current || graphCommits.length === 0) return;

    const gitgraph = gitgraphRef.current;
    const branchMap = branchMapRef.current;

    // Clear existing branches
    branchMap.clear();

    // Build commit index for quick lookup
    const commitIndex = new Map<string, GraphCommit>();
    graphCommits.forEach((commit) => commitIndex.set(commit.hash, commit));

    // Track which commits belong to which branch
    const commitBranches = new Map<string, string>();

    // Process commits to determine branch structure
    graphCommits.forEach((commit) => {
      if (commit.branchRefs.length > 0) {
        commitBranches.set(commit.hash, commit.branchRefs[0]);
      }
    });

    // Create main branch
    const mainBranch = gitgraph.branch({
      name: 'main',
      style: {
        color: getBranchColor('main', 0),
        lineWidth: compact ? 1.5 : 2,
      },
    });
    branchMap.set('main', mainBranch);

    // Track processed commits
    const processedCommits = new Set<string>();

    // Process commits in reverse order (oldest first)
    const reversedCommits = [...graphCommits].reverse();

    reversedCommits.forEach((commit) => {
      if (processedCommits.has(commit.hash)) return;

      // Determine which branch this commit belongs to
      const branchName = commit.branchRefs[0] || 'main';

      // Get or create branch
      let branch = branchMap.get(branchName);
      if (!branch) {
        // Determine parent branch for branching
        let parentBranch = mainBranch;
        if (commit.parents.length > 0) {
          const parentCommit = commitIndex.get(commit.parents[0]);
          if (parentCommit) {
            const parentBranchName = parentCommit.branchRefs[0] || 'main';
            parentBranch = branchMap.get(parentBranchName) || mainBranch;
          }
        }

        // Create new branch
        const branchColor = branchColorMap.get(branchName) || getBranchColor(branchName, branchMap.size);
        branch = parentBranch.branch({
          name: branchName,
          style: {
            color: branchColor,
            lineWidth: compact ? 1.5 : 2,
          },
        });
        branchMap.set(branchName, branch);
      }

      // Handle merge commits
      if (commit.isMerge && commit.parents.length >= 2) {
        // Get the merged branch
        const mergedParentHash = commit.parents[1];
        const mergedCommit = commitIndex.get(mergedParentHash);
        if (mergedCommit) {
          const mergedBranchName = mergedCommit.branchRefs[0];
          const mergedBranch = branchMap.get(mergedBranchName || '');
          if (mergedBranch) {
            mergedBranch.merge(branch, {
              subject: commit.message,
              author: commit.author.name,
            });
          } else {
            // Just add as regular commit if merged branch not found
            branch.commit({
              subject: commit.message,
              author: commit.author.name,
              hash: commit.shortHash,
            });
          }
        } else {
          branch.commit({
            subject: commit.message,
            author: commit.author.name,
            hash: commit.shortHash,
          });
        }
      } else {
        // Regular commit
        branch.commit({
          subject: commit.message,
          author: commit.author.name,
          hash: commit.shortHash,
        });
      }

      // Add tags
      commit.tagRefs.forEach((tagName) => {
        branch?.tag(tagName);
      });

      processedCommits.add(commit.hash);
    });
  }, [graphCommits, branchColorMap, compact]);

  // Render custom commit nodes overlay
  const renderCommitNodes = useCallback(() => {
    return graphCommits.map((commit, index) => {
      const isSelected = commit.hash === selectedCommitHash;
      const isHovered = commit.hash === hoveredCommit?.hash;

      // Calculate position based on index and orientation
      const spacing = compact ? 30 : 40;
      const offset = compact ? 60 : 80;

      const position =
        orientation === 'horizontal'
          ? { left: index * spacing + offset, top: 10 }
          : { left: 60, top: index * spacing + offset };

      return (
        <CommitNode
          key={commit.hash}
          commit={commit}
          isSelected={isSelected}
          isHovered={isHovered}
          compact={compact}
          style={{
            position: 'absolute',
            left: position.left,
            top: position.top,
          }}
          onClick={() => handleCommitClick(commit)}
          onDoubleClick={() => handleCommitDoubleClick(commit)}
          onContextMenu={(e) => handleCommitContextMenu(commit, e)}
          onMouseEnter={(e) => handleCommitHover(commit, e)}
          onMouseLeave={() => handleCommitHover(null, null)}
        />
      );
    });
  }, [
    graphCommits,
    selectedCommitHash,
    hoveredCommit,
    compact,
    orientation,
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
      <div className={`${styles.container} ${styles.loading} ${className || ''}`}>
        <div className={styles.loadingSpinner} />
        <p>Loading git history...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* SVG Graph from @gitgraph/js */}
      <div
        ref={containerRef}
        className={`${styles.svgContainer} ${orientation === 'horizontal' ? styles.horizontal : styles.vertical}`}
      />

      {/* Custom Commit Nodes Overlay */}
      <div className={styles.nodesOverlay}>{renderCommitNodes()}</div>

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}

export default GitGraph;
