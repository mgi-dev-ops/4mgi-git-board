import { useCallback, useState } from 'react';
import type { GitFileChange } from '../../stores/gitStore';
import { CommitDialog } from './CommitDialog';
import styles from './DiffSection.module.css';
import { FileRow } from './FileRow';

export interface DiffSectionProps {
	stagedFiles: GitFileChange[];
	unstagedFiles: GitFileChange[];
	onStageFile: (path: string) => void;
	onUnstageFile: (path: string) => void;
	onStageAll: () => void;
	onUnstageAll: () => void;
	onOpenFile: (path: string) => void;
	onCommit: (message: string, amend: boolean, workItemId?: string) => void;
	onDiscardChanges?: (paths: string[]) => void;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

type TabType = 'staged' | 'unstaged';

export function DiffSection({
	stagedFiles,
	unstagedFiles,
	onStageFile,
	onUnstageFile,
	onStageAll,
	onUnstageAll,
	onOpenFile,
	onCommit,
	onDiscardChanges,
	isCollapsed = false,
	onToggleCollapse,
}: DiffSectionProps) {
	const [activeTab, setActiveTab] = useState<TabType>('unstaged');
	const [selectedStaged, setSelectedStaged] = useState<Set<string>>(new Set());
	const [selectedUnstaged, setSelectedUnstaged] = useState<Set<string>>(
		new Set(),
	);
	const [showCommitDialog, setShowCommitDialog] = useState(false);
	const [isAmend, setIsAmend] = useState(false);

	const currentFiles = activeTab === 'staged' ? stagedFiles : unstagedFiles;
	const selectedFiles =
		activeTab === 'staged' ? selectedStaged : selectedUnstaged;
	const setSelectedFiles =
		activeTab === 'staged' ? setSelectedStaged : setSelectedUnstaged;

	const handleSelectFile = useCallback(
		(path: string, selected: boolean) => {
			setSelectedFiles((prev) => {
				const next = new Set(prev);
				if (selected) {
					next.add(path);
				} else {
					next.delete(path);
				}
				return next;
			});
		},
		[setSelectedFiles],
	);

	const handleSelectAll = useCallback(() => {
		if (selectedFiles.size === currentFiles.length) {
			setSelectedFiles(new Set());
		} else {
			setSelectedFiles(new Set(currentFiles.map((f) => f.path)));
		}
	}, [currentFiles, selectedFiles.size, setSelectedFiles]);

	const handleStageSelected = useCallback(() => {
		for (const path of selectedUnstaged) {
			onStageFile(path);
		}
		setSelectedUnstaged(new Set());
	}, [selectedUnstaged, onStageFile]);

	const handleUnstageSelected = useCallback(() => {
		for (const path of selectedStaged) {
			onUnstageFile(path);
		}
		setSelectedStaged(new Set());
	}, [selectedStaged, onUnstageFile]);

	const handleDiscardSelected = useCallback(() => {
		if (onDiscardChanges && selectedUnstaged.size > 0) {
			onDiscardChanges(Array.from(selectedUnstaged));
			setSelectedUnstaged(new Set());
		}
	}, [selectedUnstaged, onDiscardChanges]);

	const handleCommitClick = useCallback(() => {
		setIsAmend(false);
		setShowCommitDialog(true);
	}, []);

	const handleAmendClick = useCallback(() => {
		setIsAmend(true);
		setShowCommitDialog(true);
	}, []);

	const handleCommitSubmit = useCallback(
		(message: string, amend: boolean, workItemId?: string) => {
			onCommit(message, amend, workItemId);
			setShowCommitDialog(false);
		},
		[onCommit],
	);

	const handleCommitCancel = useCallback(() => {
		setShowCommitDialog(false);
	}, []);

	const totalChanges = stagedFiles.length + unstagedFiles.length;

	return (
		<div
			className={`${styles.diffSection} ${isCollapsed ? styles.collapsed : ''}`}
		>
			<button
				type="button"
				className={styles.header}
				onClick={onToggleCollapse}
			>
				<span className={styles.collapseIcon}>{isCollapsed ? '>' : 'v'}</span>
				<span className={styles.headerTitle}>Changes</span>
				<span className={styles.changeCount}>({totalChanges})</span>
			</button>

			{!isCollapsed && (
				<div className={styles.content}>
					<div className={styles.tabs} role="tablist">
						<button
							type="button"
							role="tab"
							className={`${styles.tab} ${activeTab === 'unstaged' ? styles.tabActive : ''}`}
							onClick={() => setActiveTab('unstaged')}
							aria-selected={activeTab === 'unstaged'}
						>
							Unstaged ({unstagedFiles.length})
						</button>
						<button
							type="button"
							role="tab"
							className={`${styles.tab} ${activeTab === 'staged' ? styles.tabActive : ''}`}
							onClick={() => setActiveTab('staged')}
							aria-selected={activeTab === 'staged'}
						>
							Staged ({stagedFiles.length})
						</button>
					</div>

					<div className={styles.toolbar}>
						<label className={styles.selectAllLabel}>
							<input
								type="checkbox"
								checked={
									selectedFiles.size === currentFiles.length &&
									currentFiles.length > 0
								}
								onChange={handleSelectAll}
								aria-label="Select all files"
							/>
							Select All
						</label>

						<div className={styles.toolbarActions}>
							{activeTab === 'unstaged' ? (
								<>
									<button
										type="button"
										className={styles.toolbarButton}
										onClick={handleStageSelected}
										disabled={selectedUnstaged.size === 0}
										title="Stage selected files"
									>
										Stage Selected
									</button>
									<button
										type="button"
										className={styles.toolbarButton}
										onClick={onStageAll}
										disabled={unstagedFiles.length === 0}
										title="Stage all files"
									>
										Stage All
									</button>
									{onDiscardChanges && (
										<button
											type="button"
											className={`${styles.toolbarButton} ${styles.dangerButton}`}
											onClick={handleDiscardSelected}
											disabled={selectedUnstaged.size === 0}
											title="Discard selected changes"
										>
											Discard
										</button>
									)}
								</>
							) : (
								<>
									<button
										type="button"
										className={styles.toolbarButton}
										onClick={handleUnstageSelected}
										disabled={selectedStaged.size === 0}
										title="Unstage selected files"
									>
										Unstage Selected
									</button>
									<button
										type="button"
										className={styles.toolbarButton}
										onClick={onUnstageAll}
										disabled={stagedFiles.length === 0}
										title="Unstage all files"
									>
										Unstage All
									</button>
								</>
							)}
						</div>
					</div>

					<div className={styles.fileList}>
						<div className={styles.fileListHeader}>
							<span className={styles.headerCell}>Status</span>
							<span className={styles.headerCell}>+lines</span>
							<span className={styles.headerCell}>-lines</span>
							<span className={styles.headerCellPath}>Filename</span>
							<span className={styles.headerCellActions}>Actions</span>
						</div>

						{currentFiles.length === 0 ? (
							<div className={styles.emptyState}>
								{activeTab === 'staged'
									? 'No staged changes'
									: 'No unstaged changes'}
							</div>
						) : (
							currentFiles.map((file) => (
								<FileRow
									key={file.path}
									file={file}
									selected={selectedFiles.has(file.path)}
									onSelect={handleSelectFile}
									onOpenFile={onOpenFile}
									onStage={activeTab === 'unstaged' ? onStageFile : undefined}
									onUnstage={activeTab === 'staged' ? onUnstageFile : undefined}
									isStaged={activeTab === 'staged'}
								/>
							))
						)}
					</div>

					<div className={styles.actions}>
						<button
							type="button"
							className={`${styles.actionButtonPrimary}`}
							onClick={handleCommitClick}
							disabled={stagedFiles.length === 0}
							title="Commit staged changes"
						>
							Commit
						</button>
						<button
							type="button"
							className={styles.actionButtonSecondary}
							onClick={handleAmendClick}
							title="Amend last commit"
						>
							Amend
						</button>
					</div>
				</div>
			)}

			{showCommitDialog && (
				<CommitDialog
					isAmend={isAmend}
					onCommit={handleCommitSubmit}
					onCancel={handleCommitCancel}
				/>
			)}
		</div>
	);
}

export default DiffSection;
