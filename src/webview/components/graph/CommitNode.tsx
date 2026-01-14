/**
 * CommitNode Component
 *
 * Custom commit node component for Git graph visualization
 * Displays commit info with type badge, message, refs, and metadata
 */

import React, { useMemo } from 'react';
import {
  type GraphCommit,
  type CollapsedCommits,
  getCommitTypeConfig,
  truncateMessage,
  isCollapsedCommits,
} from './graphUtils';
import styles from './CommitNode.module.css';

// =============================================================================
// Types
// =============================================================================

export interface CommitNodeProps {
  /**
   * Commit data to display
   */
  commit: GraphCommit | CollapsedCommits;

  /**
   * Whether this commit is selected
   */
  isSelected?: boolean;

  /**
   * Whether this commit is hovered
   */
  isHovered?: boolean;

  /**
   * Compact mode (smaller size)
   */
  compact?: boolean;

  /**
   * Custom inline style
   */
  style?: React.CSSProperties;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Double-click handler
   */
  onDoubleClick?: () => void;

  /**
   * Context menu handler
   */
  onContextMenu?: (event: React.MouseEvent) => void;

  /**
   * Mouse enter handler
   */
  onMouseEnter?: (event: React.MouseEvent) => void;

  /**
   * Mouse leave handler
   */
  onMouseLeave?: () => void;
}

/**
 * Build status type for placeholder
 */
export type BuildStatus = 'running' | 'succeeded' | 'failed' | 'canceled' | 'partial' | 'none';

/**
 * Work item type for placeholder
 */
export interface WorkItem {
  id: number;
  type: 'task' | 'bug' | 'feature' | 'epic';
  title?: string;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface TypeBadgeProps {
  type: string;
  emoji: string;
  color: string;
  compact?: boolean;
}

function TypeBadge({ type, emoji, color, compact }: TypeBadgeProps) {
  return (
    <span
      className={`${styles.typeBadge} ${compact ? styles.compact : ''}`}
      style={{ backgroundColor: color }}
      title={type}
    >
      <span className={styles.typeBadgeEmoji}>{emoji}</span>
      {!compact && <span className={styles.typeBadgeLabel}>{type}</span>}
    </span>
  );
}

interface BranchRefProps {
  name: string;
  isRemote?: boolean;
}

function BranchRef({ name, isRemote }: BranchRefProps) {
  const displayName = isRemote ? name : name.replace(/^origin\//, '');
  const isOrigin = name.startsWith('origin/');

  return (
    <span className={`${styles.branchRef} ${isOrigin ? styles.remote : styles.local}`}>
      [{displayName}]
    </span>
  );
}

interface TagRefProps {
  name: string;
}

function TagRef({ name }: TagRefProps) {
  return <span className={styles.tagRef}>[{name}]</span>;
}

interface BuildStatusBadgeProps {
  status: BuildStatus;
}

function BuildStatusBadge({ status }: BuildStatusBadgeProps) {
  if (status === 'none') return null;

  const statusConfig: Record<BuildStatus, { icon: string; className: string }> = {
    running: { icon: '\u{23F3}', className: styles.buildRunning }, // ⏳
    succeeded: { icon: '\u{2714}\u{FE0F}', className: styles.buildSucceeded }, // ✔️
    failed: { icon: '\u{274C}', className: styles.buildFailed }, // ❌
    canceled: { icon: '\u{23F9}\u{FE0F}', className: styles.buildCanceled }, // ⏹️
    partial: { icon: '\u{26A0}\u{FE0F}', className: styles.buildPartial }, // ⚠️
    none: { icon: '', className: '' },
  };

  const config = statusConfig[status];

  return (
    <span className={`${styles.buildStatus} ${config.className}`} title={`Build: ${status}`}>
      {config.icon}
    </span>
  );
}

interface WorkItemBadgeProps {
  workItem: WorkItem;
}

function WorkItemBadge({ workItem }: WorkItemBadgeProps) {
  const typeIcon: Record<WorkItem['type'], string> = {
    task: '\u{1F4CB}', // 📋
    bug: '\u{1F41E}', // 🐞
    feature: '\u{2728}', // ✨
    epic: '\u{1F3C6}', // 🏆
  };

  return (
    <span className={styles.workItemBadge} title={workItem.title || `Work Item #${workItem.id}`}>
      {typeIcon[workItem.type]} #{workItem.id}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CommitNode({
  commit,
  isSelected = false,
  isHovered = false,
  compact = false,
  style,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: CommitNodeProps) {
  // Handle collapsed commits
  if (isCollapsedCommits(commit)) {
    return (
      <div
        className={`${styles.commitNode} ${styles.collapsed}`}
        style={style}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        <span className={styles.collapsedMessage}>{commit.message}</span>
      </div>
    );
  }

  // Get commit type configuration
  const typeConfig = useMemo(() => getCommitTypeConfig(commit.parsedType.type), [commit.parsedType.type]);

  // Truncate message for display
  const displayMessage = useMemo(
    () => truncateMessage(commit.parsedType.message, compact ? 40 : 60),
    [commit.parsedType.message, compact]
  );

  // Build class names
  const classNames = [
    styles.commitNode,
    isSelected ? styles.selected : '',
    isHovered ? styles.hovered : '',
    compact ? styles.compact : '',
    commit.isMerge ? styles.merge : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Placeholder values for build status and work items
  // These will be populated from Azure DevOps integration later
  const buildStatus: BuildStatus = 'none';
  const workItems: WorkItem[] = [];

  return (
    <div
      className={classNames}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick?.();
        if (e.key === ' ') {
          e.preventDefault();
          onDoubleClick?.();
        }
      }}
      data-hash={commit.hash}
      data-type={commit.parsedType.type}
    >
      {/* Type Badge */}
      <TypeBadge
        type={typeConfig.label}
        emoji={typeConfig.emoji}
        color={typeConfig.color}
        compact={compact}
      />

      {/* Message */}
      <span className={styles.message} title={commit.message}>
        {displayMessage}
      </span>

      {/* Branch Refs */}
      {!compact && commit.branchRefs.length > 0 && (
        <span className={styles.refs}>
          {commit.branchRefs.slice(0, 2).map((ref) => (
            <BranchRef key={ref} name={ref} isRemote={ref.startsWith('origin/')} />
          ))}
          {commit.branchRefs.length > 2 && (
            <span className={styles.moreRefs}>+{commit.branchRefs.length - 2}</span>
          )}
        </span>
      )}

      {/* Tag Refs */}
      {!compact && commit.tagRefs.length > 0 && (
        <span className={styles.tags}>
          {commit.tagRefs.slice(0, 1).map((tag) => (
            <TagRef key={tag} name={tag} />
          ))}
          {commit.tagRefs.length > 1 && (
            <span className={styles.moreTags}>+{commit.tagRefs.length - 1}</span>
          )}
        </span>
      )}

      {/* Build Status Badge (Placeholder) */}
      <BuildStatusBadge status={buildStatus} />

      {/* Work Item Badges (Placeholder) */}
      {!compact && workItems.length > 0 && (
        <span className={styles.workItems}>
          {workItems.slice(0, 2).map((wi) => (
            <WorkItemBadge key={wi.id} workItem={wi} />
          ))}
        </span>
      )}

      {/* Author */}
      <span className={styles.author} title={commit.author.email}>
        {commit.author.name}
      </span>

      {/* Date */}
      <span className={styles.date} title={commit.author.date}>
        {commit.relativeDate}
      </span>
    </div>
  );
}

// =============================================================================
// Memoized Export
// =============================================================================

export default React.memo(CommitNode);
