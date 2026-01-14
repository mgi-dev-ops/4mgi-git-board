/**
 * ConflictFileList - Displays list of conflicted files with status
 * Shows unresolved/resolved status and allows opening files for resolution
 */

import React from "react";
import { Button } from "../common/Button";
import styles from "./ConflictResolutionView.module.css";

/**
 * Conflicted file information
 */
export interface ConflictedFileInfo {
  path: string;
  relativePath: string;
  resolved: boolean;
  hunkCount: number;
  resolvedHunkCount: number;
}

/**
 * Props for ConflictFileList component
 */
export interface ConflictFileListProps {
  files: ConflictedFileInfo[];
  onFileClick?: (file: ConflictedFileInfo) => void;
  onResolveClick?: (file: ConflictedFileInfo) => void;
}

/**
 * Status indicator icons (text-based for compatibility)
 */
const StatusIcon: React.FC<{ resolved: boolean }> = ({ resolved }) => (
  <span
    className={`${styles.fileStatus} ${resolved ? styles.statusResolved : styles.statusUnresolved}`}
    title={resolved ? "Resolved" : "Unresolved conflict"}
  >
    {resolved ? "\u2713" : "\u26A0"}
  </span>
);

/**
 * ConflictFileList component
 * Renders a list of conflicted files with their resolution status
 */
export const ConflictFileList: React.FC<ConflictFileListProps> = ({
  files,
  onFileClick,
  onResolveClick,
}) => {
  if (files.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>\u2713</div>
        <div className={styles.emptyStateText}>No conflicted files</div>
      </div>
    );
  }

  const handleFileClick = (file: ConflictedFileInfo) => {
    if (onFileClick) {
      onFileClick(file);
    }
  };

  const handleResolveClick = (
    e: React.MouseEvent,
    file: ConflictedFileInfo
  ) => {
    e.stopPropagation();
    if (onResolveClick) {
      onResolveClick(file);
    }
  };

  return (
    <div className={styles.fileListSection}>
      <div className={styles.sectionTitle}>CONFLICTED FILES</div>
      <div className={styles.fileList}>
        {files.map((file) => (
          <div
            key={file.path}
            className={`${styles.fileItem} ${onFileClick ? styles.fileItemClickable : ""}`}
            onClick={() => handleFileClick(file)}
            role={onFileClick ? "button" : undefined}
            tabIndex={onFileClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onFileClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleFileClick(file);
              }
            }}
          >
            <StatusIcon resolved={file.resolved} />

            <span className={styles.filePath} title={file.path}>
              {file.relativePath}
            </span>

            <div className={styles.fileAction}>
              {file.resolved ? (
                <span className={styles.resolvedLabel}>Resolved</span>
              ) : (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={(e) => handleResolveClick(e, file)}
                >
                  Resolve
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConflictFileList;
