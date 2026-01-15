import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommitRow } from './CommitRow';
import styles from './InteractiveRebaseView.module.css';
import { RebaseConflict } from './RebaseConflict';
import { RebasePreview } from './RebasePreview';
import { RebaseProgress } from './RebaseProgress';
import { RewordDialog } from './RewordDialog';
import { SquashMessageEditor } from './SquashMessageEditor';
import type { ConflictInfo, RebaseAction, RebaseCommit } from './types';
import { KEYBOARD_SHORTCUTS } from './types';

export interface InteractiveRebaseViewProps {
	/** Target branch to rebase onto */
	ontoBranch: string;
	/** Target commit SHA (short) */
	ontoSha: string;
	/** Initial commits to rebase */
	initialCommits: RebaseCommit[];
	/** Whether to use simplified labels */
	simplifiedLabels?: boolean;
	/** Callback when rebase is started */
	onStartRebase: (commits: RebaseCommit[]) => void;
	/** Callback when rebase is cancelled */
	onCancel: () => void;
	/** Callback when close button is clicked */
	onClose: () => void;
	/** Callback when rebase is aborted */
	onAbort?: () => void;
	/** Callback when conflict commit is skipped */
	onSkipCommit?: () => void;
	/** Callback when rebase continues after conflict resolution */
	onContinue?: () => void;
	/** Callback to resolve a file */
	onResolveFile?: (path: string) => void;
	/** Current conflict info (if any) */
	conflictInfo?: ConflictInfo | null;
	/** Whether rebase is currently executing */
	isExecuting?: boolean;
	/** Current execution progress */
	executionProgress?: {
		current: number;
		total: number;
		completedShas: string[];
		currentSha: string | null;
	};
}

/**
 * Interactive Rebase View - Full-screen modal for interactive rebase
 * Based on docs/04-UI-UX-DESIGN.md section 2.2
 */
export function InteractiveRebaseView({
	ontoBranch,
	ontoSha,
	initialCommits,
	simplifiedLabels = false,
	onStartRebase,
	onCancel,
	onClose,
	onAbort,
	onSkipCommit,
	onContinue,
	onResolveFile,
	conflictInfo,
	isExecuting = false,
	executionProgress,
}: InteractiveRebaseViewProps): React.ReactElement {
	// State management
	const [commits, setCommits] = useState<RebaseCommit[]>(initialCommits);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

	// Dialog states
	const [rewordDialogOpen, setRewordDialogOpen] = useState(false);
	const [rewordCommitIndex, setRewordCommitIndex] = useState<number | null>(
		null,
	);
	const [squashEditorOpen, setSquashEditorOpen] = useState(false);
	const [squashCommits, setSquashCommits] = useState<RebaseCommit[]>([]);

	// Refs
	const containerRef = useRef<HTMLDivElement>(null);
	const commitListRef = useRef<HTMLDivElement>(null);

	// Calculate warning message
	const warningMessage = useMemo(() => {
		const _nonDropCommits = commits.filter((c) => c.action !== 'drop').length;
		const hasSquashOrFixup = commits.some(
			(c) => c.action === 'squash' || c.action === 'fixup',
		);

		let message = `This will rewrite ${commits.length} commits.`;
		if (hasSquashOrFixup) {
			message += ' Some commits will be combined.';
		}
		message += ' Force push may be required.';
		return message;
	}, [commits]);

	// Handle action change for a commit
	const handleActionChange = useCallback(
		(index: number, action: RebaseAction) => {
			setCommits((prev) => {
				const newCommits = [...prev];
				newCommits[index] = { ...newCommits[index], action };
				return newCommits;
			});
		},
		[],
	);

	// Handle commit reorder via drag and drop
	const handleDragStart = useCallback((index: number) => {
		setDraggedIndex(index);
	}, []);

	const handleDragOver = useCallback(
		(index: number) => {
			if (draggedIndex !== null && draggedIndex !== index) {
				setDropTargetIndex(index);
			}
		},
		[draggedIndex],
	);

	const handleDragEnd = useCallback(() => {
		if (
			draggedIndex !== null &&
			dropTargetIndex !== null &&
			draggedIndex !== dropTargetIndex
		) {
			setCommits((prev) => {
				const newCommits = [...prev];
				const [removed] = newCommits.splice(draggedIndex, 1);
				newCommits.splice(dropTargetIndex, 0, removed);
				return newCommits;
			});
			setSelectedIndex(dropTargetIndex);
		}
		setDraggedIndex(null);
		setDropTargetIndex(null);
	}, [draggedIndex, dropTargetIndex]);

	// Handle commit move via keyboard
	const moveCommit = useCallback(
		(direction: 'up' | 'down') => {
			const newIndex =
				direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
			if (newIndex < 0 || newIndex >= commits.length) return;

			setCommits((prev) => {
				const newCommits = [...prev];
				const temp = newCommits[selectedIndex];
				newCommits[selectedIndex] = newCommits[newIndex];
				newCommits[newIndex] = temp;
				return newCommits;
			});
			setSelectedIndex(newIndex);
		},
		[selectedIndex, commits.length],
	);

	// Handle SHA copy
	const handleCopySha = useCallback((sha: string) => {
		navigator.clipboard.writeText(sha);
	}, []);

	// Handle double-click to edit message
	const handleEditMessage = useCallback(
		(index: number) => {
			const commit = commits[index];
			if (commit.action === 'reword' || commit.action === 'pick') {
				setRewordCommitIndex(index);
				setRewordDialogOpen(true);
			}
		},
		[commits],
	);

	// Handle reword dialog save
	const handleRewordSave = useCallback(
		(message: string) => {
			if (rewordCommitIndex !== null) {
				setCommits((prev) => {
					const newCommits = [...prev];
					newCommits[rewordCommitIndex] = {
						...newCommits[rewordCommitIndex],
						message,
						action: 'reword',
					};
					return newCommits;
				});
			}
			setRewordDialogOpen(false);
			setRewordCommitIndex(null);
		},
		[rewordCommitIndex],
	);

	// Handle start rebase
	const handleStartRebase = useCallback(() => {
		// Check for squash commits and open squash editor if needed
		const squashGroup: RebaseCommit[] = [];
		let hasSquash = false;

		for (const commit of commits) {
			if (commit.action === 'squash' || commit.action === 'fixup') {
				squashGroup.push(commit);
				hasSquash = true;
			} else if (squashGroup.length > 0) {
				break;
			}
		}

		if (hasSquash && squashGroup.length > 0) {
			// Find the commit being squashed into
			const squashIntoIndex = commits.findIndex(
				(c) => c.action !== 'squash' && c.action !== 'fixup',
			);
			if (squashIntoIndex >= 0) {
				setSquashCommits([commits[squashIntoIndex], ...squashGroup]);
				setSquashEditorOpen(true);
				return;
			}
		}

		onStartRebase(commits);
	}, [commits, onStartRebase]);

	// Handle squash editor save
	const handleSquashSave = useCallback(
		(message: string) => {
			// Update the first commit's message and continue rebase
			setCommits((prev) => {
				const newCommits = [...prev];
				const firstNonSquash = newCommits.findIndex(
					(c) => c.action !== 'squash' && c.action !== 'fixup',
				);
				if (firstNonSquash >= 0) {
					newCommits[firstNonSquash] = {
						...newCommits[firstNonSquash],
						message,
					};
				}
				return newCommits;
			});
			setSquashEditorOpen(false);
			onStartRebase(commits);
		},
		[commits, onStartRebase],
	);

	// Keyboard event handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if dialog is open or input is focused
			if (rewordDialogOpen || squashEditorOpen) return;
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			const key = e.key.toLowerCase();
			const isCtrl = e.ctrlKey || e.metaKey;

			// Navigation
			if (key === 'arrowup' && !isCtrl) {
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(0, prev - 1));
				return;
			}
			if (key === 'arrowdown' && !isCtrl) {
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(commits.length - 1, prev + 1));
				return;
			}

			// Move commit up/down
			if (key === 'arrowup' && isCtrl) {
				e.preventDefault();
				moveCommit('up');
				return;
			}
			if (key === 'arrowdown' && isCtrl) {
				e.preventDefault();
				moveCommit('down');
				return;
			}

			// Action shortcuts
			if (key === KEYBOARD_SHORTCUTS.pick) {
				handleActionChange(selectedIndex, 'pick');
				return;
			}
			if (key === KEYBOARD_SHORTCUTS.reword) {
				handleActionChange(selectedIndex, 'reword');
				return;
			}
			if (key === KEYBOARD_SHORTCUTS.edit) {
				handleActionChange(selectedIndex, 'edit');
				return;
			}
			if (key === KEYBOARD_SHORTCUTS.squash) {
				handleActionChange(selectedIndex, 'squash');
				return;
			}
			if (key === KEYBOARD_SHORTCUTS.fixup) {
				handleActionChange(selectedIndex, 'fixup');
				return;
			}
			if (key === KEYBOARD_SHORTCUTS.drop) {
				handleActionChange(selectedIndex, 'drop');
				return;
			}

			// Edit message
			if (key === 'enter' && !isCtrl) {
				e.preventDefault();
				handleEditMessage(selectedIndex);
				return;
			}

			// Start rebase
			if (key === 'enter' && isCtrl) {
				e.preventDefault();
				handleStartRebase();
				return;
			}

			// Cancel
			if (key === 'escape') {
				e.preventDefault();
				onCancel();
				return;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [
		commits.length,
		selectedIndex,
		rewordDialogOpen,
		squashEditorOpen,
		handleActionChange,
		handleEditMessage,
		handleStartRebase,
		moveCommit,
		onCancel,
	]);

	// Scroll selected commit into view
	useEffect(() => {
		if (commitListRef.current) {
			const selectedRow = commitListRef.current.querySelector(
				`[data-index="${selectedIndex}"]`,
			);
			if (selectedRow) {
				selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}, [selectedIndex]);

	// Render conflict view if there's a conflict
	if (conflictInfo) {
		return (
			<div className={styles.container} ref={containerRef}>
				<RebaseConflict
					commitSha={conflictInfo.commitSha}
					commitMessage={conflictInfo.commitMessage}
					files={conflictInfo.files}
					progress={{
						current: executionProgress?.current || 0,
						total: executionProgress?.total || commits.length,
					}}
					onAbort={onAbort || (() => {})}
					onSkip={onSkipCommit || (() => {})}
					onContinue={onContinue || (() => {})}
					onResolveFile={onResolveFile || (() => {})}
					onClose={onClose}
				/>
			</div>
		);
	}

	// Render progress view if executing
	if (isExecuting && executionProgress) {
		return (
			<div className={styles.container} ref={containerRef}>
				<RebaseProgress
					current={executionProgress.current}
					total={executionProgress.total}
					commits={commits.map((commit) => ({
						sha: commit.shortSha,
						message: commit.message,
						status: executionProgress.completedShas.includes(commit.sha)
							? 'completed'
							: executionProgress.currentSha === commit.sha
								? 'in_progress'
								: commit.action === 'drop'
									? 'dropped'
									: 'pending',
					}))}
					onClose={onClose}
				/>
			</div>
		);
	}

	return (
		<div className={styles.container} ref={containerRef}>
			{/* Header */}
			<header className={styles.header}>
				<h1 className={styles.title}>INTERACTIVE REBASE</h1>
				<button
					type="button"
					className={styles.closeButton}
					onClick={onClose}
					title="Close"
					aria-label="Close"
				>
					&times;
				</button>
			</header>

			{/* Onto info */}
			<div className={styles.ontoInfo}>
				Rebasing onto: <strong>{ontoBranch}</strong> ({ontoSha})
			</div>

			{/* Main content */}
			<div className={styles.content}>
				{/* Commit list section */}
				<section className={styles.commitListSection}>
					<div className={styles.sectionHeader}>COMMIT LIST</div>
					<div className={styles.commitList} ref={commitListRef}>
						{commits.map((commit, index) => (
							<CommitRow
								key={commit.sha}
								commit={commit}
								index={index}
								isSelected={index === selectedIndex}
								isDragging={index === draggedIndex}
								isDropTarget={index === dropTargetIndex}
								simplifiedLabels={simplifiedLabels}
								onSelect={() => setSelectedIndex(index)}
								onActionChange={(action) => handleActionChange(index, action)}
								onDragStart={() => handleDragStart(index)}
								onDragOver={() => handleDragOver(index)}
								onDragEnd={handleDragEnd}
								onCopySha={() => handleCopySha(commit.sha)}
								onDoubleClick={() => handleEditMessage(index)}
								data-index={index}
							/>
						))}
					</div>
				</section>

				{/* Preview section */}
				<RebasePreview commits={commits} />
			</div>

			{/* Warning message */}
			<div className={styles.warning}>
				<span className={styles.warningIcon}>&#9888;&#65039;</span>
				{warningMessage}
			</div>

			{/* Action buttons */}
			<footer className={styles.footer}>
				<button
					type="button"
					className={styles.cancelButton}
					onClick={onCancel}
					title="Cancel (Escape)"
				>
					Cancel
				</button>
				<button
					type="button"
					className={styles.startButton}
					onClick={handleStartRebase}
					title="Start Rebase (Ctrl+Enter)"
				>
					Start Rebase
				</button>
			</footer>

			{/* Reword Dialog */}
			{rewordDialogOpen && rewordCommitIndex !== null && (
				<RewordDialog
					commit={commits[rewordCommitIndex]}
					onSave={handleRewordSave}
					onCancel={() => {
						setRewordDialogOpen(false);
						setRewordCommitIndex(null);
					}}
				/>
			)}

			{/* Squash Message Editor */}
			{squashEditorOpen && squashCommits.length > 0 && (
				<SquashMessageEditor
					commits={squashCommits}
					onSave={handleSquashSave}
					onAbort={() => {
						setSquashEditorOpen(false);
						onCancel();
					}}
				/>
			)}
		</div>
	);
}

export default InteractiveRebaseView;
