import React, { useState, useCallback, useMemo } from 'react';
import styles from './BranchList.module.css';
import { BranchItem } from './BranchItem';
import { BranchContextMenu, ContextMenuAction } from './BranchContextMenu';
import { CreateBranchDialog } from './CreateBranchDialog';
import type { Branch, Commit } from '../../../core/messages/types';

export interface BranchListProps {
  /** List of all branches (local + remote) */
  branches: Branch[];
  /** Current branch name */
  currentBranch: string;
  /** Recent commits (for create branch from commit) */
  commits?: Commit[];
  /** Whether this is an Azure DevOps repository */
  isAzureRepo?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when a branch is selected */
  onSelect?: (branch: Branch) => void;
  /** Callback when checkout is requested (double-click) */
  onCheckout?: (branch: Branch) => void;
  /** Callback when merge is requested */
  onMerge?: (branch: Branch) => void;
  /** Callback when rebase is requested */
  onRebase?: (branch: Branch) => void;
  /** Callback when create PR is requested */
  onCreatePR?: (branch: Branch) => void;
  /** Callback when rename is requested */
  onRename?: (branch: Branch) => void;
  /** Callback when delete is requested */
  onDelete?: (branch: Branch) => void;
  /** Callback when view policies is requested (Azure) */
  onViewPolicies?: (branch: Branch) => void;
  /** Callback when a new branch is created */
  onCreateBranch?: (name: string, from: string, checkout: boolean) => void;
  /** Callback to refresh branch list */
  onRefresh?: () => void;
}

interface ContextMenuState {
  branch: Branch;
  position: { x: number; y: number };
}

/**
 * BranchList component - displays all branches in a tree structure
 *
 * Layout:
 * ```
 * Branches
 * +- Local
 * |  +- main (current)
 * |  +- develop [+2 -1]
 * |  +- feature/xyz
 * +- Remote
 *    +- origin/main
 *    +- origin/develop
 * ```
 *
 * Features:
 * - Tree structure with Local/Remote sections
 * - Current branch highlighted
 * - Protected branch indicator (lock icon)
 * - Ahead/behind count badges
 * - Double-click to checkout
 * - Context menu for actions
 * - Create new branch dialog
 */
export function BranchList({
  branches,
  currentBranch,
  commits = [],
  isAzureRepo = false,
  loading = false,
  error = null,
  onSelect,
  onCheckout,
  onMerge,
  onRebase,
  onCreatePR,
  onRename,
  onDelete,
  onViewPolicies,
  onCreateBranch,
  onRefresh,
}: BranchListProps) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['local', 'remote'])
  );

  // Separate local and remote branches
  const { localBranches, remoteBranches } = useMemo(() => {
    const local: Branch[] = [];
    const remote: Branch[] = [];

    branches.forEach((branch) => {
      // A branch is remote if it has a remote property but no tracking
      // (tracking means it's a local branch that tracks a remote)
      const isRemoteOnly = !!branch.remote && !branch.tracking && branch.name.includes('/');

      if (isRemoteOnly) {
        remote.push(branch);
      } else {
        local.push(branch);
      }
    });

    // Sort: current branch first, then alphabetically
    local.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return a.name.localeCompare(b.name);
    });

    remote.sort((a, b) => a.name.localeCompare(b.name));

    return { localBranches: local, remoteBranches: remote };
  }, [branches]);

  // Handle section toggle
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Handle branch selection
  const handleSelect = useCallback(
    (branch: Branch) => {
      setSelectedBranch(branch);
      onSelect?.(branch);
    },
    [onSelect]
  );

  // Handle branch checkout (double-click)
  const handleCheckout = useCallback(
    (branch: Branch) => {
      onCheckout?.(branch);
    },
    [onCheckout]
  );

  // Handle context menu open
  const handleContextMenu = useCallback(
    (branch: Branch, event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        branch,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  // Handle context menu close
  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle context menu action
  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction, branch: Branch) => {
      switch (action) {
        case 'checkout':
          onCheckout?.(branch);
          break;
        case 'merge':
          onMerge?.(branch);
          break;
        case 'rebase':
          onRebase?.(branch);
          break;
        case 'createPR':
          onCreatePR?.(branch);
          break;
        case 'rename':
          onRename?.(branch);
          break;
        case 'delete':
          onDelete?.(branch);
          break;
        case 'viewPolicies':
          onViewPolicies?.(branch);
          break;
      }
    },
    [onCheckout, onMerge, onRebase, onCreatePR, onRename, onDelete, onViewPolicies]
  );

  // Handle create branch
  const handleOpenCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleCreateBranch = useCallback(
    (name: string, from: string, checkout: boolean) => {
      onCreateBranch?.(name, from, checkout);
    },
    [onCreateBranch]
  );

  // Render loading state
  if (loading) {
    return (
      <div className={styles.branchListContainer}>
        <div className={styles.loading}>
          <svg
            className={styles.spinner}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset="10"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={styles.branchListContainer}>
        <div className={styles.error}>
          {error}
          {onRefresh && (
            <button onClick={onRefresh} style={{ marginLeft: 8 }}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.branchListContainer}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Branches</span>
        <div className={styles.headerActions}>
          {onRefresh && (
            <button
              className={styles.headerAction}
              onClick={onRefresh}
              title="Refresh branches"
              aria-label="Refresh branches"
            >
              <RefreshIcon />
            </button>
          )}
          {onCreateBranch && (
            <button
              className={styles.headerAction}
              onClick={handleOpenCreateDialog}
              title="Create new branch"
              aria-label="Create new branch"
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>

      {/* Tree Container */}
      <div className={styles.treeContainer}>
        <ul className={styles.tree} role="tree" aria-label="Branch list">
          {/* Local Branches Section */}
          <li className={styles.section} role="group">
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('local')}
              aria-expanded={expandedSections.has('local')}
            >
              <span
                className={`${styles.chevron} ${expandedSections.has('local') ? styles.chevronExpanded : ''}`}
                aria-hidden="true"
              >
                {'\u25B6'}
              </span>
              <span className={styles.sectionIcon} aria-hidden="true">
                {'\uD83D\uDCBB'}
              </span>
              <span className={styles.sectionTitle}>Local</span>
              <span className={styles.sectionCount}>{localBranches.length}</span>
            </button>

            {expandedSections.has('local') && (
              <div className={styles.sectionContent}>
                {localBranches.length > 0 ? (
                  <ul className={styles.branchList} role="group">
                    {localBranches.map((branch) => (
                      <BranchItem
                        key={branch.name}
                        branch={branch}
                        isSelected={selectedBranch?.name === branch.name}
                        onSelect={handleSelect}
                        onCheckout={handleCheckout}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyState}>No local branches</div>
                )}
              </div>
            )}
          </li>

          {/* Remote Branches Section */}
          <li className={styles.section} role="group">
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('remote')}
              aria-expanded={expandedSections.has('remote')}
            >
              <span
                className={`${styles.chevron} ${expandedSections.has('remote') ? styles.chevronExpanded : ''}`}
                aria-hidden="true"
              >
                {'\u25B6'}
              </span>
              <span className={styles.sectionIcon} aria-hidden="true">
                {'\u2601'}
              </span>
              <span className={styles.sectionTitle}>Remote</span>
              <span className={styles.sectionCount}>{remoteBranches.length}</span>
            </button>

            {expandedSections.has('remote') && (
              <div className={styles.sectionContent}>
                {remoteBranches.length > 0 ? (
                  <ul className={styles.branchList} role="group">
                    {remoteBranches.map((branch) => (
                      <BranchItem
                        key={branch.name}
                        branch={branch}
                        isSelected={selectedBranch?.name === branch.name}
                        onSelect={handleSelect}
                        onCheckout={handleCheckout}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className={styles.emptyState}>No remote branches</div>
                )}
              </div>
            )}
          </li>
        </ul>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <BranchContextMenu
          branch={contextMenu.branch}
          currentBranch={currentBranch}
          position={contextMenu.position}
          onAction={handleContextMenuAction}
          onClose={handleContextMenuClose}
          isAzureRepo={isAzureRepo}
        />
      )}

      {/* Create Branch Dialog */}
      <CreateBranchDialog
        isOpen={isCreateDialogOpen}
        branches={branches}
        commits={commits}
        currentBranch={currentBranch}
        onClose={handleCloseCreateDialog}
        onCreate={handleCreateBranch}
      />
    </div>
  );
}

/**
 * Refresh icon
 */
function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.451 5.609A5.998 5.998 0 0 0 2.022 7.5H1L3 10l2-2.5H3.98a4.5 4.5 0 0 1 8.564-1.64l.907-.751zM13 6l-2 2.5h1.02a4.5 4.5 0 0 1-8.564 1.64l-.907.751A5.998 5.998 0 0 0 13.978 8.5H15L13 6z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Plus icon for create branch
 */
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BranchList;
