import React from "react";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "feat"
  | "fix"
  | "chore"
  | "refactor"
  | "docs"
  | "style"
  | "test"
  | "perf";

export type BadgeSize = "small" | "medium";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  count?: number;
  maxCount?: number;
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "medium",
  icon,
  count,
  maxCount = 99,
  dot = false,
  className = "",
}: BadgeProps) {
  // Count badge variant
  if (count !== undefined) {
    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

    return (
      <span
        className={`${styles.badge} ${styles.countBadge} ${styles[variant]} ${styles[size]} ${className}`}
      >
        {displayCount}
      </span>
    );
  }

  // Dot badge variant
  if (dot) {
    return (
      <span
        className={`${styles.badge} ${styles.dotBadge} ${styles[variant]} ${className}`}
      />
    );
  }

  // Icon badge variant
  if (icon && !children) {
    return (
      <span
        className={`${styles.badge} ${styles.iconBadge} ${styles[variant]} ${styles[size]} ${className}`}
      >
        {icon}
      </span>
    );
  }

  // Standard badge with optional icon
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}
    >
      {icon && <span className={styles.badgeIcon}>{icon}</span>}
      {children && <span className={styles.badgeText}>{children}</span>}
    </span>
  );
}

// Status Badge - convenience component
export interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "pending";
  label?: string;
  size?: BadgeSize;
  className?: string;
}

const statusIcons: Record<StatusBadgeProps["status"], React.ReactNode> = {
  success: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M10.2803 3.21967C10.5732 3.51256 10.5732 3.98744 10.2803 4.28033L4.78033 9.78033C4.48744 10.0732 4.01256 10.0732 3.71967 9.78033L1.21967 7.28033C0.926777 6.98744 0.926777 6.51256 1.21967 6.21967C1.51256 5.92678 1.98744 5.92678 2.28033 6.21967L4.25 8.18934L9.21967 3.21967C9.51256 2.92678 9.98744 2.92678 10.2803 3.21967Z"
        fill="currentColor"
      />
    </svg>
  ),
  warning: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1C6.41421 1 6.78921 1.22386 6.97553 1.5772L10.8944 9.41497C11.0807 9.76832 11.0474 10.1952 10.8086 10.5148C10.5698 10.8345 10.1659 11 9.75 11H2.25C1.83411 11 1.43019 10.8345 1.19139 10.5148C0.952589 10.1952 0.919259 9.76832 1.10557 9.41497L5.02447 1.5772C5.21079 1.22386 5.58579 1 6 1ZM6 4C5.58579 4 5.25 4.33579 5.25 4.75V6.25C5.25 6.66421 5.58579 7 6 7C6.41421 7 6.75 6.66421 6.75 6.25V4.75C6.75 4.33579 6.41421 4 6 4ZM6 8C5.58579 8 5.25 8.33579 5.25 8.75C5.25 9.16421 5.58579 9.5 6 9.5C6.41421 9.5 6.75 9.16421 6.75 8.75C6.75 8.33579 6.41421 8 6 8Z"
        fill="currentColor"
      />
    </svg>
  ),
  error: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1ZM6 4C5.58579 4 5.25 4.33579 5.25 4.75V6.25C5.25 6.66421 5.58579 7 6 7C6.41421 7 6.75 6.66421 6.75 6.25V4.75C6.75 4.33579 6.41421 4 6 4ZM6 8C5.58579 8 5.25 8.33579 5.25 8.75C5.25 9.16421 5.58579 9.5 6 9.5C6.41421 9.5 6.75 9.16421 6.75 8.75C6.75 8.33579 6.41421 8 6 8Z"
        fill="currentColor"
      />
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1ZM6 4C6.41421 4 6.75 3.66421 6.75 3.25C6.75 2.83579 6.41421 2.5 6 2.5C5.58579 2.5 5.25 2.83579 5.25 3.25C5.25 3.66421 5.58579 4 6 4ZM6 5C5.58579 5 5.25 5.33579 5.25 5.75V8.75C5.25 9.16421 5.58579 9.5 6 9.5C6.41421 9.5 6.75 9.16421 6.75 8.75V5.75C6.75 5.33579 6.41421 5 6 5Z"
        fill="currentColor"
      />
    </svg>
  ),
  pending: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
};

export function StatusBadge({
  status,
  label,
  size = "medium",
  className = "",
}: StatusBadgeProps) {
  const variantMap: Record<StatusBadgeProps["status"], BadgeVariant> = {
    success: "success",
    warning: "warning",
    error: "error",
    info: "info",
    pending: "default",
  };

  return (
    <Badge
      variant={variantMap[status]}
      size={size}
      icon={statusIcons[status]}
      className={className}
    >
      {label}
    </Badge>
  );
}

// Commit Type Badge - for git commit types
export interface CommitTypeBadgeProps {
  type:
    | "feat"
    | "fix"
    | "chore"
    | "refactor"
    | "docs"
    | "style"
    | "test"
    | "perf"
    | string;
  size?: BadgeSize;
  className?: string;
}

export function CommitTypeBadge({
  type,
  size = "small",
  className = "",
}: CommitTypeBadgeProps) {
  const knownTypes = [
    "feat",
    "fix",
    "chore",
    "refactor",
    "docs",
    "style",
    "test",
    "perf",
  ];
  const variant = knownTypes.includes(type) ? (type as BadgeVariant) : "default";

  return (
    <Badge variant={variant} size={size} className={className}>
      {type}
    </Badge>
  );
}

export default Badge;
