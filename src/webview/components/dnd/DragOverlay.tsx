/**
 * DragOverlay - Custom overlay during drag operations
 * Shows operation preview with icons (rebase, cherry-pick, etc.)
 */

import React from 'react';

import type {
  DragSource,
  OperationInfo,
  GitOperation,
  DragSourceCommit,
  DragSourceBranch,
  DragSourceBranchPointer,
} from './types';
import styles from './DndProvider.module.css';

// ============================================================================
// Props
// ============================================================================

export interface DragOverlayProps {
  /** The drag source data */
  source: DragSource;
  /** Current operation info if over a valid target */
  operation: OperationInfo | null;
  /** Whether the current drop is valid */
  isValidDrop: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const DragOverlay: React.FC<DragOverlayProps> = ({
  source,
  operation,
  isValidDrop,
}) => {
  return (
    <div
      className={`
        ${styles.dragOverlay}
        ${isValidDrop ? styles.dragOverlayValid : ''}
        ${operation && !isValidDrop ? styles.dragOverlayInvalid : ''}
      `.trim()}
      role="presentation"
      aria-hidden="true"
    >
      {/* Source preview */}
      <div className={styles.dragOverlaySource}>
        {renderSourcePreview(source)}
      </div>

      {/* Operation indicator */}
      {operation && (
        <div
          className={`
            ${styles.dragOverlayOperation}
            ${isValidDrop ? styles.operationValid : styles.operationInvalid}
          `.trim()}
        >
          <span className={styles.operationIcon}>
            <OperationIcon operation={operation.operation} />
          </span>
          <span className={styles.operationLabel}>
            {operation.operation.replace('-', ' ')}
          </span>
        </div>
      )}

      {/* Drop hint */}
      {!operation && (
        <div className={styles.dragOverlayHint}>
          Drag to a target
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Source Preview Renderers
// ============================================================================

function renderSourcePreview(source: DragSource): React.ReactNode {
  switch (source.type) {
    case 'commit':
      return <CommitPreview source={source} />;
    case 'branch':
      return <BranchPreview source={source} />;
    case 'branch-pointer':
      return <BranchPointerPreview source={source} />;
    case 'tag':
      return <TagPreview tagName={source.tagName} />;
    default:
      return null;
  }
}

// ============================================================================
// Commit Preview
// ============================================================================

interface CommitPreviewProps {
  source: DragSourceCommit;
}

const CommitPreview: React.FC<CommitPreviewProps> = ({ source }) => {
  const { commit, branchName } = source;

  return (
    <div className={styles.commitPreview}>
      <div className={styles.commitPreviewHeader}>
        <span className={styles.commitHash}>{commit.shortHash}</span>
        {branchName && (
          <span className={styles.commitBranch}>{branchName}</span>
        )}
      </div>
      <div className={styles.commitMessage}>
        {truncateMessage(commit.message, 50)}
      </div>
      <div className={styles.commitMeta}>
        <span className={styles.commitAuthor}>{commit.author.name}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Branch Preview
// ============================================================================

interface BranchPreviewProps {
  source: DragSourceBranch;
}

const BranchPreview: React.FC<BranchPreviewProps> = ({ source }) => {
  const { branch } = source;

  return (
    <div className={styles.branchPreview}>
      <span className={styles.branchIcon}>
        <BranchIcon />
      </span>
      <span className={styles.branchName}>{branch.name}</span>
      {branch.isRemote && (
        <span className={styles.remoteBadge}>remote</span>
      )}
    </div>
  );
};

// ============================================================================
// Branch Pointer Preview
// ============================================================================

interface BranchPointerPreviewProps {
  source: DragSourceBranchPointer;
}

const BranchPointerPreview: React.FC<BranchPointerPreviewProps> = ({ source }) => {
  const { branch, commitHash } = source;

  return (
    <div className={styles.branchPointerPreview}>
      <span className={styles.branchIcon}>
        <BranchPointerIcon />
      </span>
      <span className={styles.branchName}>{branch.name}</span>
      <span className={styles.pointerArrow}>-&gt;</span>
      <span className={styles.commitHash}>{commitHash.slice(0, 7)}</span>
    </div>
  );
};

// ============================================================================
// Tag Preview
// ============================================================================

interface TagPreviewProps {
  tagName: string;
}

const TagPreview: React.FC<TagPreviewProps> = ({ tagName }) => {
  return (
    <div className={styles.tagPreview}>
      <span className={styles.tagIcon}>
        <TagIcon />
      </span>
      <span className={styles.tagName}>{tagName}</span>
    </div>
  );
};

// ============================================================================
// Operation Icons
// ============================================================================

interface OperationIconProps {
  operation: GitOperation;
}

const OperationIcon: React.FC<OperationIconProps> = ({ operation }) => {
  switch (operation) {
    case 'rebase':
      return <RebaseIcon />;
    case 'cherry-pick':
      return <CherryPickIcon />;
    case 'move-branch':
      return <MoveBranchIcon />;
    case 'merge':
      return <MergeIcon />;
    case 'create-branch':
      return <CreateBranchIcon />;
    case 'reorder-commits':
      return <ReorderIcon />;
    case 'invalid':
      return <InvalidIcon />;
    default:
      return null;
  }
};

// ============================================================================
// SVG Icons
// ============================================================================

const BranchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 4.5C14 3.12 12.88 2 11.5 2C10.12 2 9 3.12 9 4.5C9 5.46 9.56 6.28 10.38 6.66C10.24 8.32 9.36 9.14 7.5 9.5C6.26 9.76 5.3 10.32 4.62 11.08V5.92C5.44 5.54 6 4.72 6 3.76C6 2.38 4.88 1.26 3.5 1.26C2.12 1.26 1 2.38 1 3.76C1 4.72 1.56 5.54 2.38 5.92V10.08C1.56 10.46 1 11.28 1 12.24C1 13.62 2.12 14.74 3.5 14.74C4.88 14.74 6 13.62 6 12.24C6 11.38 5.54 10.62 4.86 10.2C5.36 9.52 6.18 9.12 7.3 8.88C10.32 8.32 11.76 6.76 11.94 4.54C12.58 4.26 13 3.64 13 2.88V4.5H14Z" />
  </svg>
);

const BranchPointerIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11 4H3V6H11V8L15 5L11 2V4Z" />
    <path d="M3 8V10H7V12H3V14H9V10H5V8H3Z" />
  </svg>
);

const TagIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.74 1.053a.75.75 0 01.52 0l4.5 1.5a.75.75 0 01.49.54l1.25 5a.75.75 0 01-.19.72l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 01-.19-.72l1.25-5a.75.75 0 01.49-.54l4.5-1.5zM8 3.553L4.29 4.79l-.96 3.84L8 13.29l4.67-4.66-.96-3.84L8 3.553zm1.5 3.697a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
  </svg>
);

const RebaseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm8-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM4 5v6M10 5v2.5c0 1-1 2-2.5 2H6" />
    <path d="M4 5V11M10 5V7.5C10 8.5 9 9.5 7.5 9.5H6" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);

const CherryPickIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="3" />
    <path d="M8 2V5M8 11V14M5 8H2M14 8H11" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);

const MoveBranchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 4H9V6H3V4ZM11 5L15 8L11 11V5Z" />
    <path d="M3 10H9V12H3V10Z" />
  </svg>
);

const MergeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M2 4V8C2 10 4 12 8 12M11 4V8C11 10 9 12 8 12V12" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);

const CreateBranchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-8 11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    <path d="M2 4V12M10 4V6C10 8 8 10 4 12" strokeWidth="1.5" stroke="currentColor" fill="none" />
    <path d="M12 7H15M13.5 5.5V8.5" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);

const ReorderIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 4H13M3 8H13M3 12H13" strokeWidth="1.5" stroke="currentColor" fill="none" />
    <circle cx="2" cy="4" r="1" />
    <circle cx="2" cy="8" r="1" />
    <circle cx="2" cy="12" r="1" />
  </svg>
);

const InvalidIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM11.59 10.59L10.59 11.59L8 9L5.41 11.59L4.41 10.59L7 8L4.41 5.41L5.41 4.41L8 7L10.59 4.41L11.59 5.41L9 8L11.59 10.59Z" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.slice(0, maxLength - 3) + '...';
}

export default DragOverlay;
