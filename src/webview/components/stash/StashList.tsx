import React, { useCallback } from "react";
import type { GitStash } from "../../stores/gitStore";
import { StashItem } from "./StashItem";
import styles from "./StashPanel.module.css";

// ============================================================================
// Types
// ============================================================================

export interface StashListProps {
  stashes: GitStash[];
  selectedStash?: GitStash | null;
  filesCountMap?: Map<number, number>;
  onSelectStash?: (stash: GitStash) => void;
  onApplyStash?: (stash: GitStash) => void;
  onPopStash?: (stash: GitStash) => void;
  onDropStash?: (stash: GitStash) => void;
  onViewStash?: (stash: GitStash) => void;
  onContextMenu?: (event: React.MouseEvent, stash: GitStash) => void;
}

// ============================================================================
// Empty State Icon
// ============================================================================

const StashEmptyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="currentColor" opacity="0.5">
    <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm0 36c-8.837 0-16-7.163-16-16S15.163 8 24 8s16 7.163 16 16-7.163 16-16 16z" />
    <path d="M16 20h16v2H16zm0 6h16v2H16z" />
    <rect x="22" y="14" width="4" height="20" rx="1" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function StashList({
  stashes,
  selectedStash,
  filesCountMap,
  onSelectStash,
  onApplyStash,
  onPopStash,
  onDropStash,
  onViewStash,
  onContextMenu,
}: StashListProps) {
  const handleSelect = useCallback(
    (stash: GitStash) => {
      onSelectStash?.(stash);
    },
    [onSelectStash]
  );

  const handleApply = useCallback(
    (stash: GitStash) => {
      onApplyStash?.(stash);
    },
    [onApplyStash]
  );

  const handlePop = useCallback(
    (stash: GitStash) => {
      onPopStash?.(stash);
    },
    [onPopStash]
  );

  const handleDrop = useCallback(
    (stash: GitStash) => {
      onDropStash?.(stash);
    },
    [onDropStash]
  );

  const handleView = useCallback(
    (stash: GitStash) => {
      onViewStash?.(stash);
    },
    [onViewStash]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, stash: GitStash) => {
      onContextMenu?.(event, stash);
    },
    [onContextMenu]
  );

  // Empty state
  if (stashes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <StashEmptyIcon className={styles.emptyIcon} />
        <div className={styles.emptyTitle}>No Stashes</div>
        <p className={styles.emptyDescription}>
          Your stash list is empty. Stash your changes to save them temporarily without committing.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stashList} role="listbox" aria-label="Stash list">
      {stashes.map((stash) => (
        <StashItem
          key={`stash-${stash.index}-${stash.hash}`}
          stash={stash}
          selected={selectedStash?.index === stash.index}
          filesCount={filesCountMap?.get(stash.index)}
          onSelect={handleSelect}
          onApply={onApplyStash ? handleApply : undefined}
          onPop={onPopStash ? handlePop : undefined}
          onDrop={onDropStash ? handleDrop : undefined}
          onView={onViewStash ? handleView : undefined}
          onContextMenu={handleContextMenu}
        />
      ))}
    </div>
  );
}

export default StashList;
