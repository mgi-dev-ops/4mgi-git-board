import React, { useMemo } from 'react';
import type { RebaseCommit } from './types';
import styles from './RebasePreview.module.css';

export interface RebasePreviewProps {
  /** Commits with their actions */
  commits: RebaseCommit[];
}

/** Preview commit item */
interface PreviewCommit {
  sha: string;
  message: string;
  status: 'kept' | 'squashed' | 'reworded' | 'dropped' | 'edited';
  note?: string;
}

/**
 * RebasePreview - Shows preview of rebase result
 * Based on docs/04-UI-UX-DESIGN.md section 2.2 - Preview Section
 */
export function RebasePreview({ commits }: RebasePreviewProps): React.ReactElement {
  // Calculate preview commits
  const previewCommits = useMemo((): PreviewCommit[] => {
    const result: PreviewCommit[] = [];
    let lastKeptIndex: number | null = null;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];

      switch (commit.action) {
        case 'pick':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'kept',
          });
          lastKeptIndex = result.length - 1;
          break;

        case 'reword':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'reworded',
            note: '(message will be edited)',
          });
          lastKeptIndex = result.length - 1;
          break;

        case 'edit':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'edited',
            note: '(rebase will pause here)',
          });
          lastKeptIndex = result.length - 1;
          break;

        case 'squash':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'squashed',
            note: lastKeptIndex !== null ? '(squashed into above)' : '(will be squashed)',
          });
          break;

        case 'fixup':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'squashed',
            note: lastKeptIndex !== null ? '(squashed, message discarded)' : '(will be squashed)',
          });
          break;

        case 'drop':
          result.push({
            sha: commit.shortSha,
            message: commit.message,
            status: 'dropped',
            note: '(will be dropped)',
          });
          break;
      }
    }

    return result;
  }, [commits]);

  // Count final commits (excluding dropped)
  const finalCommitCount = useMemo(() => {
    let count = 0;
    let lastKeptIndex: number | null = null;

    for (const commit of commits) {
      if (commit.action === 'drop') continue;

      if (commit.action === 'squash' || commit.action === 'fixup') {
        // Squash/fixup don't add to count, they merge into previous
        if (lastKeptIndex === null) {
          // First commit can't be squashed, treat as pick
          count++;
          lastKeptIndex = count - 1;
        }
        continue;
      }

      count++;
      lastKeptIndex = count - 1;
    }

    return count;
  }, [commits]);

  // Get status icon
  const getStatusIcon = (status: PreviewCommit['status']): string => {
    switch (status) {
      case 'kept':
        return '\u25CF'; // ●
      case 'squashed':
        return '\u25CF'; // ●
      case 'reworded':
        return '\u25CF'; // ●
      case 'edited':
        return '\u25CF'; // ●
      case 'dropped':
        return '\u2715'; // ✕
      default:
        return '\u25CF';
    }
  };

  // Get status class
  const getStatusClass = (status: PreviewCommit['status']): string => {
    return styles[`status-${status}`] || '';
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        PREVIEW
      </div>
      <div className={styles.subheader}>
        After rebase ({finalCommitCount} commit{finalCommitCount !== 1 ? 's' : ''}):
      </div>
      <div className={styles.commitList}>
        {previewCommits.map((commit, index) => (
          <div
            key={`${commit.sha}-${index}`}
            className={`${styles.commitItem} ${getStatusClass(commit.status)}`}
          >
            <span className={styles.icon}>{getStatusIcon(commit.status)}</span>
            <span className={styles.sha}>{commit.sha}</span>
            <span className={styles.message}>{commit.message}</span>
            {commit.note && <span className={styles.note}>{commit.note}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default RebasePreview;
