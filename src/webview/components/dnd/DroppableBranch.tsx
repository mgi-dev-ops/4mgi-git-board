/**
 * DroppableBranch - Wrapper for branch drop targets
 * Uses @dnd-kit useDroppable hook with visual feedback
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

import { useDndContext } from './DndProvider';
import type { GitBranch } from '../../stores/gitStore';
import type { DropTargetBranch, GitOperation } from './types';
import styles from './DndProvider.module.css';

// ============================================================================
// Props
// ============================================================================

export interface DroppableBranchProps {
  /** The branch to make droppable */
  branch: GitBranch;
  /** Children to render inside the droppable */
  children: React.ReactNode;
  /** Unique identifier for the droppable */
  id?: string;
  /** Whether dropping is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Accepted operations for this branch */
  acceptedOperations?: GitOperation[];
  /** Callback when valid item is dropped */
  onDrop?: (operation: GitOperation) => void;
}

// ============================================================================
// Component
// ============================================================================

export const DroppableBranch: React.FC<DroppableBranchProps> = ({
  branch,
  children,
  id,
  disabled = false,
  className,
  acceptedOperations = ['cherry-pick', 'merge'],
  onDrop,
}) => {
  const { dragState } = useDndContext();

  // Create drop target data
  const dropData: DropTargetBranch = {
    type: 'branch',
    branch,
  };

  // Use unique ID based on branch name
  const droppableId = id ?? `branch-${branch.name.replace(/\//g, '-')}`;

  const {
    setNodeRef,
    isOver,
    active,
  } = useDroppable({
    id: droppableId,
    data: dropData,
    disabled,
  });

  // Check if current drag is valid for this target
  const isValidTarget = React.useMemo(() => {
    if (!dragState.operation || disabled) {
      return false;
    }
    return (
      dragState.operation.isValid &&
      acceptedOperations.includes(dragState.operation.operation)
    );
  }, [dragState.operation, disabled, acceptedOperations]);

  // Determine visual state
  const isActive = isOver && active !== null;
  const showAcceptFeedback = isActive && isValidTarget;
  const showRejectFeedback = isActive && !isValidTarget;

  // Dynamic styles for drop feedback
  const getDropIndicatorStyle = (): React.CSSProperties => {
    if (!isActive) {
      return {};
    }

    return {
      boxShadow: showAcceptFeedback
        ? '0 0 0 2px var(--success-green)'
        : showRejectFeedback
        ? '0 0 0 2px var(--error-red)'
        : undefined,
    };
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        ${styles.droppable}
        ${styles.droppableBranch}
        ${isActive ? styles.dropTargetActive : ''}
        ${showAcceptFeedback ? styles.dropTargetValid : ''}
        ${showRejectFeedback ? styles.dropTargetInvalid : ''}
        ${disabled ? styles.disabled : ''}
        ${className ?? ''}
      `.trim()}
      style={getDropIndicatorStyle()}
      data-droppable="branch"
      data-branch-name={branch.name}
      data-is-remote={branch.isRemote}
      data-drop-valid={isValidTarget}
      aria-dropeffect={disabled ? 'none' : 'move'}
      aria-label={`Drop zone for branch ${branch.name}`}
    >
      {children}

      {/* Visual feedback indicator */}
      {isActive && (
        <div className={styles.dropIndicator}>
          <span className={styles.dropIndicatorIcon}>
            {showAcceptFeedback ? (
              <DropAcceptIcon />
            ) : showRejectFeedback ? (
              <DropRejectIcon />
            ) : null}
          </span>
          {dragState.operation && (
            <span className={styles.dropIndicatorText}>
              {showAcceptFeedback
                ? dragState.operation.description
                : 'Cannot drop here'}
            </span>
          )}
        </div>
      )}

      {/* Highlight overlay for valid drops */}
      {showAcceptFeedback && (
        <div className={styles.dropHighlight} aria-hidden="true" />
      )}
    </div>
  );
};

// ============================================================================
// Helper Icons
// ============================================================================

const DropAcceptIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6.5 10.5L3.5 7.5L2.5 8.5L6.5 12.5L14 5L13 4L6.5 10.5Z"
      fill="currentColor"
    />
  </svg>
);

const DropRejectIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 4.7L11.3 4L8 7.3L4.7 4L4 4.7L7.3 8L4 11.3L4.7 12L8 8.7L11.3 12L12 11.3L8.7 8L12 4.7Z"
      fill="currentColor"
    />
  </svg>
);

// ============================================================================
// Draggable Branch (for merge operations)
// ============================================================================

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { DragSourceBranch } from './types';

export interface DraggableBranchProps {
  /** The branch to make draggable */
  branch: GitBranch;
  /** Children to render */
  children: React.ReactNode;
  /** Unique identifier */
  id?: string;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export const DraggableBranch: React.FC<DraggableBranchProps> = ({
  branch,
  children,
  id,
  disabled = false,
  className,
}) => {
  const dragData: DragSourceBranch = {
    type: 'branch',
    branch,
  };

  const draggableId = id ?? `draggable-branch-${branch.name.replace(/\//g, '-')}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: draggableId,
    data: dragData,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${styles.draggable}
        ${styles.draggableBranch}
        ${isDragging ? styles.dragging : ''}
        ${disabled ? styles.disabled : ''}
        ${className ?? ''}
      `.trim()}
      {...listeners}
      {...attributes}
      data-draggable="branch"
      data-branch-name={branch.name}
    >
      {children}
    </div>
  );
};

export default DroppableBranch;
