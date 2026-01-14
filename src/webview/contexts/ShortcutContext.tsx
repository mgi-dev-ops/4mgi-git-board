/**
 * ShortcutContext
 * React Context for keyboard shortcut management
 *
 * Provides:
 * - Shortcut registration across components
 * - Context switching (graph, rebase, modal, etc.)
 * - Help dialog trigger
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  useKeyboardShortcuts,
  createDefaultShortcuts,
  formatShortcut,
  type ShortcutDefinition,
  type ShortcutCategory,
  type ShortcutContext as ShortcutContextType,
  type ShortcutHandlers,
} from '../hooks/useKeyboardShortcuts';
import { useUIStore } from '../stores/uiStore';
import { useVSCodeApi } from '../hooks/useVSCodeApi';

// =============================================================================
// Types
// =============================================================================

interface ShortcutContextValue {
  /** Current active context */
  currentContext: ShortcutContextType | null;

  /** Set the active context */
  setContext: (context: ShortcutContextType | null) => void;

  /** Register a custom shortcut */
  registerShortcut: (shortcut: ShortcutDefinition) => void;

  /** Unregister a shortcut */
  unregisterShortcut: (id: string) => void;

  /** Enable a shortcut */
  enableShortcut: (id: string) => void;

  /** Disable a shortcut */
  disableShortcut: (id: string) => void;

  /** Get all shortcuts */
  getAllShortcuts: () => ShortcutDefinition[];

  /** Get shortcuts by category */
  getShortcutsByCategory: (category: ShortcutCategory) => ShortcutDefinition[];

  /** Check if help dialog is open */
  isHelpOpen: boolean;

  /** Open help dialog */
  openHelp: () => void;

  /** Close help dialog */
  closeHelp: () => void;

  /** Toggle help dialog */
  toggleHelp: () => void;

  /** Format shortcut for display */
  formatShortcut: (shortcut: ShortcutDefinition) => string;

  /** Whether shortcuts are enabled */
  enabled: boolean;

  /** Enable/disable shortcuts globally */
  setEnabled: (enabled: boolean) => void;
}

// =============================================================================
// Context
// =============================================================================

const ShortcutContextInstance = createContext<ShortcutContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

interface ShortcutProviderProps {
  children: ReactNode;
  /** Initial context */
  initialContext?: ShortcutContextType | null;
  /** Whether shortcuts are initially enabled */
  initialEnabled?: boolean;
  /** Custom shortcut handlers (override defaults) */
  customHandlers?: Partial<ShortcutHandlers>;
}

// =============================================================================
// Provider Component
// =============================================================================

export function ShortcutProvider({
  children,
  initialContext = 'graph',
  initialEnabled = true,
  customHandlers = {},
}: ShortcutProviderProps): JSX.Element {
  const [currentContext, setCurrentContext] = useState<ShortcutContextType | null>(initialContext);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [enabled, setEnabled] = useState(initialEnabled);

  // UI Store actions
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const selectCommit = useUIStore((state) => state.selectCommit);
  const selectedCommitHash = useUIStore((state) => state.selectedCommitHash);
  const setSearchQuery = useUIStore((state) => state.setSearchQuery);

  // VS Code API
  const { postMessage } = useVSCodeApi();

  // Initialize keyboard shortcuts hook
  const shortcuts = useKeyboardShortcuts({
    context: currentContext,
    enabled,
    ignoreInputFocus: true,
  });

  // ==========================================================================
  // Default Handlers
  // ==========================================================================

  const defaultHandlers: ShortcutHandlers = useMemo(() => ({
    // Graph Navigation
    onToggleExpandCommit: () => {
      // Toggle expand/collapse of selected commit
      if (selectedCommitHash) {
        // This would be implemented by the graph component
        console.log('[Shortcut] Toggle expand commit:', selectedCommitHash);
      }
    },

    onCheckoutOrOpen: () => {
      // Checkout or open the selected commit
      if (selectedCommitHash) {
        postMessage({
          type: 'checkout',
          payload: { ref: selectedCommitHash },
        } as any);
      }
    },

    onFocusSearch: () => {
      // Focus the search input
      const searchInput = document.querySelector<HTMLInputElement>('.toolbar__search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },

    onNavigateUp: () => {
      // Navigate to previous commit in the list
      // This would need commit list data
      console.log('[Shortcut] Navigate up');
    },

    onNavigateDown: () => {
      // Navigate to next commit in the list
      console.log('[Shortcut] Navigate down');
    },

    // Git Operations
    onOpenCommitDialog: () => {
      openModal('commit');
    },

    onPush: () => {
      postMessage({
        type: 'push',
        payload: {},
      } as any);
    },

    onFetch: () => {
      postMessage({
        type: 'fetch',
        payload: {},
      } as any);
    },

    onUndo: () => {
      postMessage({
        type: 'undo',
        payload: {},
      } as any);
    },

    onLinkWorkItem: () => {
      openModal('link-work-item');
    },

    // Rebase Operations
    onRebaseSetPick: () => {
      console.log('[Shortcut] Rebase: Set pick');
    },

    onRebaseSetReword: () => {
      console.log('[Shortcut] Rebase: Set reword');
    },

    onRebaseSetEdit: () => {
      console.log('[Shortcut] Rebase: Set edit');
    },

    onRebaseSetSquash: () => {
      console.log('[Shortcut] Rebase: Set squash');
    },

    onRebaseSetFixup: () => {
      console.log('[Shortcut] Rebase: Set fixup');
    },

    onRebaseSetDrop: () => {
      console.log('[Shortcut] Rebase: Set drop');
    },

    onRebaseMoveUp: () => {
      console.log('[Shortcut] Rebase: Move up');
    },

    onRebaseMoveDown: () => {
      console.log('[Shortcut] Rebase: Move down');
    },

    onRebaseEditMessage: () => {
      console.log('[Shortcut] Rebase: Edit message');
    },

    onRebaseCancel: () => {
      closeModal();
      setCurrentContext('graph');
    },

    onRebaseStart: () => {
      console.log('[Shortcut] Rebase: Start');
    },

    // General
    onShowHelp: () => {
      setIsHelpOpen(true);
    },

    onEscape: () => {
      if (isHelpOpen) {
        setIsHelpOpen(false);
      } else {
        closeModal();
      }
    },

    // Override with custom handlers
    ...customHandlers,
  }), [
    selectedCommitHash,
    openModal,
    closeModal,
    postMessage,
    isHelpOpen,
    customHandlers,
  ]);

  // ==========================================================================
  // Register Default Shortcuts
  // ==========================================================================

  useEffect(() => {
    const defaultShortcuts = createDefaultShortcuts(defaultHandlers);

    defaultShortcuts.forEach(shortcut => {
      shortcuts.register(shortcut);
    });

    // Cleanup: unregister all default shortcuts
    return () => {
      defaultShortcuts.forEach(shortcut => {
        shortcuts.unregister(shortcut.id);
      });
    };
  }, [defaultHandlers, shortcuts]);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const contextValue = useMemo<ShortcutContextValue>(() => ({
    currentContext,
    setContext: setCurrentContext,
    registerShortcut: shortcuts.register,
    unregisterShortcut: shortcuts.unregister,
    enableShortcut: shortcuts.enable,
    disableShortcut: shortcuts.disable,
    getAllShortcuts: shortcuts.getAll,
    getShortcutsByCategory: shortcuts.getByCategory,
    isHelpOpen,
    openHelp: () => setIsHelpOpen(true),
    closeHelp: () => setIsHelpOpen(false),
    toggleHelp: () => setIsHelpOpen(prev => !prev),
    formatShortcut,
    enabled,
    setEnabled,
  }), [
    currentContext,
    shortcuts,
    isHelpOpen,
    enabled,
  ]);

  return (
    <ShortcutContextInstance.Provider value={contextValue}>
      {children}
    </ShortcutContextInstance.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access shortcut context
 */
export function useShortcuts(): ShortcutContextValue {
  const context = useContext(ShortcutContextInstance);

  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }

  return context;
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to register a shortcut within a component
 * Automatically unregisters on unmount
 */
export function useRegisterShortcut(shortcut: ShortcutDefinition): void {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  useEffect(() => {
    registerShortcut(shortcut);

    return () => {
      unregisterShortcut(shortcut.id);
    };
  }, [shortcut, registerShortcut, unregisterShortcut]);
}

/**
 * Hook to set shortcut context for a component
 * Restores previous context on unmount
 */
export function useShortcutContext(context: ShortcutContextType): void {
  const { currentContext, setContext } = useShortcuts();

  useEffect(() => {
    const previousContext = currentContext;
    setContext(context);

    return () => {
      setContext(previousContext);
    };
  }, [context, setContext]);
}

export default ShortcutProvider;
