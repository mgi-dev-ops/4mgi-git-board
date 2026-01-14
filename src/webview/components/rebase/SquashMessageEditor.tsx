import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { RebaseCommit } from './types';
import styles from './SquashMessageEditor.module.css';

export interface SquashMessageEditorProps {
  /** Commits being squashed (first is target, rest are being squashed into it) */
  commits: RebaseCommit[];
  /** Callback when message is saved and rebase should continue */
  onSave: (message: string) => void;
  /** Callback when rebase should be aborted */
  onAbort: () => void;
}

/**
 * SquashMessageEditor - Editor for combined commit message when squashing
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Squash Commit Message Editor
 *
 * Lines starting with # are ignored (like git)
 */
export function SquashMessageEditor({
  commits,
  onSave,
  onAbort,
}: SquashMessageEditorProps): React.ReactElement {
  // Generate initial combined message
  const initialMessage = useMemo(() => {
    const lines: string[] = [];

    // First commit's message
    lines.push(commits[0]?.message || '');
    lines.push('');
    lines.push('# This is a combination of ' + commits.length + ' commits.');

    commits.forEach((commit, index) => {
      lines.push(`# This is the ${getOrdinal(index + 1)} commit message:`);
      lines.push('');
      lines.push(commit.message);
      lines.push('');
    });

    return lines.join('\n');
  }, [commits]);

  const [message, setMessage] = useState(initialMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onAbort();
      }
      // Ctrl+Enter to save
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [message, onAbort]);

  // Handle textarea change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  // Handle save - filter out comment lines
  const handleSave = useCallback(() => {
    // Filter out lines starting with #
    const filteredLines = message
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n')
      .trim();

    if (filteredLines) {
      onSave(filteredLines);
    }
  }, [message, onSave]);

  // Get preview message (without comment lines)
  const previewMessage = useMemo(() => {
    return message
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n')
      .trim();
  }, [message]);

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true">
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.title}>SQUASH COMMIT MESSAGE</h2>
          <button
            className={styles.closeButton}
            onClick={onAbort}
            title="Close (Escape)"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </header>

        {/* Info */}
        <div className={styles.info}>
          Combining {commits.length} commits:
        </div>

        {/* Commit list */}
        <div className={styles.commitList}>
          {commits.map((commit, index) => (
            <div key={commit.sha} className={styles.commitItem}>
              <span className={styles.commitIndex}>{index + 1}.</span>
              <span className={styles.commitSha}>{commit.shortSha}</span>
              <span className={styles.commitMessage}>{commit.message}</span>
            </div>
          ))}
        </div>

        {/* Message editor */}
        <div className={styles.editorContainer}>
          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={message}
            onChange={handleChange}
            placeholder="Enter combined commit message..."
            spellCheck
            rows={15}
          />
        </div>

        {/* Help text */}
        <div className={styles.helpText}>
          Lines starting with <code>#</code> will be ignored.
        </div>

        {/* Preview (optional - shows what will be saved) */}
        {previewMessage && (
          <details className={styles.preview}>
            <summary className={styles.previewSummary}>Preview final message</summary>
            <pre className={styles.previewContent}>{previewMessage}</pre>
          </details>
        )}

        {/* Actions */}
        <footer className={styles.footer}>
          <button
            className={styles.abortButton}
            onClick={onAbort}
            type="button"
          >
            Abort Rebase
          </button>
          <button
            className={styles.continueButton}
            onClick={handleSave}
            disabled={!previewMessage}
            title="Continue Rebase (Ctrl+Enter)"
            type="button"
          >
            Continue Rebase
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default SquashMessageEditor;
