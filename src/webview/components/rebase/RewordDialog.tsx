import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { RebaseCommit } from './types';
import styles from './RewordDialog.module.css';

export interface RewordDialogProps {
  /** Commit being reworded */
  commit: RebaseCommit;
  /** Callback when message is saved */
  onSave: (message: string) => void;
  /** Callback when dialog is cancelled */
  onCancel: () => void;
}

/**
 * RewordDialog - Dialog for editing commit message
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Reword Dialog
 */
export function RewordDialog({
  commit,
  onSave,
  onCancel,
}: RewordDialogProps): React.ReactElement {
  const [message, setMessage] = useState(commit.message);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Select all text
      textareaRef.current.select();
    }
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Ctrl+Enter to save
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [message, onCancel]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Handle textarea change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSave(trimmedMessage);
    }
  }, [message, onSave]);

  // Calculate character count for first line
  const firstLineLength = message.split('\n')[0]?.length || 0;
  const isFirstLineTooLong = firstLineLength > 50;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} ref={dialogRef} role="dialog" aria-modal="true">
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.title}>EDIT COMMIT MESSAGE</h2>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            title="Close (Escape)"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </header>

        {/* Commit info */}
        <div className={styles.commitInfo}>
          <div className={styles.commitSha}>
            Commit: <code>{commit.shortSha}</code>
          </div>
          <div className={styles.originalMessage}>
            Original message: <span>{commit.message}</span>
          </div>
        </div>

        {/* Message editor */}
        <div className={styles.editorContainer}>
          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={message}
            onChange={handleChange}
            placeholder="Enter commit message..."
            spellCheck
            rows={10}
          />
          <div
            className={`${styles.charCount} ${isFirstLineTooLong ? styles.charCountWarning : ''}`}
          >
            First line: {firstLineLength}/50 characters
          </div>
        </div>

        {/* Help text */}
        <div className={styles.helpText}>
          <span className={styles.helpIcon}>&#x1F4A1;</span>
          First line = subject (50 chars), body after blank line
        </div>

        {/* Actions */}
        <footer className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!message.trim()}
            title="Save & Next (Ctrl+Enter)"
            type="button"
          >
            Save &amp; Next
          </button>
        </footer>
      </div>
    </div>
  );
}

export default RewordDialog;
