import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { RebaseAction } from './types';
import { ACTION_LABELS, ACTION_TOOLTIPS } from './types';
import styles from './ActionDropdown.module.css';

export interface ActionDropdownProps {
  /** Current selected action */
  value: RebaseAction;
  /** Callback when action changes */
  onChange: (action: RebaseAction) => void;
  /** Whether to use simplified labels */
  simplifiedLabels: boolean;
  /** Whether dropdown is disabled */
  disabled?: boolean;
}

/** Action option definition */
interface ActionOption {
  value: RebaseAction;
  label: string;
  icon: string;
  shortcut: string;
  tooltip: {
    title: string;
    description: string;
  };
  group?: string;
}

/**
 * ActionDropdown - Dropdown for selecting rebase action
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Action Dropdown UI
 *
 * Supports two modes:
 * - Standard: pick, reword, edit, squash, fixup, drop
 * - Simplified: Keep, Edit Message, Edit Code, Merge (keep), Merge (discard), Delete
 */
export function ActionDropdown({
  value,
  onChange,
  simplifiedLabels,
  disabled = false,
}: ActionDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<RebaseAction | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Build options based on label mode
  const getOptions = useCallback((): ActionOption[] => {
    const actions: RebaseAction[] = ['pick', 'reword', 'edit', 'squash', 'fixup', 'drop'];

    if (simplifiedLabels) {
      // Grouped simplified labels
      return [
        {
          value: 'pick',
          label: ACTION_LABELS.pick.simplified,
          icon: ACTION_LABELS.pick.icon,
          shortcut: ACTION_LABELS.pick.shortcut,
          tooltip: ACTION_TOOLTIPS.pick,
          group: 'KEEP / REMOVE',
        },
        {
          value: 'drop',
          label: ACTION_LABELS.drop.simplified,
          icon: ACTION_LABELS.drop.icon,
          shortcut: ACTION_LABELS.drop.shortcut,
          tooltip: ACTION_TOOLTIPS.drop,
          group: 'KEEP / REMOVE',
        },
        {
          value: 'reword',
          label: ACTION_LABELS.reword.simplified,
          icon: ACTION_LABELS.reword.icon,
          shortcut: ACTION_LABELS.reword.shortcut,
          tooltip: ACTION_TOOLTIPS.reword,
          group: 'EDIT',
        },
        {
          value: 'edit',
          label: `${ACTION_LABELS.edit.simplified} (will pause)`,
          icon: ACTION_LABELS.edit.icon,
          shortcut: ACTION_LABELS.edit.shortcut,
          tooltip: ACTION_TOOLTIPS.edit,
          group: 'EDIT',
        },
        {
          value: 'squash',
          label: 'Merge (keep both messages)',
          icon: ACTION_LABELS.squash.icon,
          shortcut: ACTION_LABELS.squash.shortcut,
          tooltip: ACTION_TOOLTIPS.squash,
          group: 'MERGE WITH PREVIOUS COMMIT',
        },
        {
          value: 'fixup',
          label: 'Merge (discard this message)',
          icon: ACTION_LABELS.fixup.icon,
          shortcut: ACTION_LABELS.fixup.shortcut,
          tooltip: ACTION_TOOLTIPS.fixup,
          group: 'MERGE WITH PREVIOUS COMMIT',
        },
      ];
    }

    // Standard mode - flat list
    return actions.map((action) => ({
      value: action,
      label: ACTION_LABELS[action].standard,
      icon: ACTION_LABELS[action].icon,
      shortcut: ACTION_LABELS[action].shortcut,
      tooltip: ACTION_TOOLTIPS[action],
    }));
  }, [simplifiedLabels]);

  const options = getOptions();

  // Get current label
  const getCurrentLabel = (): string => {
    return simplifiedLabels
      ? ACTION_LABELS[value].simplified
      : ACTION_LABELS[value].standard;
  };

  // Get current icon
  const getCurrentIcon = (): string => {
    return ACTION_LABELS[value].icon;
  };

  // Handle toggle
  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  // Handle option select
  const handleSelect = useCallback(
    (action: RebaseAction) => {
      onChange(action);
      setIsOpen(false);
      setHoveredAction(null);
    },
    [onChange]
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredAction(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      const currentIndex = options.findIndex((opt) => opt.value === value);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < options.length - 1) {
            onChange(options[currentIndex + 1].value);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            onChange(options[currentIndex - 1].value);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [isOpen, options, value, onChange]
  );

  // Group options by group (for simplified mode)
  const groupedOptions = simplifiedLabels
    ? options.reduce(
        (acc, option) => {
          const group = option.group || 'Other';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(option);
          return acc;
        },
        {} as Record<string, ActionOption[]>
      )
    : null;

  // Render option
  const renderOption = (option: ActionOption) => (
    <button
      key={option.value}
      className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        handleSelect(option.value);
      }}
      onMouseEnter={() => setHoveredAction(option.value)}
      onMouseLeave={() => setHoveredAction(null)}
      type="button"
      role="option"
      aria-selected={option.value === value}
    >
      <span className={styles.optionIcon}>{option.icon}</span>
      <span className={styles.optionLabel}>{option.label}</span>
    </button>
  );

  // Get hovered tooltip
  const hoveredTooltip = hoveredAction ? ACTION_TOOLTIPS[hoveredAction] : null;

  return (
    <div
      className={`${styles.container} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
      ref={dropdownRef}
    >
      {/* Toggle button */}
      <button
        className={styles.toggle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.toggleIcon}>{getCurrentIcon()}</span>
        <span className={styles.toggleLabel}>{getCurrentLabel()}</span>
        <span className={styles.toggleArrow}>&#x25BC;</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={styles.menu} role="listbox">
          {simplifiedLabels && groupedOptions ? (
            // Grouped mode (simplified labels)
            Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName} className={styles.group}>
                <div className={styles.groupHeader}>{groupName}</div>
                {groupOptions.map(renderOption)}
              </div>
            ))
          ) : (
            // Flat mode (standard labels)
            options.map(renderOption)
          )}
        </div>
      )}

      {/* Tooltip (on hover) */}
      {isOpen && hoveredTooltip && (
        <div className={styles.tooltip} ref={tooltipRef}>
          <div className={styles.tooltipTitle}>{hoveredTooltip.title}</div>
          <div className={styles.tooltipDivider} />
          <div className={styles.tooltipDescription}>{hoveredTooltip.description}</div>
          {hoveredAction && (
            <>
              <div className={styles.tooltipShortcut}>
                <span className={styles.tooltipShortcutIcon}>&#x2328;&#xFE0F;</span>
                Shortcut: {ACTION_LABELS[hoveredAction].shortcut}
              </div>
              <div className={styles.tooltipGit}>
                <span className={styles.tooltipGitIcon}>&#x1F4D6;</span>
                Git equivalent: {ACTION_LABELS[hoveredAction].standard}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ActionDropdown;
