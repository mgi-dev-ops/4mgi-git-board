import React from "react";
import styles from "./PRDetailPanel.module.css";
import { PRStatus, PRBadge } from "./PRBadge";
import { BuildStatusBadge, BuildStatus } from "./BuildStatusBadge";
import { WorkItemBadge, WorkItemType } from "./WorkItemBadge";
import Button from "../common/Button";

export interface Reviewer {
  id: string;
  displayName: string;
  imageUrl?: string;
  vote: "approved" | "approvedWithSuggestions" | "waitingForAuthor" | "rejected" | "noVote";
  isRequired?: boolean;
}

export interface LinkedWorkItem {
  id: number;
  type: WorkItemType;
  title: string;
}

export interface PipelineRun {
  id: number;
  name: string;
  status: BuildStatus;
}

export interface PRDetailPanelProps {
  /** PR number */
  prNumber: number;
  /** PR title */
  title: string;
  /** PR description */
  description?: string;
  /** Source branch */
  sourceBranch: string;
  /** Target branch */
  targetBranch: string;
  /** PR status */
  status: PRStatus;
  /** Author name */
  author: string;
  /** Author avatar URL */
  authorImageUrl?: string;
  /** Created date */
  createdDate: string;
  /** Reviewers list */
  reviewers: Reviewer[];
  /** Linked work items */
  workItems: LinkedWorkItem[];
  /** Pipeline runs */
  pipelineRuns: PipelineRun[];
  /** Whether PR is ready to merge */
  canMerge?: boolean;
  /** Whether all policies are satisfied */
  policiesSatisfied?: boolean;
  /** Handler for merge button click */
  onMerge?: () => void;
  /** Handler for view in ADO */
  onOpenInAzure?: () => void;
  /** Handler for close panel */
  onClose?: () => void;
  /** Handler for work item click */
  onWorkItemClick?: (id: number) => void;
  /** Handler for pipeline click */
  onPipelineClick?: (id: number) => void;
  /** Optional className */
  className?: string;
}

const voteConfig: Record<Reviewer["vote"], { icon: string; label: string; className: string }> = {
  approved: { icon: "check", label: "Approved", className: "voteApproved" },
  approvedWithSuggestions: { icon: "check-suggestions", label: "Approved with suggestions", className: "voteApprovedWithSuggestions" },
  waitingForAuthor: { icon: "waiting", label: "Waiting for author", className: "voteWaiting" },
  rejected: { icon: "rejected", label: "Rejected", className: "voteRejected" },
  noVote: { icon: "no-vote", label: "No vote yet", className: "voteNone" },
};

export const PRDetailPanel: React.FC<PRDetailPanelProps> = ({
  prNumber,
  title,
  description,
  sourceBranch,
  targetBranch,
  status,
  author,
  authorImageUrl,
  createdDate,
  reviewers,
  workItems,
  pipelineRuns,
  canMerge = false,
  policiesSatisfied = false,
  onMerge,
  onOpenInAzure,
  onClose,
  onWorkItemClick,
  onPipelineClick,
  className = "",
}) => {
  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  const renderVoteIcon = (vote: Reviewer["vote"]) => {
    switch (vote) {
      case "approved":
        return (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
          </svg>
        );
      case "approvedWithSuggestions":
        return (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm6.5-.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
          </svg>
        );
      case "waitingForAuthor":
        return (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
          </svg>
        );
      case "rejected":
        return (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
        );
    }
  };

  return (
    <div className={panelClasses} role="region" aria-label={`Pull Request #${prNumber} details`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <PRBadge prNumber={prNumber} status={status} compact />
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

      {/* Branch info */}
      <div className={styles.section}>
        <div className={styles.branchFlow}>
          <span className={styles.branchName}>{sourceBranch}</span>
          <span className={styles.arrow} aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </span>
          <span className={styles.branchName}>{targetBranch}</span>
        </div>
      </div>

      {/* Author & Date */}
      <div className={styles.section}>
        <div className={styles.authorRow}>
          {authorImageUrl ? (
            <img src={authorImageUrl} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {author.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{author}</span>
            <span className={styles.date}>{createdDate}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{description}</p>
        </div>
      )}

      {/* Reviewers */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Reviewers
          <span className={styles.count}>({reviewers.length})</span>
        </h3>
        <ul className={styles.reviewerList}>
          {reviewers.map((reviewer) => {
            const voteInfo = voteConfig[reviewer.vote];
            return (
              <li key={reviewer.id} className={styles.reviewerItem}>
                {reviewer.imageUrl ? (
                  <img src={reviewer.imageUrl} alt="" className={styles.reviewerAvatar} />
                ) : (
                  <div className={styles.reviewerAvatarPlaceholder}>
                    {reviewer.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.reviewerName}>
                  {reviewer.displayName}
                  {reviewer.isRequired && (
                    <span className={styles.required} title="Required reviewer">*</span>
                  )}
                </span>
                <span
                  className={`${styles.voteIcon} ${styles[voteInfo.className]}`}
                  title={voteInfo.label}
                >
                  {renderVoteIcon(reviewer.vote)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Linked Work Items */}
      {workItems.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Linked Work Items
            <span className={styles.count}>({workItems.length})</span>
          </h3>
          <ul className={styles.workItemList}>
            {workItems.map((item) => (
              <li key={item.id} className={styles.workItemRow}>
                <WorkItemBadge
                  id={item.id}
                  type={item.type}
                  onClick={() => onWorkItemClick?.(item.id)}
                />
                <span className={styles.workItemTitle}>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pipeline Status */}
      {pipelineRuns.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Pipeline Runs
            <span className={styles.count}>({pipelineRuns.length})</span>
          </h3>
          <ul className={styles.pipelineList}>
            {pipelineRuns.map((run) => (
              <li
                key={run.id}
                className={styles.pipelineRow}
                onClick={() => onPipelineClick?.(run.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPipelineClick?.(run.id);
                  }
                }}
              >
                <BuildStatusBadge status={run.status} compact />
                <span className={styles.pipelineName}>{run.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {canMerge && policiesSatisfied && (
          <Button variant="primary" onClick={onMerge}>
            Complete Merge
          </Button>
        )}
        {canMerge && !policiesSatisfied && (
          <Button variant="secondary" onClick={onMerge} disabled>
            Complete Merge (Policies not satisfied)
          </Button>
        )}
        <Button variant="secondary" onClick={onOpenInAzure}>
          Open in Azure DevOps
        </Button>
      </div>
    </div>
  );
};

PRDetailPanel.displayName = "PRDetailPanel";

export default PRDetailPanel;
