import React from 'react';
import styles from './GitHubPRBadge.module.css';
import type {
  GitHubPullRequest,
  GitHubPullRequestState,
  GitHubReviewer,
} from '../../../types/github';

export interface GitHubPRBadgeProps {
  /** Pull request data */
  pr: GitHubPullRequest;
  /** Compact mode - shows only icon and number */
  compact?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Get status color class based on PR state
 */
function getStatusClass(pr: GitHubPullRequest): string {
  if (pr.merged) {
    return styles.merged;
  }
  if (pr.state === 'closed') {
    return styles.closed;
  }
  if (pr.draft) {
    return styles.draft;
  }
  return styles.open;
}

/**
 * Get status label text
 */
function getStatusLabel(pr: GitHubPullRequest): string {
  if (pr.merged) {
    return 'Merged';
  }
  if (pr.state === 'closed') {
    return 'Closed';
  }
  if (pr.draft) {
    return 'Draft';
  }
  return 'Open';
}

/**
 * Get review status summary
 */
function getReviewSummary(reviewers: GitHubReviewer[]): {
  approved: number;
  changesRequested: number;
  pending: number;
} {
  return reviewers.reduce(
    (acc, reviewer) => {
      switch (reviewer.state) {
        case 'APPROVED':
          acc.approved++;
          break;
        case 'CHANGES_REQUESTED':
          acc.changesRequested++;
          break;
        case 'PENDING':
        case 'COMMENTED':
          acc.pending++;
          break;
      }
      return acc;
    },
    { approved: 0, changesRequested: 0, pending: 0 }
  );
}

/**
 * PR Icon component
 */
const PRIcon: React.FC<{ state: GitHubPullRequestState; merged: boolean; draft: boolean }> = ({
  state,
  merged,
  draft,
}) => {
  if (merged) {
    // Merged icon
    return (
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
      </svg>
    );
  }

  if (state === 'closed') {
    // Closed icon
    return (
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734l-.97.97.97.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
      </svg>
    );
  }

  if (draft) {
    // Draft icon
    return (
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Zm-2.25-2.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
      </svg>
    );
  }

  // Open icon
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  );
};

/**
 * Checkmark icon for approved reviews
 */
const CheckIcon: React.FC = () => (
  <svg
    className={styles.reviewIcon}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

/**
 * X icon for changes requested
 */
const XIcon: React.FC = () => (
  <svg
    className={styles.reviewIcon}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
  </svg>
);

/**
 * GitHub Pull Request Badge Component
 * Displays PR status with icon, number, and optional review status
 */
export const GitHubPRBadge: React.FC<GitHubPRBadgeProps> = ({
  pr,
  compact = false,
  onClick,
  className = '',
}) => {
  const statusClass = getStatusClass(pr);
  const statusLabel = getStatusLabel(pr);
  const reviewSummary = getReviewSummary(pr.reviewers);

  const badgeClasses = [
    styles.badge,
    statusClass,
    compact ? styles.compact : '',
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  if (compact) {
    return (
      <span
        className={badgeClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        title={`#${pr.number} - ${pr.title} (${statusLabel})`}
      >
        <PRIcon state={pr.state} merged={pr.merged} draft={pr.draft} />
        <span className={styles.number}>#{pr.number}</span>
      </span>
    );
  }

  return (
    <div
      className={badgeClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <PRIcon state={pr.state} merged={pr.merged} draft={pr.draft} />
        <span className={styles.number}>#{pr.number}</span>
        <span className={styles.status}>{statusLabel}</span>
      </div>

      <div className={styles.title} title={pr.title}>
        {pr.title}
      </div>

      <div className={styles.meta}>
        <span className={styles.author}>
          {pr.createdBy.avatarUrl && (
            <img
              src={pr.createdBy.avatarUrl}
              alt=""
              className={styles.avatar}
            />
          )}
          {pr.createdBy.login}
        </span>

        <span className={styles.branches}>
          {pr.sourceBranch} -&gt; {pr.targetBranch}
        </span>
      </div>

      {pr.reviewers.length > 0 && (
        <div className={styles.reviews}>
          {reviewSummary.approved > 0 && (
            <span className={styles.reviewApproved}>
              <CheckIcon />
              {reviewSummary.approved}
            </span>
          )}
          {reviewSummary.changesRequested > 0 && (
            <span className={styles.reviewChanges}>
              <XIcon />
              {reviewSummary.changesRequested}
            </span>
          )}
        </div>
      )}

      {pr.labels.length > 0 && (
        <div className={styles.labels}>
          {pr.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className={styles.label}
              style={{ backgroundColor: `#${label.color}` }}
              title={label.description ?? label.name}
            >
              {label.name}
            </span>
          ))}
          {pr.labels.length > 3 && (
            <span className={styles.labelMore}>+{pr.labels.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubPRBadge;
