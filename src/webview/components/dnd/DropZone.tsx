/**
 * DropZone - Generic drop zone component
 * Provides visual feedback and accept/reject logic for drop operations
 */

import { useDroppable } from '@dnd-kit/core';
import React from 'react';

import { useDndContext } from './DndProvider';
import styles from './DndProvider.module.css';
import type {
	DragSourceType,
	DropTarget,
	DropTargetType,
	GitOperation,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface DropZoneProps {
	/** Unique identifier for the drop zone */
	id: string;
	/** Type of drop target */
	targetType: DropTargetType;
	/** Data to pass when dropping */
	data: DropTarget;
	/** Children to render */
	children?: React.ReactNode;
	/** Whether dropping is disabled */
	disabled?: boolean;
	/** Additional class name */
	className?: string;
	/** Accepted drag source types */
	acceptedSourceTypes?: DragSourceType[];
	/** Accepted operations */
	acceptedOperations?: GitOperation[];
	/** Label for accessibility */
	label?: string;
	/** Custom render for empty state */
	emptyContent?: React.ReactNode;
	/** Custom render for hover state */
	hoverContent?: React.ReactNode;
	/** Callback when item is dropped */
	onDrop?: (source: unknown, operation: GitOperation) => void;
}

// ============================================================================
// Component
// ============================================================================

export const DropZone: React.FC<DropZoneProps> = ({
	id,
	targetType,
	data,
	children,
	disabled = false,
	className,
	acceptedSourceTypes,
	acceptedOperations,
	label,
	emptyContent,
	hoverContent,
	onDrop: _onDrop,
}) => {
	const { dragState } = useDndContext();

	const { setNodeRef, isOver, active } = useDroppable({
		id,
		data,
		disabled,
	});

	// Check if current drag source is acceptable
	const isSourceAccepted = React.useMemo(() => {
		if (!dragState.source || !acceptedSourceTypes) {
			return true; // Accept all if no filter specified
		}
		return acceptedSourceTypes.includes(dragState.source.type);
	}, [dragState.source, acceptedSourceTypes]);

	// Check if current operation is acceptable
	const isOperationAccepted = React.useMemo(() => {
		if (!dragState.operation || !acceptedOperations) {
			return true; // Accept all if no filter specified
		}
		return acceptedOperations.includes(dragState.operation.operation);
	}, [dragState.operation, acceptedOperations]);

	// Determine if drop is valid
	const isValidDrop = React.useMemo(() => {
		if (disabled || !dragState.isDragging) {
			return false;
		}
		return dragState.isValidDrop && isSourceAccepted && isOperationAccepted;
	}, [disabled, dragState, isSourceAccepted, isOperationAccepted]);

	// Visual states
	const isActive = isOver && active !== null;
	const showAcceptFeedback = isActive && isValidDrop;
	const showRejectFeedback = isActive && dragState.isDragging && !isValidDrop;
	const showHoverHighlight = isActive && !showRejectFeedback;

	// Determine current state for rendering
	const renderState = React.useMemo(() => {
		if (showAcceptFeedback) return 'accept';
		if (showRejectFeedback) return 'reject';
		if (isActive) return 'hover';
		if (dragState.isDragging) return 'potential';
		return 'idle';
	}, [showAcceptFeedback, showRejectFeedback, isActive, dragState.isDragging]);

	return (
		<div
			ref={setNodeRef}
			className={`
        ${styles.dropZone}
        ${styles[`dropZone--${targetType}`]}
        ${styles[`dropZone--${renderState}`]}
        ${disabled ? styles.disabled : ''}
        ${className ?? ''}
      `.trim()}
			data-drop-zone={targetType}
			data-drop-state={renderState}
			data-drop-valid={isValidDrop}
			aria-dropeffect={disabled ? 'none' : 'move'}
			aria-label={label ?? `Drop zone for ${targetType}`}
			role="region"
		>
			{/* Main content */}
			<div className={styles.dropZoneContent}>{children}</div>

			{/* Empty state */}
			{!children && emptyContent && (
				<div className={styles.dropZoneEmpty}>{emptyContent}</div>
			)}

			{/* Hover state overlay */}
			{showHoverHighlight && hoverContent && (
				<div className={styles.dropZoneHoverContent}>{hoverContent}</div>
			)}

			{/* Drop feedback indicator */}
			{isActive && (
				<div className={styles.dropZoneFeedback}>
					<DropFeedbackIndicator
						state={renderState}
						operation={dragState.operation?.operation}
						description={dragState.operation?.description}
					/>
				</div>
			)}

			{/* Border highlight */}
			<div
				className={`
          ${styles.dropZoneBorder}
          ${showAcceptFeedback ? styles.borderAccept : ''}
          ${showRejectFeedback ? styles.borderReject : ''}
          ${renderState === 'potential' ? styles.borderPotential : ''}
        `.trim()}
				aria-hidden="true"
			/>
		</div>
	);
};

// ============================================================================
// Drop Feedback Indicator
// ============================================================================

interface DropFeedbackIndicatorProps {
	state: 'idle' | 'potential' | 'hover' | 'accept' | 'reject';
	operation?: GitOperation;
	description?: string;
}

const DropFeedbackIndicator: React.FC<DropFeedbackIndicatorProps> = ({
	state,
	operation,
	description,
}) => {
	if (state === 'idle' || state === 'potential') {
		return null;
	}

	const getIcon = () => {
		switch (state) {
			case 'accept':
				return <AcceptIcon />;
			case 'reject':
				return <RejectIcon />;
			default:
				return <HoverIcon />;
		}
	};

	const getMessage = () => {
		switch (state) {
			case 'accept':
				return description ?? 'Drop to execute';
			case 'reject':
				return 'Cannot drop here';
			default:
				return 'Drop here';
		}
	};

	return (
		<div
			className={`${styles.feedbackIndicator} ${styles[`feedback--${state}`]}`}
		>
			<span className={styles.feedbackIcon}>{getIcon()}</span>
			<span className={styles.feedbackMessage}>{getMessage()}</span>
			{operation && state === 'accept' && (
				<span className={styles.feedbackOperation}>{operation}</span>
			)}
		</div>
	);
};

// ============================================================================
// Icons
// ============================================================================

const AcceptIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M6.5 10.5L3.5 7.5L2.5 8.5L6.5 12.5L14 5L13 4L6.5 10.5Z" />
	</svg>
);

const RejectIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M12 4.7L11.3 4L8 7.3L4.7 4L4 4.7L7.3 8L4 11.3L4.7 12L8 8.7L11.3 12L12 11.3L8.7 8L12 4.7Z" />
	</svg>
);

const HoverIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 2L4 6H6.5V10H9.5V6H12L8 2ZM4 12V14H12V12H4Z" />
	</svg>
);

// ============================================================================
// Specialized Drop Zones
// ============================================================================

/**
 * EmptySpaceDropZone - For creating new branches
 */
export interface EmptySpaceDropZoneProps {
	/** Position in the graph */
	position: { x: number; y: number };
	/** Width of the zone */
	width?: number;
	/** Height of the zone */
	height?: number;
	/** Additional class name */
	className?: string;
	/** Callback when branch is created */
	onCreateBranch?: (
		commitHash: string,
		position: { x: number; y: number },
	) => void;
}

export const EmptySpaceDropZone: React.FC<EmptySpaceDropZoneProps> = ({
	position,
	width: _width = 100,
	height: _height = 50,
	className,
	onCreateBranch: _onCreateBranch,
}) => {
	return (
		<DropZone
			id={`empty-space-${position.x}-${position.y}`}
			targetType="empty-space"
			data={{
				type: 'empty-space',
				position,
			}}
			acceptedSourceTypes={['commit']}
			acceptedOperations={['create-branch']}
			className={`${styles.emptySpaceDropZone} ${className ?? ''}`}
			label="Drop commit here to create a new branch"
			emptyContent={
				<span className={styles.emptySpacePlaceholder}>
					Drop to create branch
				</span>
			}
		/>
	);
};

/**
 * PositionDropZone - For reordering commits
 */
export interface PositionDropZoneProps {
	/** Index position */
	index: number;
	/** Branch name */
	branchName: string;
	/** Additional class name */
	className?: string;
}

export const PositionDropZone: React.FC<PositionDropZoneProps> = ({
	index,
	branchName,
	className,
}) => {
	return (
		<DropZone
			id={`position-${branchName}-${index}`}
			targetType="position"
			data={{
				type: 'position',
				index,
				branchName,
			}}
			acceptedSourceTypes={['commit']}
			acceptedOperations={['reorder-commits']}
			className={`${styles.positionDropZone} ${className ?? ''}`}
			label={`Drop to reorder at position ${index}`}
		/>
	);
};

export default DropZone;
