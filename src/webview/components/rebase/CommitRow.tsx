import React, { useCallback, useRef } from 'react';
import { ActionDropdown } from './ActionDropdown';
import type { RebaseCommit, RebaseAction } from './types';
import styles from './CommitRow.module.css';

export interface CommitRowProps {
  /** Commit data */
  commit: RebaseCommit;
  /** Row index */
  index: number;
  /** Whether this row is selected */
  isSelected: boolean;
  /** Whether this row is being dragged */
  isDragging: boolean;
  /** Whether this row is a drop target */
  isDropTarget: boolean;
  /** Whether to use simplified labels */
  simplifiedLabels: boolean;
  /** Callback when row is selected */
  onSelect: () => void;
  /** Callback when action changes */
  onActionChange: (action: RebaseAction) => void;
  /** Callback when drag starts */
  onDragStart: () => void;
  /** Callback when dragging over this row */
  onDragOver: () => void;
  /** Callback when drag ends */
  onDragEnd: () => void;
  /** Callback when SHA is clicked (copy) */
  onCopySha: () => void;
  /** Callback when row is double-clicked (edit message) */
  onDoubleClick: () => void;
  /** Data index attribute for scrolling */
  'data-index'?: number;
}

/**
 * CommitRow - Individual commit row in interactive rebase list
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Commit Row Structure
 *
 * Structure:
 * | Drag Handle | Action Dropdown | SHA | Message | Author | Date |
 */
export function CommitRow({
  commit,
  index,
  isSelected,
  isDragging,
  isDropTarget,
  simplifiedLabels,
  onSelect,
  onActionChange,
  onDragStart,
  onDragOver,
  onDragEnd,
  onCopySha,
  onDoubleClick,
  'data-index': dataIndex,
}: CommitRowProps): React.ReactElement {
  const rowRef = useRef<HTMLDivElement>(null);

  // Build row class names based on action and state
  const rowClassName = [
    styles.row,
    styles[`action-${commit.action}`],
    isSelected && styles.selected,
    isDragging && styles.dragging,
    isDropTarget && styles.dropTarget,
  ]
    .filter(Boolean)
    .join(' ');

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      onDragStart();
    },
    [index, onDragStart]
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver();
    },
    [onDragOver]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragEnd();
    },
    [onDragEnd]
  );

  // Handle SHA click
  const handleShaClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopySha();
    },
    [onCopySha]
  );

  // Handle row click
  const handleRowClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  // Handle row double-click
  const handleRowDoubleClick = useCallback(() => {
    onDoubleClick();
  }, [onDoubleClick]);

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
  };

  return (
    <div
      ref={rowRef}
      className={rowClassName}
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      data-index={dataIndex}
      role="row"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
    >
      {/* Drop zone indicator */}
      {isDropTarget && <div className={styles.dropZone}>DROP HERE</div>}

      {/* Squash/fixup indicator */}
      {(commit.action === 'squash' || commit.action === 'fixup') && (
        <span className={styles.squashIndicator}>&#x21B3;</span>
      )}

      {/* Drag handle */}
      <div className={styles.dragHandle} title="Drag to reorder">
        <span className={styles.dragIcon}>&#x22EE;&#x22EE;</span>
      </div>

      {/* Action dropdown */}
      <div className={styles.actionCell}>
        <ActionDropdown
          value={commit.action}
          onChange={onActionChange}
          simplifiedLabels={simplifiedLabels}
        />
      </div>

      {/* SHA (clickable to copy) */}
      <button
        className={styles.sha}
        onClick={handleShaClick}
        title="Click to copy full SHA"
        type="button"
      >
        {commit.shortSha}
      </button>

      {/* Commit message */}
      <div className={styles.message} title={commit.message}>
        {commit.message}
      </div>

      {/* Author */}
      <div className={styles.author} title={commit.email}>
        {commit.author}
      </div>

      {/* Date */}
      <div className={styles.date} title={commit.date.toLocaleString()}>
        {commit.relativeDate || formatDate(commit.date)}
      </div>
    </div>
  );
}

export default CommitRow;
