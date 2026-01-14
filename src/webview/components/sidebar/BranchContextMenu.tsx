import React, { useCallback, useEffect, useRef } from 'react';
import styles from './BranchList.module.css';
import type { Branch } from '../../../core/messages/types';

export type ContextMenuAction =
  | 'checkout'
  | 'merge'
  | 'rebase'
  | 'createPR'
  | 'rename'
  | 'delete'
  | 'viewPolicies';

export interface BranchContextMenuProps {
  branch: Branch;
  currentBranch: string;
  position: { x: number; y: number };
  onAction: (action: ContextMenuAction, branch: Branch) => void;
  onClose: () => void;
  isAzureRepo?: boolean;
}

interface MenuItem {
  action: ContextMenuAction;
  label: string;
  icon: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

/**
 * BranchContextMenu component - context menu for branch actions
 *
 * Actions:
 * - Checkout
 * - Merge into current
 * - Rebase onto
 * - Create PR (for Azure/GitHub)
 * - Rename
 * - Delete
 * - View policies (Azure only)
 */
export function BranchContextMenu({
  branch,
  currentBranch,
  position,
  onAction,
  onClose,
  isAzureRepo = false,
}: BranchContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    // Focus first item when menu opens
    firstItemRef.current?.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }

      // Adjust vertical position
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  const handleAction = useCallback(
    (action: ContextMenuAction) => {
      onAction(action, branch);
      onClose();
    },
    [branch, onAction, onClose]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const items = menuRef.current?.querySelectorAll('button:not(:disabled)');
      if (!items?.length) return;

      const currentIndex = Array.from(items).findIndex(
        (item) => item === document.activeElement
      );

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % items.length;
          (items[nextIndex] as HTMLElement).focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          (items[prevIndex] as HTMLElement).focus();
          break;
        case 'Home':
          event.preventDefault();
          (items[0] as HTMLElement).focus();
          break;
        case 'End':
          event.preventDefault();
          (items[items.length - 1] as HTMLElement).focus();
          break;
      }
    },
    []
  );

  // Determine which actions are available
  const isCurrentBranch = branch.name === currentBranch || branch.current;
  const isRemoteBranch = !!branch.remote && !branch.tracking;
  const isProtected = branch.hasPolicy;

  // Build menu items
  const menuItems: MenuItem[] = [
    {
      action: 'checkout',
      label: 'Checkout',
      icon: '\u21A9',
      disabled: isCurrentBranch,
    },
    {
      action: 'merge',
      label: `Merge into ${currentBranch}`,
      icon: '\u{1F500}',
      disabled: isCurrentBranch,
      separator: true,
    },
    {
      action: 'rebase',
      label: `Rebase onto ${branch.name}`,
      icon: '\u21B3',
      disabled: isCurrentBranch,
    },
    {
      action: 'createPR',
      label: 'Create Pull Request',
      icon: '\u{1F517}',
      disabled: isRemoteBranch,
      separator: true,
    },
    {
      action: 'rename',
      label: 'Rename',
      icon: '\u270F',
      disabled: isRemoteBranch || isProtected,
    },
    {
      action: 'delete',
      label: 'Delete',
      icon: '\u{1F5D1}',
      disabled: isCurrentBranch || isProtected,
      danger: true,
    },
  ];

  // Add Azure-specific items
  if (isAzureRepo && isProtected) {
    menuItems.push({
      action: 'viewPolicies',
      label: 'View Branch Policies',
      icon: '\uD83D\uDCCB',
      separator: true,
    });
  }

  return (
    <div className={styles.contextMenuOverlay} onClick={onClose}>
      <div
        ref={menuRef}
        className={styles.contextMenu}
        role="menu"
        aria-label={`Actions for branch ${branch.name}`}
        style={{ left: position.x, top: position.y }}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => (
          <React.Fragment key={item.action}>
            {item.separator && index > 0 && (
              <div className={styles.contextMenuSeparator} role="separator" />
            )}
            <button
              ref={index === 0 ? firstItemRef : undefined}
              className={`${styles.contextMenuItem} ${item.danger ? styles.contextMenuItemDanger : ''}`}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleAction(item.action)}
              aria-disabled={item.disabled}
            >
              <span className={styles.contextMenuIcon} aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default BranchContextMenu;
