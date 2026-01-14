import { useEffect, useCallback } from 'react';
import type { RebaseAction } from './types';
import { KEYBOARD_SHORTCUTS } from './types';

export interface UseRebaseKeyboardOptions {
  /** Whether keyboard shortcuts are enabled */
  enabled: boolean;
  /** Currently selected commit index */
  selectedIndex: number;
  /** Total number of commits */
  commitCount: number;
  /** Callback when action changes */
  onActionChange: (index: number, action: RebaseAction) => void;
  /** Callback when selection changes */
  onSelectionChange: (index: number) => void;
  /** Callback when commit should move up */
  onMoveUp: () => void;
  /** Callback when commit should move down */
  onMoveDown: () => void;
  /** Callback when message should be edited */
  onEditMessage: () => void;
  /** Callback when rebase should start */
  onStartRebase: () => void;
  /** Callback when action should be cancelled */
  onCancel: () => void;
}

/**
 * Custom hook for managing keyboard shortcuts in Interactive Rebase View
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Keyboard Shortcuts
 *
 * Shortcuts:
 * - p: pick
 * - r: reword
 * - e: edit
 * - s: squash
 * - f: fixup
 * - d: drop
 * - Arrow Up/Down: navigate commits
 * - Ctrl+Arrow Up/Down: move commit
 * - Enter: edit message
 * - Escape: cancel
 * - Ctrl+Enter: start rebase
 */
export function useRebaseKeyboard({
  enabled,
  selectedIndex,
  commitCount,
  onActionChange,
  onSelectionChange,
  onMoveUp,
  onMoveDown,
  onEditMessage,
  onStartRebase,
  onCancel,
}: UseRebaseKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if disabled or if target is input/textarea
      if (!enabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      // Navigation - Arrow Up
      if (key === 'arrowup' && !isCtrl) {
        e.preventDefault();
        const newIndex = Math.max(0, selectedIndex - 1);
        onSelectionChange(newIndex);
        return;
      }

      // Navigation - Arrow Down
      if (key === 'arrowdown' && !isCtrl) {
        e.preventDefault();
        const newIndex = Math.min(commitCount - 1, selectedIndex + 1);
        onSelectionChange(newIndex);
        return;
      }

      // Move commit up - Ctrl+Arrow Up
      if (key === 'arrowup' && isCtrl) {
        e.preventDefault();
        onMoveUp();
        return;
      }

      // Move commit down - Ctrl+Arrow Down
      if (key === 'arrowdown' && isCtrl) {
        e.preventDefault();
        onMoveDown();
        return;
      }

      // Action shortcuts
      if (key === KEYBOARD_SHORTCUTS.pick) {
        e.preventDefault();
        onActionChange(selectedIndex, 'pick');
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.reword) {
        e.preventDefault();
        onActionChange(selectedIndex, 'reword');
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.edit) {
        e.preventDefault();
        onActionChange(selectedIndex, 'edit');
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.squash) {
        e.preventDefault();
        onActionChange(selectedIndex, 'squash');
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.fixup) {
        e.preventDefault();
        onActionChange(selectedIndex, 'fixup');
        return;
      }

      if (key === KEYBOARD_SHORTCUTS.drop) {
        e.preventDefault();
        onActionChange(selectedIndex, 'drop');
        return;
      }

      // Edit message - Enter
      if (key === 'enter' && !isCtrl) {
        e.preventDefault();
        onEditMessage();
        return;
      }

      // Start rebase - Ctrl+Enter
      if (key === 'enter' && isCtrl) {
        e.preventDefault();
        onStartRebase();
        return;
      }

      // Cancel - Escape
      if (key === 'escape') {
        e.preventDefault();
        onCancel();
        return;
      }
    },
    [
      enabled,
      selectedIndex,
      commitCount,
      onActionChange,
      onSelectionChange,
      onMoveUp,
      onMoveDown,
      onEditMessage,
      onStartRebase,
      onCancel,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useRebaseKeyboard;
