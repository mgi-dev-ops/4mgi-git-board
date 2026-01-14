import React from "react";
import styles from "./PRBadge.module.css";

export type PRStatus = "active" | "approved" | "needsWork" | "completed" | "abandoned";

export interface PRBadgeProps {
  /** PR number */
  prNumber: number;
  /** PR status */
  status: PRStatus;
  /** Click handler to open PR details */
  onClick?: () => void;
  /** Optional additional className */
  className?: string;
  /** Compact mode - shows only icon and number */
  compact?: boolean;
}

const statusConfig: Record<PRStatus, { icon: string; label: string; ariaLabel: string }> = {
  active: {
    icon: "PR",
    label: "Active",
    ariaLabel: "Pull Request active",
  },
  approved: {
    icon: "PR",
    label: "Approved",
    ariaLabel: "Pull Request approved",
  },
  needsWork: {
    icon: "PR",
    label: "Needs Work",
    ariaLabel: "Pull Request needs work",
  },
  completed: {
    icon: "PR",
    label: "Completed",
    ariaLabel: "Pull Request completed",
  },
  abandoned: {
    icon: "PR",
    label: "Abandoned",
    ariaLabel: "Pull Request abandoned",
  },
};

export const PRBadge: React.FC<PRBadgeProps> = ({
  prNumber,
  status,
  onClick,
  className = "",
  compact = false,
}) => {
  const config = statusConfig[status];

  const badgeClasses = [
    styles.badge,
    styles[status],
    compact ? styles.compact : "",
    onClick ? styles.clickable : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
    }
  };

  return (
    <span
      className={badgeClasses}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${config.ariaLabel} #${prNumber}`}
      title={`${config.label} PR #${prNumber}`}
    >
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-1.5V4.372a2.25 2.25 0 1 0-1.5 0V7h-1.5a.75.75 0 0 1-.75-.75v-.878ZM11 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM8 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM8 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </span>
      <span className={styles.number}>#{prNumber}</span>
      {!compact && <span className={styles.statusText}>{config.label}</span>}
    </span>
  );
};

PRBadge.displayName = "PRBadge";

export default PRBadge;
