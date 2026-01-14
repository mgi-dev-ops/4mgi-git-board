import React, { useState, useCallback } from "react";
import type { GitStash, GitFileChange } from "../../stores/gitStore";
import styles from "./StashPanel.module.css";

// ============================================================================
// Icons
// ============================================================================

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06l-3.25-3.25a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

export interface StashDiffViewProps {
  stash: GitStash;
  files: StashFileChange[];
  selectedFile?: StashFileChange | null;
  diffContent?: string;
  loading?: boolean;
  onClose: () => void;
  onSelectFile?: (file: StashFileChange) => void;
  onBack?: () => void;
}

export interface StashFileChange extends GitFileChange {
  additions: number;
  deletions: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const STATUS_ICONS: Record<string, string> = {
  added: "+",
  modified: "~",
  deleted: "-",
  renamed: "R",
  copied: "C",
};

function getStatusClassName(status: string): string {
  switch (status) {
    case "added":
      return styles.diffFileStatusAdded;
    case "modified":
      return styles.diffFileStatusModified;
    case "deleted":
      return styles.diffFileStatusDeleted;
    default:
      return styles.diffFileStatusModified;
  }
}

function parseDiffContent(content: string): DiffLine[] {
  if (!content) return [];

  const lines = content.split("\n");
  return lines.map((line, index) => {
    let type: DiffLineType = "context";

    if (line.startsWith("+") && !line.startsWith("+++")) {
      type = "added";
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      type = "removed";
    } else if (line.startsWith("@@")) {
      type = "header";
    }

    return {
      lineNumber: index + 1,
      content: line,
      type,
    };
  });
}

type DiffLineType = "added" | "removed" | "context" | "header";

interface DiffLine {
  lineNumber: number;
  content: string;
  type: DiffLineType;
}

// ============================================================================
// Sub-components
// ============================================================================

interface DiffFileListProps {
  files: StashFileChange[];
  selectedFile?: StashFileChange | null;
  onSelectFile?: (file: StashFileChange) => void;
}

function DiffFileList({ files, selectedFile, onSelectFile }: DiffFileListProps) {
  const handleFileClick = useCallback(
    (file: StashFileChange) => {
      onSelectFile?.(file);
    },
    [onSelectFile]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, file: StashFileChange) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelectFile?.(file);
      }
    },
    [onSelectFile]
  );

  if (files.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>No Files</div>
        <p className={styles.emptyDescription}>This stash contains no file changes.</p>
      </div>
    );
  }

  return (
    <div className={styles.diffFileList} role="listbox" aria-label="Changed files">
      {files.map((file) => (
        <div
          key={file.path}
          className={styles.diffFileItem}
          onClick={() => handleFileClick(file)}
          onKeyDown={(e) => handleKeyDown(e, file)}
          tabIndex={0}
          role="option"
          aria-selected={selectedFile?.path === file.path}
        >
          <span className={`${styles.diffFileStatus} ${getStatusClassName(file.status)}`}>
            {STATUS_ICONS[file.status] || "?"}
          </span>
          <span className={styles.diffFilePath} title={file.path}>
            {file.path}
          </span>
          <div className={styles.diffFileStats}>
            {file.additions > 0 && (
              <span className={styles.diffAdditions}>+{file.additions}</span>
            )}
            {file.deletions > 0 && (
              <span className={styles.diffDeletions}>-{file.deletions}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DiffViewerProps {
  content: string;
}

function DiffViewer({ content }: DiffViewerProps) {
  const lines = parseDiffContent(content);

  if (lines.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>No Diff Available</div>
        <p className={styles.emptyDescription}>
          Select a file to view its changes.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.diffViewer}>
      {lines.map((line) => {
        let lineClass = styles.diffLineContext;
        if (line.type === "added") {
          lineClass = styles.diffLineAdded;
        } else if (line.type === "removed") {
          lineClass = styles.diffLineRemoved;
        }

        return (
          <div key={line.lineNumber} className={lineClass}>
            {line.content}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StashDiffView({
  stash,
  files,
  selectedFile,
  diffContent = "",
  loading = false,
  onClose,
  onSelectFile,
  onBack,
}: StashDiffViewProps) {
  const [view, setView] = useState<"files" | "diff">(selectedFile ? "diff" : "files");

  const handleFileSelect = useCallback(
    (file: StashFileChange) => {
      onSelectFile?.(file);
      setView("diff");
    },
    [onSelectFile]
  );

  const handleBackToFiles = useCallback(() => {
    setView("files");
    onBack?.();
  }, [onBack]);

  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0);

  return (
    <div className={styles.diffView}>
      <div className={styles.diffHeader}>
        <div className={styles.diffTitle}>
          {view === "diff" && selectedFile && (
            <button
              className={styles.iconButton}
              onClick={handleBackToFiles}
              title="Back to file list"
              aria-label="Back to file list"
            >
              <ChevronLeftIcon />
            </button>
          )}
          <span className={styles.diffStashIndex}>
            stash@{"{" + stash.index + "}"}
          </span>
          <span>{stash.message || "WIP on " + stash.branch}</span>
        </div>
        <div className={styles.panelActions}>
          {view === "files" && (
            <span className={styles.diffFileStats}>
              <span className={styles.diffAdditions}>+{totalAdditions}</span>
              <span className={styles.diffDeletions}>-{totalDeletions}</span>
              <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>
            </span>
          )}
          <button
            className={styles.iconButton}
            onClick={onClose}
            title="Close"
            aria-label="Close diff view"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className={styles.diffContent}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : view === "files" ? (
          <DiffFileList
            files={files}
            selectedFile={selectedFile}
            onSelectFile={handleFileSelect}
          />
        ) : (
          <>
            {selectedFile && (
              <div className={styles.diffHeader} style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}>
                <span className={`${styles.diffFileStatus} ${getStatusClassName(selectedFile.status)}`}>
                  {STATUS_ICONS[selectedFile.status] || "?"}
                </span>
                <span className={styles.diffFilePath}>{selectedFile.path}</span>
                <span className={styles.diffFileStats}>
                  <span className={styles.diffAdditions}>+{selectedFile.additions}</span>
                  <span className={styles.diffDeletions}>-{selectedFile.deletions}</span>
                </span>
              </div>
            )}
            <DiffViewer content={diffContent} />
          </>
        )}
      </div>
    </div>
  );
}

export default StashDiffView;
