/**
 * useGraphInteraction Hook
 *
 * Handles user interactions with the Git graph:
 * - Click: Select commit
 * - Double-click: Open diff
 * - Right-click: Context menu
 * - Hover: Tooltip display
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { GraphCommit, CollapsedCommits } from '../components/graph/graphUtils';

// =============================================================================
// Types
// =============================================================================

export interface GraphInteractionOptions {
  /**
   * Callback when a commit is selected
   */
  onSelect?: (hash: string | null) => void;

  /**
   * Callback when a commit is double-clicked (open diff)
   */
  onDoubleClick?: (hash: string) => void;

  /**
   * Callback for context menu
   */
  onContextMenu?: (hash: string, event: React.MouseEvent) => void;

  /**
   * Callback when collapsed commits are clicked (expand)
   */
  onExpandCollapsed?: (startHash: string, endHash: string) => void;

  /**
   * Double-click timeout in milliseconds
   */
  doubleClickTimeout?: number;

  /**
   * Tooltip show delay in milliseconds
   */
  tooltipDelay?: number;
}

export interface TooltipPosition {
  x: number;
  y: number;
}

export interface UseGraphInteractionReturn {
  /**
   * Handle commit click (select)
   */
  handleCommitClick: (commit: GraphCommit | CollapsedCommits) => void;

  /**
   * Handle commit double-click (open diff)
   */
  handleCommitDoubleClick: (commit: GraphCommit | CollapsedCommits) => void;

  /**
   * Handle commit right-click (context menu)
   */
  handleCommitContextMenu: (
    commit: GraphCommit | CollapsedCommits,
    event: React.MouseEvent
  ) => void;

  /**
   * Handle commit hover (tooltip)
   */
  handleCommitHover: (
    commit: GraphCommit | null,
    event: React.MouseEvent | null
  ) => void;

  /**
   * Currently hovered commit (for tooltip)
   */
  hoveredCommit: GraphCommit | null;

  /**
   * Tooltip position
   */
  tooltipPosition: TooltipPosition | null;

  /**
   * Currently selected commit hash
   */
  selectedHash: string | null;

  /**
   * Clear selection
   */
  clearSelection: () => void;

  /**
   * Handle keyboard navigation
   */
  handleKeyDown: (event: React.KeyboardEvent, commits: GraphCommit[]) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useGraphInteraction(
  options: GraphInteractionOptions = {}
): UseGraphInteractionReturn {
  const {
    onSelect,
    onDoubleClick,
    onContextMenu,
    onExpandCollapsed,
    doubleClickTimeout = 300,
    tooltipDelay = 500,
  } = options;

  // State
  const [hoveredCommit, setHoveredCommit] = useState<GraphCommit | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  // Refs for timers
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickHashRef = useRef<string | null>(null);

  // Helper to check if item is collapsed
  const isCollapsed = useCallback(
    (commit: GraphCommit | CollapsedCommits): commit is CollapsedCommits => {
      return 'isCollapsed' in commit && commit.isCollapsed === true;
    },
    []
  );

  // Handle single click (select commit)
  const handleCommitClick = useCallback(
    (commit: GraphCommit | CollapsedCommits) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      // Handle collapsed commits
      if (isCollapsed(commit)) {
        onExpandCollapsed?.(commit.startHash, commit.endHash);
        return;
      }

      const hash = commit.hash;

      // Check for double-click
      if (
        timeSinceLastClick < doubleClickTimeout &&
        lastClickHashRef.current === hash
      ) {
        // This is a double-click, handled by handleCommitDoubleClick
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        return;
      }

      // Record this click
      lastClickTimeRef.current = now;
      lastClickHashRef.current = hash;

      // Delay selection to distinguish from double-click
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      clickTimerRef.current = setTimeout(() => {
        const newSelectedHash = selectedHash === hash ? null : hash;
        setSelectedHash(newSelectedHash);
        onSelect?.(newSelectedHash);
        clickTimerRef.current = null;
      }, doubleClickTimeout);
    },
    [selectedHash, onSelect, onExpandCollapsed, doubleClickTimeout, isCollapsed]
  );

  // Handle double-click (open diff)
  const handleCommitDoubleClick = useCallback(
    (commit: GraphCommit | CollapsedCommits) => {
      // Clear any pending single-click timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }

      // Handle collapsed commits
      if (isCollapsed(commit)) {
        onExpandCollapsed?.(commit.startHash, commit.endHash);
        return;
      }

      const hash = commit.hash;

      // Select the commit
      setSelectedHash(hash);
      onSelect?.(hash);

      // Trigger double-click callback
      onDoubleClick?.(hash);
    },
    [onSelect, onDoubleClick, onExpandCollapsed, isCollapsed]
  );

  // Handle right-click (context menu)
  const handleCommitContextMenu = useCallback(
    (commit: GraphCommit | CollapsedCommits, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Handle collapsed commits - no context menu
      if (isCollapsed(commit)) {
        return;
      }

      const hash = commit.hash;

      // Select the commit
      setSelectedHash(hash);
      onSelect?.(hash);

      // Trigger context menu callback
      onContextMenu?.(hash, event);
    },
    [onSelect, onContextMenu, isCollapsed]
  );

  // Handle hover (tooltip)
  const handleCommitHover = useCallback(
    (commit: GraphCommit | null, event: React.MouseEvent | null) => {
      // Clear any pending tooltip timer
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }

      if (commit && event) {
        // Delay showing tooltip
        tooltipTimerRef.current = setTimeout(() => {
          setHoveredCommit(commit);
          setTooltipPosition({
            x: event.clientX,
            y: event.clientY,
          });
          tooltipTimerRef.current = null;
        }, tooltipDelay);
      } else {
        // Hide tooltip immediately
        setHoveredCommit(null);
        setTooltipPosition(null);
      }
    },
    [tooltipDelay]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedHash(null);
    onSelect?.(null);
  }, [onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, commits: GraphCommit[]) => {
      if (commits.length === 0) return;

      const currentIndex = selectedHash
        ? commits.findIndex((c) => c.hash === selectedHash)
        : -1;

      switch (event.key) {
        case 'ArrowDown':
        case 'j': {
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, commits.length - 1);
          const nextCommit = commits[nextIndex];
          if (nextCommit) {
            setSelectedHash(nextCommit.hash);
            onSelect?.(nextCommit.hash);
          }
          break;
        }

        case 'ArrowUp':
        case 'k': {
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          const prevCommit = commits[prevIndex];
          if (prevCommit) {
            setSelectedHash(prevCommit.hash);
            onSelect?.(prevCommit.hash);
          }
          break;
        }

        case 'Enter': {
          event.preventDefault();
          if (selectedHash) {
            onDoubleClick?.(selectedHash);
          }
          break;
        }

        case 'Escape': {
          event.preventDefault();
          clearSelection();
          break;
        }

        case 'Home': {
          event.preventDefault();
          const firstCommit = commits[0];
          if (firstCommit) {
            setSelectedHash(firstCommit.hash);
            onSelect?.(firstCommit.hash);
          }
          break;
        }

        case 'End': {
          event.preventDefault();
          const lastCommit = commits[commits.length - 1];
          if (lastCommit) {
            setSelectedHash(lastCommit.hash);
            onSelect?.(lastCommit.hash);
          }
          break;
        }

        case 'PageDown': {
          event.preventDefault();
          const pageDownIndex = Math.min(currentIndex + 10, commits.length - 1);
          const pageDownCommit = commits[pageDownIndex];
          if (pageDownCommit) {
            setSelectedHash(pageDownCommit.hash);
            onSelect?.(pageDownCommit.hash);
          }
          break;
        }

        case 'PageUp': {
          event.preventDefault();
          const pageUpIndex = Math.max(currentIndex - 10, 0);
          const pageUpCommit = commits[pageUpIndex];
          if (pageUpCommit) {
            setSelectedHash(pageUpCommit.hash);
            onSelect?.(pageUpCommit.hash);
          }
          break;
        }

        default:
          break;
      }
    },
    [selectedHash, onSelect, onDoubleClick, clearSelection]
  );

  // Cleanup timers on unmount
  useMemo(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  return {
    handleCommitClick,
    handleCommitDoubleClick,
    handleCommitContextMenu,
    handleCommitHover,
    hoveredCommit,
    tooltipPosition,
    selectedHash,
    clearSelection,
    handleKeyDown,
  };
}

// =============================================================================
// Additional Utility Hooks
// =============================================================================

/**
 * Hook for managing context menu state
 */
export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  commitHash: string | null;
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: null,
    commitHash: null,
  });

  const openMenu = useCallback((hash: string, event: React.MouseEvent) => {
    setState({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      commitHash: hash,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setState({
      isOpen: false,
      position: null,
      commitHash: null,
    });
  }, []);

  return {
    ...state,
    openMenu,
    closeMenu,
  };
}

/**
 * Hook for managing tooltip visibility with delay
 */
export function useTooltipDelay(delay = 500) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  return { isVisible, show, hide };
}

export default useGraphInteraction;
