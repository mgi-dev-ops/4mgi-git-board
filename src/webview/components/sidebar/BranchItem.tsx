import React, { useCallback, useRef } from 'react';
import styles from './BranchList.module.css';
import type { Branch } from '../../../core/messages/types';

export interface BranchItemProps {
  branch: Branch;
  isSelected?: boolean;
  onSelect?: (branch: Branch) => void;
  onCheckout?: (branch: Branch) => void;
  onContextMenu?: (branch: Branch, event: React.MouseEvent) => void;
}

/**
 * BranchItem component - represents a single branch in the list
 *
 * Features:
 * - Branch name (truncated if long)
 * - Current indicator (bullet)
 * - Protection indicator (lock icon)
 * - Remote tracking info
 * - Ahead/behind count badges
 * - Context menu trigger
 */
export function BranchItem({
  branch,
  isSelected = false,
  onSelect,
  onCheckout,
  onContextMenu,
}: BranchItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);

  const handleClick = useCallback(() => {
    onSelect?.(branch);
  }, [branch, onSelect]);

  const handleDoubleClick = useCallback(() => {
    onCheckout?.(branch);
  }, [branch, onCheckout]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onContextMenu?.(branch, event);
    },
    [branch, onContextMenu]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(branch);
      }
    },
    [branch, onSelect]
  );

  const handleContextMenuButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onContextMenu?.(branch, event);
    },
    [branch, onContextMenu]
  );

  // Determine if this is a remote branch
  const isRemote = !!branch.remote && !branch.tracking;

  // Build class names
  const itemClasses = [
    styles.branchItem,
    branch.current ? styles.branchItemCurrent : '',
    isSelected && !branch.current ? styles.branchItemSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Get display name (remove remote prefix for remote branches if needed)
  const displayName = branch.name;

  // Format tracking info
  const trackingDisplay = branch.tracking
    ? `-> ${branch.tracking}`
    : isRemote && branch.remote
      ? branch.remote
      : null;

  return (
    <li
      ref={itemRef}
      role="treeitem"
      className={itemClasses}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-selected={branch.current || isSelected}
      aria-label={`Branch ${branch.name}${branch.current ? ' (current)' : ''}${branch.hasPolicy ? ' (protected)' : ''}`}
      title={branch.name}
    >
      {/* Branch Icon */}
      <span className={styles.branchIcon} aria-hidden="true">
        {branch.current ? '\u25CF' : isRemote ? '\u2601' : '\u25CB'}
      </span>

      {/* Branch Name */}
      <span className={styles.branchName}>{displayName}</span>

      {/* Protection Badge */}
      {branch.hasPolicy && (
        <span
          className={styles.protectedBadge}
          title="Protected branch (has policies)"
          aria-label="Protected"
        >
          \uD83D\uDD12
        </span>
      )}

      {/* Ahead/Behind Badges */}
      {(branch.ahead > 0 || branch.behind > 0) && (
        <span className={styles.badges}>
          {branch.ahead > 0 && (
            <span
              className={`${styles.badge} ${styles.badgeAhead}`}
              title={`${branch.ahead} commit(s) ahead`}
            >
              +{branch.ahead}
            </span>
          )}
          {branch.behind > 0 && (
            <span
              className={`${styles.badge} ${styles.badgeBehind}`}
              title={`${branch.behind} commit(s) behind`}
            >
              -{branch.behind}
            </span>
          )}
        </span>
      )}

      {/* Tracking Info */}
      {trackingDisplay && (
        <span className={styles.trackingInfo} title={trackingDisplay}>
          {trackingDisplay}
        </span>
      )}

      {/* Context Menu Trigger */}
      <button
        className={styles.contextMenuTrigger}
        onClick={handleContextMenuButtonClick}
        aria-label={`More actions for ${branch.name}`}
        title="More actions"
        type="button"
      >
        <MoreIcon />
      </button>
    </li>
  );
}

/**
 * Three-dot icon for context menu
 */
function MoreIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="3" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default BranchItem;
