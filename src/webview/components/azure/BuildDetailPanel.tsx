import React from "react";
import styles from "./BuildDetailPanel.module.css";
import { BuildStatus, BuildStatusBadge } from "./BuildStatusBadge";
import Button from "../common/Button";

export interface TestResults {
  passed: number;
  failed: number;
  skipped?: number;
  total: number;
}

export interface BuildDetailPanelProps {
  /** Build ID */
  buildId: number;
  /** Build number */
  buildNumber: string;
  /** Build status */
  status: BuildStatus;
  /** Pipeline name */
  pipelineName: string;
  /** Duration in seconds */
  durationSeconds?: number;
  /** Queue time */
  queueTime?: string;
  /** Start time */
  startTime?: string;
  /** Finish time */
  finishTime?: string;
  /** Test results */
  testResults?: TestResults;
  /** Code coverage percentage */
  codeCoverage?: number;
  /** Source branch */
  sourceBranch?: string;
  /** Source version (commit SHA) */
  sourceVersion?: string;
  /** Requested by */
  requestedBy?: {
    displayName: string;
    imageUrl?: string;
  };
  /** Handler for view logs */
  onViewLogs?: () => void;
  /** Handler for rebuild */
  onRebuild?: () => void;
  /** Handler for open in Azure DevOps */
  onOpenInAzure?: () => void;
  /** Handler for close panel */
  onClose?: () => void;
  /** Optional className */
  className?: string;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const BuildDetailPanel: React.FC<BuildDetailPanelProps> = ({
  buildId,
  buildNumber,
  status,
  pipelineName,
  durationSeconds,
  queueTime,
  startTime,
  finishTime,
  testResults,
  codeCoverage,
  sourceBranch,
  sourceVersion,
  requestedBy,
  onViewLogs,
  onRebuild,
  onOpenInAzure,
  onClose,
  className = "",
}) => {
  const panelClasses = [styles.panel, className].filter(Boolean).join(" ");

  const testPassRate = testResults
    ? Math.round((testResults.passed / testResults.total) * 100)
    : null;

  return (
    <div className={panelClasses} role="region" aria-label={`Build #${buildNumber} details`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <BuildStatusBadge status={status} buildNumber={buildNumber} />
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
        <h2 className={styles.title}>{pipelineName}</h2>
      </div>

      {/* Build Info */}
      <div className={styles.section}>
        <div className={styles.infoGrid}>
          {durationSeconds !== undefined && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
                </svg>
              </span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Duration</span>
                <span className={styles.infoValue}>{formatDuration(durationSeconds)}</span>
              </div>
            </div>
          )}

          {queueTime && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.75 0h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5ZM2.25 3.5h11.5a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5ZM.75 6.5h14.5A.75.75 0 0 1 16 7.25v7.5a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1-.75-.75v-7.5A.75.75 0 0 1 .75 6.5Z" />
                </svg>
              </span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Queued</span>
                <span className={styles.infoValue}>{queueTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source */}
      {(sourceBranch || sourceVersion) && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Source</h3>
          {sourceBranch && (
            <div className={styles.row}>
              <span className={styles.label}>Branch</span>
              <span className={styles.branchName}>{sourceBranch}</span>
            </div>
          )}
          {sourceVersion && (
            <div className={styles.row}>
              <span className={styles.label}>Commit</span>
              <span className={styles.sha}>{sourceVersion.substring(0, 8)}</span>
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Test Results</h3>
          <div className={styles.testResults}>
            <div className={styles.testSummary}>
              <span className={styles.testPassed}>{testResults.passed} passed</span>
              <span className={styles.testDivider}>|</span>
              <span className={styles.testFailed}>{testResults.failed} failed</span>
              {testResults.skipped !== undefined && testResults.skipped > 0 && (
                <>
                  <span className={styles.testDivider}>|</span>
                  <span className={styles.testSkipped}>{testResults.skipped} skipped</span>
                </>
              )}
            </div>
            {testPassRate !== null && (
              <div className={styles.testProgressContainer}>
                <div className={styles.testProgressBar}>
                  <div
                    className={styles.testProgressFill}
                    style={{ width: `${testPassRate}%` }}
                    aria-label={`${testPassRate}% tests passed`}
                  />
                </div>
                <span className={styles.testPercentage}>{testPassRate}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Coverage */}
      {codeCoverage !== undefined && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Code Coverage</h3>
          <div className={styles.coverageContainer}>
            <div className={styles.coverageProgressBar}>
              <div
                className={styles.coverageProgressFill}
                style={{ width: `${codeCoverage}%` }}
                aria-label={`${codeCoverage}% code coverage`}
              />
            </div>
            <span className={styles.coveragePercentage}>{codeCoverage.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Requested By */}
      {requestedBy && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Requested By</h3>
          <div className={styles.requestedByRow}>
            {requestedBy.imageUrl ? (
              <img src={requestedBy.imageUrl} alt="" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {requestedBy.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.requestedByName}>{requestedBy.displayName}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {onViewLogs && (
          <Button variant="secondary" onClick={onViewLogs}>
            View Logs
          </Button>
        )}
        {onRebuild && status !== "running" && (
          <Button variant="secondary" onClick={onRebuild}>
            Rebuild
          </Button>
        )}
        {onOpenInAzure && (
          <Button variant="primary" onClick={onOpenInAzure}>
            Open in Azure DevOps
          </Button>
        )}
      </div>
    </div>
  );
};

BuildDetailPanel.displayName = "BuildDetailPanel";

export default BuildDetailPanel;
