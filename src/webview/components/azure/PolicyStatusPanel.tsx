import React from "react";
import styles from "./PolicyStatusPanel.module.css";
import Button from "../common/Button";

export type PolicyStatus = "approved" | "rejected" | "pending" | "notApplicable";

export interface BranchPolicy {
  /** Policy ID */
  id: string;
  /** Policy name/description */
  name: string;
  /** Policy status */
  status: PolicyStatus;
  /** Additional details */
  details?: string;
  /** Is blocking policy */
  isBlocking?: boolean;
}

export interface PolicyStatusPanelProps {
  /** Branch name */
  branchName: string;
  /** List of branch policies */
  policies: BranchPolicy[];
  /** Overall status - are all policies satisfied? */
  allPoliciesSatisfied?: boolean;
  /** Handler for view details */
  onViewDetails?: (policyId: string) => void;
  /** Handler for close panel */
  onClose?: () => void;
  /** Optional className */
  className?: string;
}

const statusConfig: Record<PolicyStatus, { icon: React.ReactNode; label: string; className: string }> = {
  approved: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
      </svg>
    ),
    label: "Passed",
    className: "statusApproved",
  },
  rejected: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
      </svg>
    ),
    label: "Failed",
    className: "statusRejected",
  },
  pending: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      </svg>
    ),
    label: "Pending",
    className: "statusPending",
  },
  notApplicable: {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M6.5 7.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
    label: "N/A",
    className: "statusNA",
  },
};

export const PolicyStatusPanel: React.FC<PolicyStatusPanelProps> = ({
  branchName,
  policies,
  allPoliciesSatisfied = false,
  onViewDetails,
  onClose,
  className = "",
}) => {
  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  const approvedCount = policies.filter((p) => p.status === "approved").length;
  const rejectedCount = policies.filter((p) => p.status === "rejected").length;
  const pendingCount = policies.filter((p) => p.status === "pending").length;

  return (
    <div className={panelClasses} role="region" aria-label={`Branch policies for ${branchName}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Branch Policies</h2>
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
        <span className={styles.branchName}>{branchName}</span>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={`${styles.summaryBadge} ${allPoliciesSatisfied ? styles.satisfied : styles.notSatisfied}`}>
          {allPoliciesSatisfied ? (
            <>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
              All policies satisfied
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047Z" />
              </svg>
              Policies not satisfied
            </>
          )}
        </div>
        <div className={styles.summaryStats}>
          <span className={styles.statApproved}>{approvedCount} passed</span>
          {rejectedCount > 0 && <span className={styles.statRejected}>{rejectedCount} failed</span>}
          {pendingCount > 0 && <span className={styles.statPending}>{pendingCount} pending</span>}
        </div>
      </div>

      {/* Policy List */}
      <div className={styles.section}>
        <ul className={styles.policyList}>
          {policies.map((policy) => {
            const statusInfo = statusConfig[policy.status];
            return (
              <li
                key={policy.id}
                className={`${styles.policyItem} ${policy.isBlocking ? styles.blocking : ""}`}
              >
                <span className={`${styles.statusIcon} ${styles[statusInfo.className]}`}>
                  {statusInfo.icon}
                </span>
                <div className={styles.policyContent}>
                  <span className={styles.policyName}>
                    {policy.name}
                    {policy.isBlocking && (
                      <span className={styles.blockingBadge} title="Blocking policy">
                        Blocking
                      </span>
                    )}
                  </span>
                  {policy.details && (
                    <span className={styles.policyDetails}>{policy.details}</span>
                  )}
                </div>
                {onViewDetails && (
                  <button
                    className={styles.viewDetailsButton}
                    onClick={() => onViewDetails(policy.id)}
                    aria-label={`View details for ${policy.name}`}
                    title="View details"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendTitle}>Legend:</span>
        <div className={styles.legendItems}>
          <span className={styles.legendItem}>
            <span className={`${styles.statusIcon} ${styles.statusApproved}`}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </span>
            Passed
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.statusIcon} ${styles.statusRejected}`}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </span>
            Failed
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.statusIcon} ${styles.statusPending}`}>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              </svg>
            </span>
            Pending
          </span>
        </div>
      </div>
    </div>
  );
};

PolicyStatusPanel.displayName = "PolicyStatusPanel";

export default PolicyStatusPanel;
