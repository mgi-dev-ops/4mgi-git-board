import React from 'react';
import type { ConflictFile } from './types';
import styles from './RebaseConflict.module.css';

export interface RebaseConflictProps {
  /** SHA of the conflicting commit */
  commitSha: string;
  /** Message of the conflicting commit */
  commitMessage: string;
  /** List of conflicted files */
  files: ConflictFile[];
  /** Current progress */
  progress: {
    current: number;
    total: number;
  };
  /** Callback to abort rebase */
  onAbort: () => void;
  /** Callback to skip this commit */
  onSkip: () => void;
  /** Callback to continue rebase after resolving */
  onContinue: () => void;
  /** Callback to resolve a specific file */
  onResolveFile: (path: string) => void;
  /** Callback when close button is clicked */
  onClose: () => void;
}

/**
 * RebaseConflict - Conflict resolution view during rebase
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Conflict Resolution View
 */
export function RebaseConflict({
  commitSha,
  commitMessage,
  files,
  progress,
  onAbort,
  onSkip,
  onContinue,
  onResolveFile,
  onClose,
}: RebaseConflictProps): React.ReactElement {
  // Check if all conflicts are resolved
  const allResolved = files.every((file) => file.resolved);

  // Count resolved files
  const resolvedCount = files.filter((file) => file.resolved).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.warningIcon}>&#x26A0;&#xFE0F;</span>
          <h2 className={styles.title}>REBASE CONFLICT</h2>
        </div>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close"
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
      </header>

      {/* Conflict info */}
      <div className={styles.conflictInfo}>
        <div className={styles.commitInfo}>
          Conflict in commit: <code>{commitSha}</code> ({commitMessage})
        </div>
        <div className={styles.progressInfo}>
          Progress: {progress.current}/{progress.total} commits applied
        </div>
      </div>

      {/* Conflicted files section */}
      <section className={styles.filesSection}>
        <div className={styles.sectionHeader}>
          CONFLICTED FILES ({resolvedCount}/{files.length} resolved)
        </div>
        <div className={styles.fileList}>
          {files.map((file) => (
            <div
              key={file.path}
              className={`${styles.fileItem} ${file.resolved ? styles.fileResolved : ''}`}
            >
              <span className={styles.fileIcon}>
                {file.resolved ? '\u2713' : '\u26A0\uFE0F'}
              </span>
              <span className={styles.filePath}>{file.path}</span>
              {file.resolved ? (
                <span className={styles.resolvedLabel}>Resolved</span>
              ) : (
                <button
                  className={styles.resolveButton}
                  onClick={() => onResolveFile(file.path)}
                  type="button"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Help text */}
      <div className={styles.helpText}>
        After resolving all conflicts, stage the changes and continue.
      </div>

      {/* Action buttons */}
      <footer className={styles.footer}>
        <button
          className={styles.abortButton}
          onClick={onAbort}
          title="Abort rebase and restore original state"
          type="button"
        >
          Abort Rebase
        </button>
        <button
          className={styles.skipButton}
          onClick={onSkip}
          title="Skip this commit and continue"
          type="button"
        >
          Skip Commit
        </button>
        <button
          className={styles.continueButton}
          onClick={onContinue}
          disabled={!allResolved}
          title={
            allResolved
              ? 'Continue rebase'
              : 'Resolve all conflicts before continuing'
          }
          type="button"
        >
          Continue Rebase
        </button>
      </footer>
    </div>
  );
}

export default RebaseConflict;
