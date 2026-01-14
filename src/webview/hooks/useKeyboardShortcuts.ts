/**
 * useKeyboardShortcuts Hook
 * Global keyboard event handler for 4MGI Git Board
 *
 * Features:
 * - Register/unregister shortcuts dynamically
 * - Handle modifiers (Ctrl, Shift, Alt, Meta)
 * - Prevent conflicts with VS Code shortcuts
 * - Context-aware shortcuts (e.g., rebase mode)
 */

import { useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

export interface ShortcutDefinition {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display key (e.g., 'Space', 'Enter', 'c') */
  key: string;
  /** Key code to match (e.g., ' ', 'Enter', 'c') */
  code: string;
  /** Required modifiers */
  modifiers?: ModifierKey[];
  /** Callback when shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
  /** Context in which shortcut is active (null = always active) */
  context?: ShortcutContext | null;
  /** Human-readable description */
  description: string;
  /** Category for grouping in help dialog */
  category: ShortcutCategory;
  /** Whether shortcut is currently enabled */
  enabled?: boolean;
}

export type ShortcutContext =
  | 'graph'
  | 'rebase'
  | 'commit-dialog'
  | 'search'
  | 'modal';

export type ShortcutCategory =
  | 'navigation'
  | 'git-operations'
  | 'rebase'
  | 'general';

export interface ShortcutRegistry {
  shortcuts: Map<string, ShortcutDefinition>;
  register: (shortcut: ShortcutDefinition) => void;
  unregister: (id: string) => void;
  enable: (id: string) => void;
  disable: (id: string) => void;
  getByCategory: (category: ShortcutCategory) => ShortcutDefinition[];
  getAll: () => ShortcutDefinition[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize key from KeyboardEvent
 */
function normalizeKey(event: KeyboardEvent): string {
  // Handle special keys
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'Escape': 'Escape',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
  };

  return specialKeys[event.key] || event.key.toLowerCase();
}

/**
 * Check if event matches shortcut modifiers
 */
function matchesModifiers(event: KeyboardEvent, modifiers?: ModifierKey[]): boolean {
  const required = modifiers || [];

  const hasCtrl = required.includes('ctrl');
  const hasShift = required.includes('shift');
  const hasAlt = required.includes('alt');
  const hasMeta = required.includes('meta');

  return (
    event.ctrlKey === hasCtrl &&
    event.shiftKey === hasShift &&
    event.altKey === hasAlt &&
    event.metaKey === hasMeta
  );
}

/**
 * Check if focus is on an input element
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = (activeElement as HTMLElement).isContentEditable;

  return isInput || isContentEditable;
}

/**
 * Format shortcut for display (e.g., "Ctrl+Enter")
 */
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];

  if (shortcut.modifiers?.includes('ctrl')) parts.push('Ctrl');
  if (shortcut.modifiers?.includes('shift')) parts.push('Shift');
  if (shortcut.modifiers?.includes('alt')) parts.push('Alt');
  if (shortcut.modifiers?.includes('meta')) parts.push('Cmd');

  // Format key for display
  const keyDisplay = shortcut.key === 'ArrowUp' ? '\u2191' :
                     shortcut.key === 'ArrowDown' ? '\u2193' :
                     shortcut.key === 'ArrowLeft' ? '\u2190' :
                     shortcut.key === 'ArrowRight' ? '\u2192' :
                     shortcut.key;

  parts.push(keyDisplay);

  return parts.join('+');
}

// =============================================================================
// useKeyboardShortcuts Hook
// =============================================================================

export interface UseKeyboardShortcutsOptions {
  /** Current active context */
  context?: ShortcutContext | null;
  /** Whether to enable shortcuts globally */
  enabled?: boolean;
  /** Whether to ignore shortcuts when input is focused */
  ignoreInputFocus?: boolean;
}

export interface UseKeyboardShortcutsReturn {
  /** Register a new shortcut */
  register: (shortcut: ShortcutDefinition) => void;
  /** Unregister a shortcut by ID */
  unregister: (id: string) => void;
  /** Enable a shortcut */
  enable: (id: string) => void;
  /** Disable a shortcut */
  disable: (id: string) => void;
  /** Get all shortcuts by category */
  getByCategory: (category: ShortcutCategory) => ShortcutDefinition[];
  /** Get all registered shortcuts */
  getAll: () => ShortcutDefinition[];
  /** Check if a shortcut is registered */
  isRegistered: (id: string) => boolean;
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const {
    context = null,
    enabled = true,
    ignoreInputFocus = true,
  } = options;

  // Use ref to store shortcuts to avoid recreating handler on every register/unregister
  const shortcutsRef = useRef<Map<string, ShortcutDefinition>>(new Map());

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if shortcuts are disabled
    if (!enabled) return;

    // Skip if input is focused and ignoreInputFocus is true
    if (ignoreInputFocus && isInputFocused()) {
      // Exception: Allow Escape to work even in inputs
      if (event.key !== 'Escape') return;
    }

    const normalizedKey = normalizeKey(event);

    // Find matching shortcut
    for (const shortcut of shortcutsRef.current.values()) {
      // Skip disabled shortcuts
      if (shortcut.enabled === false) continue;

      // Check context match
      if (shortcut.context && shortcut.context !== context) continue;

      // Check key match
      const shortcutKey = shortcut.code.toLowerCase();
      const eventKey = normalizedKey.toLowerCase();

      if (shortcutKey !== eventKey && shortcut.code !== event.key) continue;

      // Check modifiers match
      if (!matchesModifiers(event, shortcut.modifiers)) continue;

      // Shortcut matched - execute handler
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      if (shortcut.stopPropagation) {
        event.stopPropagation();
      }

      shortcut.handler(event);
      return;
    }
  }, [enabled, ignoreInputFocus, context]);

  // Setup global keyboard listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Register shortcut
  const register = useCallback((shortcut: ShortcutDefinition) => {
    shortcutsRef.current.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled ?? true,
    });
  }, []);

  // Unregister shortcut
  const unregister = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
  }, []);

  // Enable shortcut
  const enable = useCallback((id: string) => {
    const shortcut = shortcutsRef.current.get(id);
    if (shortcut) {
      shortcutsRef.current.set(id, { ...shortcut, enabled: true });
    }
  }, []);

  // Disable shortcut
  const disable = useCallback((id: string) => {
    const shortcut = shortcutsRef.current.get(id);
    if (shortcut) {
      shortcutsRef.current.set(id, { ...shortcut, enabled: false });
    }
  }, []);

  // Get shortcuts by category
  const getByCategory = useCallback((category: ShortcutCategory): ShortcutDefinition[] => {
    return Array.from(shortcutsRef.current.values())
      .filter(s => s.category === category);
  }, []);

  // Get all shortcuts
  const getAll = useCallback((): ShortcutDefinition[] => {
    return Array.from(shortcutsRef.current.values());
  }, []);

  // Check if shortcut is registered
  const isRegistered = useCallback((id: string): boolean => {
    return shortcutsRef.current.has(id);
  }, []);

  return {
    register,
    unregister,
    enable,
    disable,
    getByCategory,
    getAll,
    isRegistered,
  };
}

// =============================================================================
// Default Shortcuts Factory
// =============================================================================

export interface ShortcutHandlers {
  // Graph Navigation
  onToggleExpandCommit?: () => void;
  onCheckoutOrOpen?: () => void;
  onFocusSearch?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;

  // Git Operations
  onOpenCommitDialog?: () => void;
  onPush?: () => void;
  onFetch?: () => void;
  onUndo?: () => void;
  onLinkWorkItem?: () => void;

  // Rebase Operations
  onRebaseSetPick?: () => void;
  onRebaseSetReword?: () => void;
  onRebaseSetEdit?: () => void;
  onRebaseSetSquash?: () => void;
  onRebaseSetFixup?: () => void;
  onRebaseSetDrop?: () => void;
  onRebaseMoveUp?: () => void;
  onRebaseMoveDown?: () => void;
  onRebaseEditMessage?: () => void;
  onRebaseCancel?: () => void;
  onRebaseStart?: () => void;

  // General
  onShowHelp?: () => void;
  onEscape?: () => void;
}

/**
 * Create default shortcut definitions
 */
export function createDefaultShortcuts(handlers: ShortcutHandlers): ShortcutDefinition[] {
  const shortcuts: ShortcutDefinition[] = [];

  // ==========================================================================
  // Graph Navigation Shortcuts
  // ==========================================================================

  if (handlers.onToggleExpandCommit) {
    shortcuts.push({
      id: 'graph.toggle-expand',
      key: 'Space',
      code: ' ',
      handler: handlers.onToggleExpandCommit,
      description: 'Toggle expand commit',
      category: 'navigation',
      context: 'graph',
    });
  }

  if (handlers.onCheckoutOrOpen) {
    shortcuts.push({
      id: 'graph.checkout-open',
      key: 'Enter',
      code: 'Enter',
      handler: handlers.onCheckoutOrOpen,
      description: 'Checkout/Open',
      category: 'navigation',
      context: 'graph',
    });
  }

  if (handlers.onFocusSearch) {
    shortcuts.push({
      id: 'graph.focus-search',
      key: '/',
      code: '/',
      handler: handlers.onFocusSearch,
      description: 'Focus search',
      category: 'navigation',
    });
  }

  if (handlers.onNavigateUp) {
    shortcuts.push({
      id: 'graph.navigate-up',
      key: 'ArrowUp',
      code: 'ArrowUp',
      handler: handlers.onNavigateUp,
      description: 'Navigate to previous commit',
      category: 'navigation',
      context: 'graph',
    });
  }

  if (handlers.onNavigateDown) {
    shortcuts.push({
      id: 'graph.navigate-down',
      key: 'ArrowDown',
      code: 'ArrowDown',
      handler: handlers.onNavigateDown,
      description: 'Navigate to next commit',
      category: 'navigation',
      context: 'graph',
    });
  }

  // ==========================================================================
  // Git Operations Shortcuts
  // ==========================================================================

  if (handlers.onOpenCommitDialog) {
    shortcuts.push({
      id: 'git.commit',
      key: 'c',
      code: 'c',
      handler: handlers.onOpenCommitDialog,
      description: 'Open commit dialog',
      category: 'git-operations',
    });
  }

  if (handlers.onPush) {
    shortcuts.push({
      id: 'git.push',
      key: 'p',
      code: 'p',
      handler: handlers.onPush,
      description: 'Push to remote',
      category: 'git-operations',
    });
  }

  if (handlers.onFetch) {
    shortcuts.push({
      id: 'git.fetch',
      key: 'f',
      code: 'f',
      handler: handlers.onFetch,
      description: 'Fetch from remote',
      category: 'git-operations',
    });
  }

  if (handlers.onUndo) {
    shortcuts.push({
      id: 'git.undo',
      key: 'z',
      code: 'z',
      modifiers: ['ctrl'],
      handler: handlers.onUndo,
      description: 'Undo last action',
      category: 'git-operations',
    });
  }

  if (handlers.onLinkWorkItem) {
    shortcuts.push({
      id: 'git.link-work-item',
      key: 'w',
      code: 'w',
      handler: handlers.onLinkWorkItem,
      description: 'Link Work Item (Azure)',
      category: 'git-operations',
    });
  }

  // ==========================================================================
  // Interactive Rebase Shortcuts
  // ==========================================================================

  if (handlers.onRebaseSetPick) {
    shortcuts.push({
      id: 'rebase.pick',
      key: 'p',
      code: 'p',
      handler: handlers.onRebaseSetPick,
      description: 'Set action = pick',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseSetReword) {
    shortcuts.push({
      id: 'rebase.reword',
      key: 'r',
      code: 'r',
      handler: handlers.onRebaseSetReword,
      description: 'Set action = reword',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseSetEdit) {
    shortcuts.push({
      id: 'rebase.edit',
      key: 'e',
      code: 'e',
      handler: handlers.onRebaseSetEdit,
      description: 'Set action = edit',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseSetSquash) {
    shortcuts.push({
      id: 'rebase.squash',
      key: 's',
      code: 's',
      handler: handlers.onRebaseSetSquash,
      description: 'Set action = squash',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseSetFixup) {
    shortcuts.push({
      id: 'rebase.fixup',
      key: 'f',
      code: 'f',
      handler: handlers.onRebaseSetFixup,
      description: 'Set action = fixup',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseSetDrop) {
    shortcuts.push({
      id: 'rebase.drop',
      key: 'd',
      code: 'd',
      handler: handlers.onRebaseSetDrop,
      description: 'Set action = drop',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseMoveUp) {
    shortcuts.push({
      id: 'rebase.move-up',
      key: 'ArrowUp',
      code: 'ArrowUp',
      modifiers: ['ctrl'],
      handler: handlers.onRebaseMoveUp,
      description: 'Move commit up',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseMoveDown) {
    shortcuts.push({
      id: 'rebase.move-down',
      key: 'ArrowDown',
      code: 'ArrowDown',
      modifiers: ['ctrl'],
      handler: handlers.onRebaseMoveDown,
      description: 'Move commit down',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseEditMessage) {
    shortcuts.push({
      id: 'rebase.edit-message',
      key: 'Enter',
      code: 'Enter',
      handler: handlers.onRebaseEditMessage,
      description: 'Edit commit message',
      category: 'rebase',
      context: 'rebase',
    });
  }

  if (handlers.onRebaseCancel) {
    shortcuts.push({
      id: 'rebase.cancel',
      key: 'Escape',
      code: 'Escape',
      handler: handlers.onRebaseCancel,
      description: 'Cancel/Close',
      category: 'rebase',
      context: 'rebase',
      preventDefault: false, // Allow default escape behavior
    });
  }

  if (handlers.onRebaseStart) {
    shortcuts.push({
      id: 'rebase.start',
      key: 'Enter',
      code: 'Enter',
      modifiers: ['ctrl'],
      handler: handlers.onRebaseStart,
      description: 'Start Rebase',
      category: 'rebase',
      context: 'rebase',
    });
  }

  // ==========================================================================
  // General Shortcuts
  // ==========================================================================

  if (handlers.onShowHelp) {
    shortcuts.push({
      id: 'general.help',
      key: '?',
      code: '?',
      handler: handlers.onShowHelp,
      description: 'Show keyboard shortcuts help',
      category: 'general',
    });
  }

  if (handlers.onEscape) {
    shortcuts.push({
      id: 'general.escape',
      key: 'Escape',
      code: 'Escape',
      handler: handlers.onEscape,
      description: 'Close modal/Cancel',
      category: 'general',
      preventDefault: false,
    });
  }

  return shortcuts;
}

export default useKeyboardShortcuts;
