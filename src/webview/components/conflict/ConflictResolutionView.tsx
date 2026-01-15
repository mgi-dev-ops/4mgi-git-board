/**
 * ConflictResolutionView - Main modal/panel for conflict resolution
 * Displays conflict information, file list, and resolution actions
 */

import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ConflictActions, type ConflictOperation } from './ConflictActions';
import { type ConflictedFileInfo, ConflictFileList } from './ConflictFileList';
import styles from './ConflictResolutionView.module.css';
import { type ConflictHunkDisplay, ThreeWayDiff } from './ThreeWayDiff';

/**
 * Conflict state passed to the view
 */
export interface ConflictStateInfo {
	operation: ConflictOperation;
	files: ConflictedFileInfo[];
	currentCommit?: string;
	currentCommitMessage?: string;
	sourceBranch?: string;
	targetBranch?: string;
	progress?: {
		current: number;
		total: number;
	};
}

/**
 * Three-way diff data for a file
 */
export interface ThreeWayDiffData {
	base: string;
	ours: string;
	theirs: string;
	hunks: ConflictHunkDisplay[];
}

/**
 * Props for ConflictResolutionView component
 */
export interface ConflictResolutionViewProps {
	conflictState: ConflictStateInfo;
	isOpen: boolean;
	loading?: boolean;
	selectedFileDiff?: ThreeWayDiffData;
	onClose: () => void;
	onFileClick?: (file: ConflictedFileInfo) => void;
	onResolveClick?: (file: ConflictedFileInfo) => void;
	onAbort: () => void;
	onContinue: () => void;
	onSkip?: () => void;
	onMarkResolved?: (file: ConflictedFileInfo) => void;
	onAcceptOurs?: (fileInfo: ConflictedFileInfo, hunkId: string) => void;
	onAcceptTheirs?: (fileInfo: ConflictedFileInfo, hunkId: string) => void;
	onAcceptBoth?: (fileInfo: ConflictedFileInfo, hunkId: string) => void;
	onManualEdit?: (fileInfo: ConflictedFileInfo, hunkId: string) => void;
}

/**
 * Get header title based on operation type
 */
const getHeaderTitle = (operation: ConflictOperation): string => {
	switch (operation) {
		case 'merge':
			return 'MERGE CONFLICT';
		case 'rebase':
			return 'REBASE CONFLICT';
		case 'cherryPick':
			return 'CHERRY-PICK CONFLICT';
		case 'revert':
			return 'REVERT CONFLICT';
		default:
			return 'CONFLICT';
	}
};

/**
 * CloseIcon component
 */
const CloseIcon: React.FC = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M12 4L4 12M4 4L12 12"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

/**
 * ConflictResolutionView component
 * Main modal for resolving git conflicts
 */
export const ConflictResolutionView: React.FC<ConflictResolutionViewProps> = ({
	conflictState,
	isOpen,
	loading = false,
	selectedFileDiff,
	onClose,
	onFileClick,
	onResolveClick,
	onAbort,
	onContinue,
	onSkip,
	onMarkResolved,
	onAcceptOurs,
	onAcceptTheirs,
	onAcceptBoth,
	onManualEdit,
}) => {
	const [selectedFile, setSelectedFile] = useState<ConflictedFileInfo | null>(
		null,
	);

	// Calculate if all files are resolved
	const allFilesResolved = useMemo(() => {
		return conflictState.files.every((file) => file.resolved);
	}, [conflictState.files]);

	// Count resolved files
	const resolvedCount = useMemo(() => {
		return conflictState.files.filter((file) => file.resolved).length;
	}, [conflictState.files]);

	// Handle file click
	const handleFileClick = useCallback(
		(file: ConflictedFileInfo) => {
			setSelectedFile(file);
			if (onFileClick) {
				onFileClick(file);
			}
		},
		[onFileClick],
	);

	// Handle resolve click
	const handleResolveClick = useCallback(
		(file: ConflictedFileInfo) => {
			setSelectedFile(file);
			if (onResolveClick) {
				onResolveClick(file);
			}
		},
		[onResolveClick],
	);

	// Handle mark as resolved for current file
	const handleMarkResolved = useCallback(() => {
		if (selectedFile && onMarkResolved) {
			onMarkResolved(selectedFile);
		}
	}, [selectedFile, onMarkResolved]);

	// Handle hunk actions with file context
	const handleAcceptOurs = useCallback(
		(hunkId: string) => {
			if (selectedFile && onAcceptOurs) {
				onAcceptOurs(selectedFile, hunkId);
			}
		},
		[selectedFile, onAcceptOurs],
	);

	const handleAcceptTheirs = useCallback(
		(hunkId: string) => {
			if (selectedFile && onAcceptTheirs) {
				onAcceptTheirs(selectedFile, hunkId);
			}
		},
		[selectedFile, onAcceptTheirs],
	);

	const handleAcceptBoth = useCallback(
		(hunkId: string) => {
			if (selectedFile && onAcceptBoth) {
				onAcceptBoth(selectedFile, hunkId);
			}
		},
		[selectedFile, onAcceptBoth],
	);

	const handleManualEdit = useCallback(
		(hunkId: string) => {
			if (selectedFile && onManualEdit) {
				onManualEdit(selectedFile, hunkId);
			}
		},
		[selectedFile, onManualEdit],
	);

	// Handle escape key to close
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		},
		[onClose],
	);

	if (!isOpen) {
		return null;
	}

	const { operation, currentCommit, currentCommitMessage, progress, files } =
		conflictState;

	return (
		<div
			className={styles.overlay}
			onClick={onClose}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="conflict-dialog-title"
		>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="document"
			>
				{/* Header */}
				<div className={styles.header}>
					<div className={styles.headerLeft}>
						<span
							className={styles.warningIcon}
							role="img"
							aria-label="Warning"
						>
							{'\u26A0\uFE0F'}
						</span>
						<h2 id="conflict-dialog-title" className={styles.headerTitle}>
							{getHeaderTitle(operation)}
						</h2>
					</div>
					<button
						type="button"
						className={styles.closeButton}
						onClick={onClose}
						aria-label="Close"
						title="Close"
					>
						<CloseIcon />
					</button>
				</div>

				{/* Content */}
				<div className={styles.content}>
					{/* Conflict Info */}
					<div className={styles.conflictInfo}>
						{currentCommit && (
							<div className={styles.conflictInfoRow}>
								<span className={styles.conflictInfoLabel}>
									Conflict in commit:
								</span>
								<span className={styles.conflictInfoValue}>
									<span className={styles.commitSha}>{currentCommit}</span>
									{currentCommitMessage && ` (${currentCommitMessage})`}
								</span>
							</div>
						)}

						{progress && (
							<div className={styles.conflictInfoRow}>
								<span className={styles.conflictInfoLabel}>Progress:</span>
								<span className={styles.conflictInfoValue}>
									{progress.current}/{progress.total} commits applied
								</span>
							</div>
						)}

						<div className={styles.conflictInfoRow}>
							<span className={styles.conflictInfoLabel}>Files:</span>
							<span className={styles.conflictInfoValue}>
								{resolvedCount}/{files.length} resolved
							</span>
						</div>

						{progress && (
							<div className={styles.progressBar}>
								<div
									className={styles.progressFill}
									style={{
										width: `${(progress.current / progress.total) * 100}%`,
									}}
								/>
							</div>
						)}
					</div>

					{/* Loading state */}
					{loading && (
						<div className={styles.loading}>
							<div className={styles.loadingSpinner} />
							<span>Loading...</span>
						</div>
					)}

					{/* File List */}
					{!loading && !selectedFileDiff && (
						<ConflictFileList
							files={files}
							onFileClick={handleFileClick}
							onResolveClick={handleResolveClick}
						/>
					)}

					{/* Three-way Diff View */}
					{!loading && selectedFileDiff && (
						<ThreeWayDiff
							baseContent={selectedFileDiff.base}
							oursContent={selectedFileDiff.ours}
							theirsContent={selectedFileDiff.theirs}
							hunks={selectedFileDiff.hunks}
							onAcceptOurs={handleAcceptOurs}
							onAcceptTheirs={handleAcceptTheirs}
							onAcceptBoth={handleAcceptBoth}
							onManualEdit={handleManualEdit}
						/>
					)}
				</div>

				{/* Footer Actions */}
				<ConflictActions
					operation={operation}
					canContinue={allFilesResolved}
					loading={loading}
					onAbort={onAbort}
					onContinue={onContinue}
					onSkip={operation === 'rebase' ? onSkip : undefined}
					onMarkResolved={selectedFile ? handleMarkResolved : undefined}
				/>
			</div>
		</div>
	);
};

export default ConflictResolutionView;
