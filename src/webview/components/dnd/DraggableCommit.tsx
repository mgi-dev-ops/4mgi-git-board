/**
 * DraggableCommit - Wrapper for draggable commit nodes
 * Uses @dnd-kit useDraggable hook
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import type { GitCommit } from '../../stores/gitStore';
import styles from './DndProvider.module.css';
import type { DragSourceCommit } from './types';

// ============================================================================
// Props
// ============================================================================

export interface DraggableCommitProps {
	/** The commit to make draggable */
	commit: GitCommit;
	/** Optional branch name the commit belongs to */
	branchName?: string;
	/** Children to render inside the draggable */
	children: React.ReactNode;
	/** Unique identifier for the draggable */
	id?: string;
	/** Whether dragging is disabled */
	disabled?: boolean;
	/** Additional class name */
	className?: string;
	/** Callback when drag starts */
	onDragStart?: () => void;
	/** Callback when drag ends */
	onDragEnd?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const DraggableCommit: React.FC<DraggableCommitProps> = ({
	commit,
	branchName,
	children,
	id,
	disabled = false,
	className,
	onDragStart,
	onDragEnd,
}) => {
	// Create drag source data
	const dragData: DragSourceCommit = {
		type: 'commit',
		commit,
		branchName,
	};

	// Use unique ID based on commit hash
	const draggableId = id ?? `commit-${commit.hash}`;

	const { attributes, listeners, setNodeRef, transform, isDragging, active } =
		useDraggable({
			id: draggableId,
			data: dragData,
			disabled,
		});

	// Apply transform style when dragging
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		opacity: isDragging ? 0.5 : 1,
		cursor: disabled ? 'default' : 'grab',
	};

	// Handle drag lifecycle
	React.useEffect(() => {
		if (isDragging) {
			onDragStart?.();
		} else if (active === null) {
			onDragEnd?.();
		}
	}, [isDragging, active, onDragStart, onDragEnd]);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`
        ${styles.draggable}
        ${styles.draggableCommit}
        ${isDragging ? styles.dragging : ''}
        ${disabled ? styles.disabled : ''}
        ${className ?? ''}
      `.trim()}
			{...listeners}
			{...attributes}
			role="button"
			aria-pressed={isDragging}
			aria-describedby={`drag-instructions-${draggableId}`}
			data-draggable="commit"
			data-commit-hash={commit.hash}
			data-branch={branchName}
		>
			{children}

			{/* Hidden instructions for screen readers */}
			<span id={`drag-instructions-${draggableId}`} className={styles.srOnly}>
				Press Space or Enter to start dragging this commit. Use arrow keys to
				move, Space to drop, Escape to cancel.
			</span>
		</div>
	);
};

// ============================================================================
// Multi-select Draggable Commit
// For dragging multiple selected commits
// ============================================================================

export interface DraggableCommitGroupProps {
	/** Array of commits to drag together */
	commits: GitCommit[];
	/** Branch name for the commits */
	branchName?: string;
	/** Children to render */
	children: React.ReactNode;
	/** Whether dragging is disabled */
	disabled?: boolean;
	/** Additional class name */
	className?: string;
}

export const DraggableCommitGroup: React.FC<DraggableCommitGroupProps> = ({
	commits,
	branchName,
	children,
	disabled = false,
	className,
}) => {
	if (commits.length === 0) {
		return <>{children}</>;
	}

	// Use first commit as primary, rest as additional
	const primaryCommit = commits[0];
	const groupId = `commit-group-${commits.map((c) => c.shortHash).join('-')}`;

	const dragData = {
		type: 'commit' as const,
		commit: primaryCommit,
		branchName,
		// Additional commits for multi-select operations
		additionalCommits: commits.slice(1),
		isGroup: true,
	};

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: groupId,
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
        ${styles.draggableCommitGroup}
        ${isDragging ? styles.dragging : ''}
        ${disabled ? styles.disabled : ''}
        ${className ?? ''}
      `.trim()}
			{...listeners}
			{...attributes}
			data-draggable="commit-group"
			data-commit-count={commits.length}
		>
			{children}

			{/* Badge showing count */}
			{isDragging && commits.length > 1 && (
				<span className={styles.dragBadge}>{commits.length}</span>
			)}
		</div>
	);
};

export default DraggableCommit;
