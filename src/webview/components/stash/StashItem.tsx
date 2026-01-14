import React, { useCallback, useState } from "react";
import type { GitStash } from "../../stores/gitStore";
import styles from "./StashPanel.module.css";

// ============================================================================
// Icons
// ============================================================================

const BranchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6.5a2 2 0 01-2 2H8v2.878a2.25 2.25 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v2.128a.5.5 0 00.5.5h2.5a.5.5 0 00.5-.5v-1.128A2.251 2.251 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
  </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.75 1.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V4.664a.25.25 0 00-.073-.177l-2.914-2.914a.25.25 0 00-.177-.073H3.75zM2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75z" />
  </svg>
);

const ApplyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
  </svg>
);

const PopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.25 3A2.25 2.25 0 002 5.25v5.5A2.25 2.25 0 004.25 13h7.5A2.25 2.25 0 0014 10.75v-5.5A2.25 2.25 0 0011.75 3h-7.5zm4.03 1.72a.75.75 0 00-1.06 1.06L8.44 7H5.75a.75.75 0 000 1.5h2.69l-1.22 1.22a.75.75 0 101.06 1.06l2.5-2.5a.75.75 0 000-1.06l-2.5-2.5z" />
  </svg>
);

const DropIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z" />
  </svg>
);

const ViewIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 010 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 010-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2zM1.679 7.932a.12.12 0 000 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.824-.742 3.955-1.715 1.125-.967 1.955-2.095 2.366-2.717a.12.12 0 000-.136c-.411-.622-1.241-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.125.967-1.955 2.095-2.366 2.717zM8 6a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

export interface StashItemProps {
  stash: GitStash;
  selected?: boolean;
  filesCount?: number;
  onSelect?: (stash: GitStash) => void;
  onApply?: (stash: GitStash) => void;
  onPop?: (stash: GitStash) => void;
  onDrop?: (stash: GitStash) => void;
  onView?: (stash: GitStash) => void;
  onContextMenu?: (event: React.MouseEvent, stash: GitStash) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  } else {
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  }
}

// ============================================================================
// Component
// ============================================================================

export function StashItem({
  stash,
  selected = false,
  filesCount,
  onSelect,
  onApply,
  onPop,
  onDrop,
  onView,
  onContextMenu,
}: StashItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onSelect?.(stash);
  }, [stash, onSelect]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.(stash);
      }
    },
    [stash, onSelect]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onContextMenu?.(event, stash);
    },
    [stash, onContextMenu]
  );

  const handleApply = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onApply?.(stash);
    },
    [stash, onApply]
  );

  const handlePop = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onPop?.(stash);
    },
    [stash, onPop]
  );

  const handleDrop = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDrop?.(stash);
    },
    [stash, onDrop]
  );

  const handleView = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onView?.(stash);
    },
    [stash, onView]
  );

  const relativeDate = formatRelativeDate(stash.date);
  const displayMessage = stash.message || "WIP on " + stash.branch;

  return (
    <div
      className={`${styles.stashItem} ${selected ? styles.stashItemSelected : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="option"
      aria-selected={selected}
    >
      <div className={styles.stashItemHeader}>
        <span className={styles.stashIndex}>stash@{"{" + stash.index + "}"}</span>
        <span className={styles.stashMessage} title={displayMessage}>
          {displayMessage}
        </span>
      </div>

      <div className={styles.stashItemMeta}>
        <span className={styles.stashBranch} title={`Branch: ${stash.branch}`}>
          <BranchIcon className={styles.stashBranchIcon} />
          {stash.branch}
        </span>
        <span className={styles.stashDate} title={new Date(stash.date).toLocaleString()}>
          {relativeDate}
        </span>
        {filesCount !== undefined && (
          <span className={styles.stashFilesCount} title={`${filesCount} file(s) changed`}>
            <FileIcon className={styles.stashFilesIcon} />
            {filesCount} file{filesCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {(isHovered || selected) && (
        <div className={styles.stashItemActions}>
          {onApply && (
            <button
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={handleApply}
              title="Apply stash (keep in stash list)"
              aria-label="Apply stash"
            >
              <ApplyIcon className={styles.actionButtonIcon} />
              Apply
            </button>
          )}
          {onPop && (
            <button
              className={styles.actionButton}
              onClick={handlePop}
              title="Pop stash (apply and remove from list)"
              aria-label="Pop stash"
            >
              <PopIcon className={styles.actionButtonIcon} />
              Pop
            </button>
          )}
          {onView && (
            <button
              className={styles.actionButton}
              onClick={handleView}
              title="View stash contents"
              aria-label="View stash"
            >
              <ViewIcon className={styles.actionButtonIcon} />
              View
            </button>
          )}
          {onDrop && (
            <button
              className={`${styles.actionButton} ${styles.actionButtonDanger}`}
              onClick={handleDrop}
              title="Drop stash (permanently delete)"
              aria-label="Drop stash"
            >
              <DropIcon className={styles.actionButtonIcon} />
              Drop
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default StashItem;
