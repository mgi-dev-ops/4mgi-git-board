import React from "react";
import styles from "./WorkItemPanel.module.css";
import { WorkItemType, WorkItemBadge } from "./WorkItemBadge";
import Button from "../common/Button";

export type WorkItemState = "new" | "active" | "resolved" | "closed" | "removed";

export interface WorkItemPanelProps {
  /** Work Item ID */
  id: number;
  /** Work Item type */
  type: WorkItemType;
  /** Work Item title */
  title: string;
  /** Work Item state */
  state: WorkItemState;
  /** Assigned user */
  assignedTo?: {
    displayName: string;
    imageUrl?: string;
  };
  /** Number of linked commits */
  linkedCommitsCount: number;
  /** Description (optional) */
  description?: string;
  /** Tags */
  tags?: string[];
  /** Handler for open in Azure DevOps */
  onOpenInAzure?: () => void;
  /** Handler for close panel */
  onClose?: () => void;
  /** Handler for view linked commits */
  onViewLinkedCommits?: () => void;
  /** Optional className */
  className?: string;
}

const stateConfig: Record<WorkItemState, { label: string; className: string }> = {
  new: { label: "New", className: "stateNew" },
  active: { label: "Active", className: "stateActive" },
  resolved: { label: "Resolved", className: "stateResolved" },
  closed: { label: "Closed", className: "stateClosed" },
  removed: { label: "Removed", className: "stateRemoved" },
};

const typeLabels: Record<WorkItemType, string> = {
  bug: "Bug",
  task: "Task",
  userStory: "User Story",
  feature: "Feature",
  epic: "Epic",
  issue: "Issue",
  testCase: "Test Case",
};

export const WorkItemPanel: React.FC<WorkItemPanelProps> = ({
  id,
  type,
  title,
  state,
  assignedTo,
  linkedCommitsCount,
  description,
  tags = [],
  onOpenInAzure,
  onClose,
  onViewLinkedCommits,
  className = "",
}) => {
  const stateInfo = stateConfig[state];
  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  return (
    <div className={panelClasses} role="region" aria-label={`Work Item #${id} details`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <WorkItemBadge id={id} type={type} />
          {onClose && (
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close panel"
              title="Close"
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          )}
        </div>
        <h2 className={styles.title}>{title}</h2>
      </div>

      {/* Type & State */}
      <div className={styles.section}>
        <div className={styles.row}>
          <span className={styles.label}>Type</span>
          <span className={styles.value}>{typeLabels[type]}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>State</span>
          <span className={`${styles.state} ${styles[stateInfo.className]}`}>
            {stateInfo.label}
          </span>
        </div>
      </div>

      {/* Assigned To */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Assigned To</h3>
        {assignedTo ? (
          <div className={styles.assignedRow}>
            {assignedTo.imageUrl ? (
              <img src={assignedTo.imageUrl} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {assignedTo.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.assignedName}>{assignedTo.displayName}</span>
          </div>
        ) : (
          <span className={styles.unassigned}>Unassigned</span>
        )}
      </div>

      {/* Linked Commits */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Linked Commits</h3>
        <div className={styles.linkedCommits}>
          <span className={styles.commitCount}>{linkedCommitsCount}</span>
          {linkedCommitsCount > 0 && onViewLinkedCommits && (
            <button
              className={styles.viewCommitsButton}
              onClick={onViewLinkedCommits}
            >
              View in graph
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{description}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tags</h3>
          <div className={styles.tags}>
            {tags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="primary" onClick={onOpenInAzure}>
          Open in Azure DevOps
        </Button>
      </div>
    </div>
  );
};

WorkItemPanel.displayName = "WorkItemPanel";

export default WorkItemPanel;
