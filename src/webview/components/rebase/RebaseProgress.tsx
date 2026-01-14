import React from 'react';
import type { CommitStatus } from './types';
import styles from './RebaseProgress.module.css';

export interface RebaseProgressProps {
  /** Current commit index (1-based) */
  current: number;
  /** Total commits to process */
  total: number;
  /** List of commits with their status */
  commits: Array<{
    sha: string;
    message: string;
    status: CommitStatus;
  }>;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

/**
 * RebaseProgress - Progress indicator during rebase execution
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Progress Indicator
 *
 * Status symbols:
 * - completed
 * - in_progress
 * - pending
 * - dropped/skipped
 * - conflict
 */
export function RebaseProgress({
  current,
  total,
  commits,
  onClose,
}: RebaseProgressProps): React.ReactElement {
  // Calculate progress percentage
  const progressPercent = total > 0 ? (current / total) * 100 : 0;

  // Get status icon
  const getStatusIcon = (status: CommitStatus): string => {
    switch (status) {
      case 'completed':
        return '\u2713'; // checkmark
      case 'in_progress':
        return '\u25CF'; // filled circle
      case 'pending':
        return '\u25CB'; // empty circle
      case 'dropped':
      case 'skipped':
        return '\u2715'; // x mark
      case 'conflict':
        return '\u26A0\uFE0F'; // warning
      default:
        return '\u25CB';
    }
  };

  // Get status label
  const getStatusLabel = (status: CommitStatus): string => {
    switch (status) {
      case 'completed':
        return '';
      case 'in_progress':
        return 'APPLYING';
      case 'pending':
        return '';
      case 'dropped':
        return 'DROPPED';
      case 'skipped':
        return 'SKIPPED';
      case 'conflict':
        return 'CONFLICT';
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>REBASE IN PROGRESS</h2>
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        )}
      </header>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={styles.progressLabel}>
          {current}/{total} commits
        </div>
      </div>

      {/* Commit list */}
      <div className={styles.commitList}>
        {commits.map((commit, index) => (
          <div
            key={`${commit.sha}-${index}`}
            className={`${styles.commitItem} ${styles[`status-${commit.status}`]}`}
          >
            <span className={styles.statusIcon}>{getStatusIcon(commit.status)}</span>
            <span className={styles.sha}>{commit.sha}</span>
            <span className={styles.message}>{commit.message}</span>
            {getStatusLabel(commit.status) && (
              <span className={styles.statusLabel}>{getStatusLabel(commit.status)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RebaseProgress;
