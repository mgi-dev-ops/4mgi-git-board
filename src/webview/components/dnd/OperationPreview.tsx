/**
 * OperationPreview - Show preview of what will happen when drop is executed
 * Includes before/after graph visualization and confirm/cancel buttons
 */

import type React from 'react';
import { useCallback, useState } from 'react';
import { useDragOperation } from '../../hooks/useDragOperation';
import styles from './DndProvider.module.css';
import type {
	DragSource,
	DropTarget,
	GitOperation,
	OperationInfo,
} from './types';

// ============================================================================
// Props
// ============================================================================

export interface OperationPreviewProps {
	/** Whether the preview modal is open */
	isOpen: boolean;
	/** The drag source */
	source: DragSource | null;
	/** The drop target */
	target: DropTarget | null;
	/** Operation info */
	operation: OperationInfo | null;
	/** Callback when operation is confirmed */
	onConfirm: () => void;
	/** Callback when operation is cancelled */
	onCancel: () => void;
	/** Whether operation is executing */
	isExecuting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const OperationPreview: React.FC<OperationPreviewProps> = ({
	isOpen,
	source,
	target,
	operation,
	onConfirm,
	onCancel,
	isExecuting = false,
}) => {
	const { isDangerousOperation, getOperationWarning } = useDragOperation();

	if (!isOpen || !source || !target || !operation) {
		return null;
	}

	const isDangerous = isDangerousOperation(operation.operation);
	const warning =
		operation.warning ||
		(source && target ? getOperationWarning(source, target) : undefined);

	return (
		<div
			className={styles.operationPreviewOverlay}
			role="dialog"
			aria-modal="true"
		>
			<div className={styles.operationPreviewModal}>
				{/* Header */}
				<div className={styles.previewHeader}>
					<h2 className={styles.previewTitle}>
						<OperationTypeIcon operation={operation.operation} />
						<span>{formatOperationName(operation.operation)}</span>
					</h2>
					<button
						type="button"
						className={styles.previewCloseButton}
						onClick={onCancel}
						disabled={isExecuting}
						aria-label="Close preview"
					>
						<CloseIcon />
					</button>
				</div>

				{/* Description */}
				<div className={styles.previewDescription}>
					<p>{operation.description}</p>
				</div>

				{/* Warning */}
				{warning && (
					<div
						className={`${styles.previewWarning} ${isDangerous ? styles.warningDanger : ''}`}
					>
						<WarningIcon />
						<span>{warning}</span>
					</div>
				)}

				{/* Before/After Visualization */}
				<div className={styles.previewVisualization}>
					<div className={styles.visualizationPane}>
						<h3 className={styles.visualizationTitle}>Before</h3>
						<div className={styles.visualizationContent}>
							<BeforePreview
								source={source}
								target={target}
								operation={operation}
							/>
						</div>
					</div>

					<div className={styles.visualizationArrow}>
						<ArrowRightIcon />
					</div>

					<div className={styles.visualizationPane}>
						<h3 className={styles.visualizationTitle}>After</h3>
						<div className={styles.visualizationContent}>
							<AfterPreview
								source={source}
								target={target}
								operation={operation}
							/>
						</div>
					</div>
				</div>

				{/* Command Preview */}
				<div className={styles.previewCommand}>
					<span className={styles.commandLabel}>Command:</span>
					<code className={styles.commandCode}>{operation.command}</code>
				</div>

				{/* Actions */}
				<div className={styles.previewActions}>
					<button
						type="button"
						className={styles.cancelButton}
						onClick={onCancel}
						disabled={isExecuting}
					>
						Cancel
					</button>
					<button
						type="button"
						className={`${styles.confirmButton} ${isDangerous ? styles.confirmDanger : ''}`}
						onClick={onConfirm}
						disabled={isExecuting}
					>
						{isExecuting ? (
							<>
								<LoadingSpinner />
								<span>Executing...</span>
							</>
						) : (
							<span>{isDangerous ? 'Confirm' : 'Execute'}</span>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

// ============================================================================
// Before Preview Component
// ============================================================================

interface PreviewProps {
	source: DragSource;
	target: DropTarget;
	operation: OperationInfo;
}

const BeforePreview: React.FC<PreviewProps> = ({
	source,
	target,
	operation,
}) => {
	return (
		<div className={styles.graphPreview}>
			{renderBeforeGraph(source, target, operation)}
		</div>
	);
};

const AfterPreview: React.FC<PreviewProps> = ({
	source,
	target,
	operation,
}) => {
	return (
		<div className={styles.graphPreview}>
			{renderAfterGraph(source, target, operation)}
		</div>
	);
};

// ============================================================================
// Graph Rendering Helpers
// ============================================================================

function renderBeforeGraph(
	source: DragSource,
	target: DropTarget,
	operation: OperationInfo,
): React.ReactNode {
	switch (operation.operation) {
		case 'rebase':
			return renderRebaseBeforeGraph(source, target);
		case 'cherry-pick':
			return renderCherryPickBeforeGraph(source, target);
		case 'merge':
			return renderMergeBeforeGraph(source, target);
		case 'move-branch':
			return renderMoveBranchBeforeGraph(source, target);
		case 'create-branch':
			return renderCreateBranchBeforeGraph(source);
		case 'reorder-commits':
			return renderReorderBeforeGraph(source, target);
		default:
			return (
				<span className={styles.previewPlaceholder}>Preview not available</span>
			);
	}
}

function renderAfterGraph(
	source: DragSource,
	target: DropTarget,
	operation: OperationInfo,
): React.ReactNode {
	switch (operation.operation) {
		case 'rebase':
			return renderRebaseAfterGraph(source, target);
		case 'cherry-pick':
			return renderCherryPickAfterGraph(source, target);
		case 'merge':
			return renderMergeAfterGraph(source, target);
		case 'move-branch':
			return renderMoveBranchAfterGraph(source, target);
		case 'create-branch':
			return renderCreateBranchAfterGraph(source);
		case 'reorder-commits':
			return renderReorderAfterGraph(source, target);
		default:
			return (
				<span className={styles.previewPlaceholder}>Preview not available</span>
			);
	}
}

// Simplified graph representations for each operation type
function renderRebaseBeforeGraph(
	source: DragSource,
	target: DropTarget,
): React.ReactNode {
	const sourceHash =
		source.type === 'commit'
			? source.commit.shortHash
			: source.type === 'branch'
				? source.branch.name
				: '???';
	const targetHash = target.type === 'commit' ? target.commit.shortHash : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main branch line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Source branch diverging */}
			<line
				x1="80"
				y1="50"
				x2="140"
				y2="20"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="140" cy="20" r="6" fill="var(--branch-feature)" />
			{/* Labels */}
			<text x="80" y="70" fontSize="10" fill="currentColor" textAnchor="middle">
				base
			</text>
			<text
				x="160"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{targetHash}
			</text>
			<text
				x="140"
				y="12"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceHash}
			</text>
		</svg>
	);
}

function renderRebaseAfterGraph(
	source: DragSource,
	_target: DropTarget,
): React.ReactNode {
	const sourceHash =
		source.type === 'commit'
			? source.commit.shortHash
			: source.type === 'branch'
				? source.branch.name
				: '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main branch line - extended */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--success-green)" />
			{/* Labels */}
			<text
				x="160"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceHash}'
			</text>
			<text
				x="160"
				y="35"
				fontSize="9"
				fill="var(--success-green)"
				textAnchor="middle"
			>
				rebased
			</text>
		</svg>
	);
}

function renderCherryPickBeforeGraph(
	source: DragSource,
	target: DropTarget,
): React.ReactNode {
	const sourceHash = source.type === 'commit' ? source.commit.shortHash : '???';
	const targetBranch = target.type === 'branch' ? target.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Source branch */}
			<line
				x1="20"
				y1="30"
				x2="180"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			{/* Target branch */}
			<line
				x1="20"
				y1="70"
				x2="140"
				y2="70"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Source commits */}
			<circle
				cx="100"
				cy="30"
				r="6"
				fill="var(--branch-feature)"
				stroke="var(--warning-yellow)"
				strokeWidth="2"
			/>
			{/* Target commits */}
			<circle cx="60" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="140" cy="70" r="6" fill="var(--branch-main)" />
			{/* Labels */}
			<text
				x="100"
				y="18"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceHash}
			</text>
			<text
				x="140"
				y="88"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{targetBranch}
			</text>
		</svg>
	);
}

function renderCherryPickAfterGraph(
	source: DragSource,
	target: DropTarget,
): React.ReactNode {
	const sourceHash = source.type === 'commit' ? source.commit.shortHash : '???';
	const _targetBranch = target.type === 'branch' ? target.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Source branch */}
			<line
				x1="20"
				y1="30"
				x2="180"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			{/* Target branch - extended */}
			<line
				x1="20"
				y1="70"
				x2="180"
				y2="70"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Source commit */}
			<circle cx="100" cy="30" r="6" fill="var(--branch-feature)" />
			{/* Target commits */}
			<circle cx="60" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="140" cy="70" r="6" fill="var(--branch-main)" />
			<circle
				cx="180"
				cy="70"
				r="6"
				fill="var(--success-green)"
				stroke="var(--success-green)"
				strokeWidth="2"
			/>
			{/* Labels */}
			<text
				x="180"
				y="88"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceHash}'
			</text>
			<text
				x="180"
				y="55"
				fontSize="9"
				fill="var(--success-green)"
				textAnchor="middle"
			>
				picked
			</text>
		</svg>
	);
}

function renderMergeBeforeGraph(
	source: DragSource,
	target: DropTarget,
): React.ReactNode {
	const sourceBranch = source.type === 'branch' ? source.branch.name : '???';
	const targetBranch = target.type === 'branch' ? target.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Target branch */}
			<line
				x1="20"
				y1="70"
				x2="140"
				y2="70"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Source branch diverging */}
			<line
				x1="60"
				y1="70"
				x2="60"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			<line
				x1="60"
				y1="30"
				x2="140"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="60" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="140" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="30" r="6" fill="var(--branch-feature)" />
			<circle cx="140" cy="30" r="6" fill="var(--branch-feature)" />
			{/* Labels */}
			<text
				x="140"
				y="88"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{targetBranch}
			</text>
			<text
				x="140"
				y="18"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceBranch}
			</text>
		</svg>
	);
}

function renderMergeAfterGraph(
	_source: DragSource,
	target: DropTarget,
): React.ReactNode {
	const targetBranch = target.type === 'branch' ? target.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Target branch */}
			<line
				x1="20"
				y1="70"
				x2="180"
				y2="70"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Source branch merging */}
			<line
				x1="60"
				y1="70"
				x2="60"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			<line
				x1="60"
				y1="30"
				x2="140"
				y2="30"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			<line
				x1="140"
				y1="30"
				x2="180"
				y2="70"
				stroke="var(--branch-feature)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="60" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="140" cy="70" r="6" fill="var(--branch-main)" />
			<circle cx="100" cy="30" r="6" fill="var(--branch-feature)" />
			<circle cx="140" cy="30" r="6" fill="var(--branch-feature)" />
			<circle cx="180" cy="70" r="8" fill="var(--success-green)" />
			{/* Labels */}
			<text
				x="180"
				y="88"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{targetBranch}
			</text>
			<text
				x="180"
				y="55"
				fontSize="9"
				fill="var(--success-green)"
				textAnchor="middle"
			>
				merge
			</text>
		</svg>
	);
}

function renderMoveBranchBeforeGraph(
	source: DragSource,
	_target: DropTarget,
): React.ReactNode {
	const branchName =
		source.type === 'branch-pointer' ? source.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* Branch pointer at 80 */}
			<text
				x="80"
				y="30"
				fontSize="10"
				fill="var(--branch-feature)"
				textAnchor="middle"
			>
				{branchName}
			</text>
			<line
				x1="80"
				y1="32"
				x2="80"
				y2="42"
				stroke="var(--branch-feature)"
				strokeWidth="1"
				markerEnd="url(#arrow)"
			/>
		</svg>
	);
}

function renderMoveBranchAfterGraph(
	source: DragSource,
	_target: DropTarget,
): React.ReactNode {
	const branchName =
		source.type === 'branch-pointer' ? source.branch.name : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* Branch pointer moved to 160 */}
			<text
				x="160"
				y="30"
				fontSize="10"
				fill="var(--success-green)"
				textAnchor="middle"
			>
				{branchName}
			</text>
			<line
				x1="160"
				y1="32"
				x2="160"
				y2="42"
				stroke="var(--success-green)"
				strokeWidth="1"
			/>
		</svg>
	);
}

function renderCreateBranchBeforeGraph(source: DragSource): React.ReactNode {
	const sourceHash = source.type === 'commit' ? source.commit.shortHash : '???';

	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle
				cx="120"
				cy="50"
				r="6"
				fill="var(--branch-main)"
				stroke="var(--warning-yellow)"
				strokeWidth="2"
			/>
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* Label */}
			<text
				x="120"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				{sourceHash}
			</text>
		</svg>
	);
}

function renderCreateBranchAfterGraph(_source: DragSource): React.ReactNode {
	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* New branch line */}
			<line
				x1="120"
				y1="50"
				x2="180"
				y2="20"
				stroke="var(--success-green)"
				strokeWidth="2"
				strokeDasharray="4"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* New branch label */}
			<text
				x="160"
				y="15"
				fontSize="10"
				fill="var(--success-green)"
				textAnchor="middle"
			>
				new-branch
			</text>
		</svg>
	);
}

function renderReorderBeforeGraph(
	_source: DragSource,
	_target: DropTarget,
): React.ReactNode {
	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--branch-main)" />
			<circle
				cx="120"
				cy="50"
				r="6"
				fill="var(--warning-yellow)"
				stroke="var(--warning-yellow)"
				strokeWidth="2"
			/>
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* Labels */}
			<text x="40" y="70" fontSize="10" fill="currentColor" textAnchor="middle">
				1
			</text>
			<text x="80" y="70" fontSize="10" fill="currentColor" textAnchor="middle">
				2
			</text>
			<text
				x="120"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				3
			</text>
			<text
				x="160"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				4
			</text>
		</svg>
	);
}

function renderReorderAfterGraph(
	_source: DragSource,
	_target: DropTarget,
): React.ReactNode {
	return (
		<svg
			width="200"
			height="100"
			viewBox="0 0 200 100"
			className={styles.miniGraph}
		>
			{/* Main line */}
			<line
				x1="20"
				y1="50"
				x2="180"
				y2="50"
				stroke="var(--branch-main)"
				strokeWidth="2"
			/>
			{/* Commits reordered */}
			<circle cx="40" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="80" cy="50" r="6" fill="var(--success-green)" />
			<circle cx="120" cy="50" r="6" fill="var(--branch-main)" />
			<circle cx="160" cy="50" r="6" fill="var(--branch-main)" />
			{/* Labels */}
			<text x="40" y="70" fontSize="10" fill="currentColor" textAnchor="middle">
				1
			</text>
			<text x="80" y="70" fontSize="10" fill="currentColor" textAnchor="middle">
				3'
			</text>
			<text
				x="120"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				2'
			</text>
			<text
				x="160"
				y="70"
				fontSize="10"
				fill="currentColor"
				textAnchor="middle"
			>
				4'
			</text>
		</svg>
	);
}

// ============================================================================
// Helper Components
// ============================================================================

interface OperationTypeIconProps {
	operation: GitOperation;
}

const OperationTypeIcon: React.FC<OperationTypeIconProps> = ({ operation }) => {
	const iconMap: Record<GitOperation, React.ReactNode> = {
		rebase: <RebaseIcon />,
		'cherry-pick': <CherryPickIcon />,
		merge: <MergeIcon />,
		'move-branch': <BranchIcon />,
		'create-branch': <CreateBranchIcon />,
		'reorder-commits': <ReorderIcon />,
		invalid: <ErrorIcon />,
	};

	return <span className={styles.operationTypeIcon}>{iconMap[operation]}</span>;
};

function formatOperationName(operation: GitOperation): string {
	const names: Record<GitOperation, string> = {
		rebase: 'Rebase',
		'cherry-pick': 'Cherry Pick',
		merge: 'Merge',
		'move-branch': 'Move Branch',
		'create-branch': 'Create Branch',
		'reorder-commits': 'Reorder Commits',
		invalid: 'Invalid Operation',
	};
	return names[operation];
}

// ============================================================================
// Icons
// ============================================================================

const CloseIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M12 4.7L11.3 4L8 7.3L4.7 4L4 4.7L7.3 8L4 11.3L4.7 12L8 8.7L11.3 12L12 11.3L8.7 8L12 4.7Z" />
	</svg>
);

const WarningIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path
			d="M7.56 1.46L.5 13.5a.5.5 0 00.44.75h14.12a.5.5 0 00.44-.75L8.44 1.46a.5.5 0 00-.88 0zM8 5v4M8 11v1"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			fill="none"
		/>
	</svg>
);

const ArrowRightIcon: React.FC = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
	</svg>
);

const LoadingSpinner: React.FC = () => (
	<svg
		className={styles.spinner}
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
	>
		<circle
			cx="8"
			cy="8"
			r="6"
			stroke="currentColor"
			strokeWidth="2"
			strokeOpacity="0.3"
		/>
		<path
			d="M8 2C4.69 2 2 4.69 2 8"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

// Operation icons
const RebaseIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path
			d="M4 5V11M10 5V7.5C10 8.5 9 9.5 7.5 9.5H6"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
		<circle cx="4" cy="3.5" r="1.5" />
		<circle cx="4" cy="12.5" r="1.5" />
		<circle cx="10" cy="3.5" r="1.5" />
	</svg>
);

const CherryPickIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<circle cx="8" cy="8" r="3" />
	</svg>
);

const MergeIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path
			d="M2 4V8C2 10 4 12 8 12M11 4V8C11 10 9 12 8 12V12"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
		<circle cx="2" cy="2.5" r="1.5" />
		<circle cx="11" cy="2.5" r="1.5" />
		<circle cx="8" cy="13.5" r="1.5" />
	</svg>
);

const BranchIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M11.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-8 11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
		<path
			d="M2 4V12M10 4V6C10 8 8 10 4 12"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
	</svg>
);

const CreateBranchIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M11.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-8 11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-11a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
		<path
			d="M2 4V12M10 4V6C10 8 8 10 4 12"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
		<path
			d="M12 7H15M13.5 5.5V8.5"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
	</svg>
);

const ReorderIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path
			d="M3 4H13M3 8H13M3 12H13"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
	</svg>
);

const ErrorIcon: React.FC = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM11.59 10.59L10.59 11.59L8 9L5.41 11.59L4.41 10.59L7 8L4.41 5.41L5.41 4.41L8 7L10.59 4.41L11.59 5.41L9 8L11.59 10.59Z" />
	</svg>
);

// ============================================================================
// Hook for managing preview state
// ============================================================================

export interface UseOperationPreviewReturn {
	isOpen: boolean;
	source: DragSource | null;
	target: DropTarget | null;
	operation: OperationInfo | null;
	showPreview: (
		source: DragSource,
		target: DropTarget,
		operation: OperationInfo,
	) => void;
	hidePreview: () => void;
	isExecuting: boolean;
	setExecuting: (value: boolean) => void;
}

export function useOperationPreview(): UseOperationPreviewReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [source, setSource] = useState<DragSource | null>(null);
	const [target, setTarget] = useState<DropTarget | null>(null);
	const [operation, setOperation] = useState<OperationInfo | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);

	const showPreview = useCallback(
		(
			newSource: DragSource,
			newTarget: DropTarget,
			newOperation: OperationInfo,
		) => {
			setSource(newSource);
			setTarget(newTarget);
			setOperation(newOperation);
			setIsOpen(true);
		},
		[],
	);

	const hidePreview = useCallback(() => {
		setIsOpen(false);
		setSource(null);
		setTarget(null);
		setOperation(null);
		setIsExecuting(false);
	}, []);

	return {
		isOpen,
		source,
		target,
		operation,
		showPreview,
		hidePreview,
		isExecuting,
		setExecuting: setIsExecuting,
	};
}

export default OperationPreview;
