import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./StashPanel.module.css";

// ============================================================================
// Icons
// ============================================================================

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

export interface CreateStashDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStash: (options: CreateStashOptions) => void;
  loading?: boolean;
}

export interface CreateStashOptions {
  message?: string;
  includeUntracked: boolean;
  keepStaged: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function CreateStashDialog({
  isOpen,
  onClose,
  onCreateStash,
  loading = false,
}: CreateStashDialogProps) {
  const [message, setMessage] = useState("");
  const [includeUntracked, setIncludeUntracked] = useState(false);
  const [keepStaged, setKeepStaged] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onCreateStash({
        message: message.trim() || undefined,
        includeUntracked,
        keepStaged,
      });
    },
    [message, includeUntracked, keepStaged, onCreateStash]
  );

  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(event.target.value);
    },
    []
  );

  const handleIncludeUntrackedChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIncludeUntracked(event.target.checked);
    },
    []
  );

  const handleKeepStagedChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setKeepStaged(event.target.checked);
    },
    []
  );

  const resetForm = useCallback(() => {
    setMessage("");
    setIncludeUntracked(false);
    setKeepStaged(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.dialogOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-stash-title"
    >
      <div className={styles.dialog} ref={dialogRef}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle} id="create-stash-title">
            Create Stash
          </h2>
          <button
            className={styles.dialogCloseButton}
            onClick={handleClose}
            title="Close"
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.dialogContent}>
            <div className={styles.formGroup}>
              <label htmlFor="stash-message" className={styles.formLabel}>
                Message (optional)
              </label>
              <input
                ref={inputRef}
                id="stash-message"
                type="text"
                className={styles.formInput}
                placeholder="Enter a description for this stash..."
                value={message}
                onChange={handleMessageChange}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  id="include-untracked"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={includeUntracked}
                  onChange={handleIncludeUntrackedChange}
                  disabled={loading}
                />
                <label
                  htmlFor="include-untracked"
                  className={styles.checkboxLabel}
                >
                  Include untracked files
                </label>
              </div>

              <div className={styles.checkboxGroup}>
                <input
                  id="keep-staged"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={keepStaged}
                  onChange={handleKeepStagedChange}
                  disabled={loading}
                />
                <label htmlFor="keep-staged" className={styles.checkboxLabel}>
                  Keep staged files (--keep-index)
                </label>
              </div>
            </div>
          </div>

          <div className={styles.dialogFooter}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} style={{ width: 14, height: 14 }} />
                  Creating...
                </>
              ) : (
                "Create Stash"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStashDialog;
