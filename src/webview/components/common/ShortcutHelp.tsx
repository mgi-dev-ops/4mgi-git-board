/**
 * ShortcutHelp Component
 * Modal displaying all keyboard shortcuts grouped by category
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { useShortcuts } from '../../contexts/ShortcutContext';
import { formatShortcut, type ShortcutCategory, type ShortcutDefinition } from '../../hooks/useKeyboardShortcuts';
import styles from './ShortcutHelp.module.css';

// =============================================================================
// Types
// =============================================================================

interface ShortcutHelpProps {
  /** Custom class name */
  className?: string;
}

interface CategoryConfig {
  id: ShortcutCategory;
  title: string;
  description: string;
}

// =============================================================================
// Category Configuration
// =============================================================================

const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    id: 'navigation',
    title: 'Graph Navigation',
    description: 'Navigate through commits and the graph',
  },
  {
    id: 'git-operations',
    title: 'Git Operations',
    description: 'Common git commands',
  },
  {
    id: 'rebase',
    title: 'Interactive Rebase',
    description: 'Actions available in rebase mode',
  },
  {
    id: 'general',
    title: 'General',
    description: 'General shortcuts',
  },
];

// =============================================================================
// Shortcut Item Component
// =============================================================================

interface ShortcutItemProps {
  shortcut: ShortcutDefinition;
}

function ShortcutItem({ shortcut }: ShortcutItemProps): JSX.Element {
  const keyDisplay = formatShortcut(shortcut);

  return (
    <div className={styles.shortcutItem}>
      <kbd className={styles.key}>{keyDisplay}</kbd>
      <span className={styles.description}>{shortcut.description}</span>
      {shortcut.context && (
        <span className={styles.context}>({shortcut.context})</span>
      )}
    </div>
  );
}

// =============================================================================
// Category Section Component
// =============================================================================

interface CategorySectionProps {
  config: CategoryConfig;
  shortcuts: ShortcutDefinition[];
}

function CategorySection({ config, shortcuts }: CategorySectionProps): JSX.Element | null {
  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <section className={styles.category}>
      <h3 className={styles.categoryTitle}>{config.title}</h3>
      <p className={styles.categoryDescription}>{config.description}</p>
      <div className={styles.shortcutList}>
        {shortcuts.map((shortcut) => (
          <ShortcutItem key={shortcut.id} shortcut={shortcut} />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// ShortcutHelp Component
// =============================================================================

export function ShortcutHelp({ className = '' }: ShortcutHelpProps): JSX.Element | null {
  const { isHelpOpen, closeHelp, getAllShortcuts, getShortcutsByCategory } = useShortcuts();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Group shortcuts by category
  const shortcutsByCategory = useMemo(() => {
    const grouped: Record<ShortcutCategory, ShortcutDefinition[]> = {
      navigation: [],
      'git-operations': [],
      rebase: [],
      general: [],
    };

    CATEGORY_CONFIG.forEach((config) => {
      grouped[config.id] = getShortcutsByCategory(config.id);
    });

    return grouped;
  }, [getShortcutsByCategory]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isHelpOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isHelpOpen, closeHelp]);

  // Focus trap and restoration
  useEffect(() => {
    if (isHelpOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Restore focus when closing
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }
  }, [isHelpOpen]);

  // Handle click outside to close
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeHelp();
    }
  };

  if (!isHelpOpen) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${className}`}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id="shortcut-help-title" className={styles.title}>
            Keyboard Shortcuts
          </h2>
          <button
            className={styles.closeButton}
            onClick={closeHelp}
            aria-label="Close shortcuts help"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className={styles.content}>
          {CATEGORY_CONFIG.map((config) => (
            <CategorySection
              key={config.id}
              config={config}
              shortcuts={shortcutsByCategory[config.id]}
            />
          ))}
        </div>

        <footer className={styles.footer}>
          <p className={styles.hint}>
            Press <kbd>?</kbd> to toggle this help dialog
          </p>
          <p className={styles.hint}>
            Press <kbd>Escape</kbd> to close
          </p>
        </footer>
      </div>
    </div>
  );
}

export default ShortcutHelp;
