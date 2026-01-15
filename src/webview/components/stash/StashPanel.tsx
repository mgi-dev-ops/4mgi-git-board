import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GitStash } from '../../stores/gitStore';
import { useGitStore } from '../../stores/gitStore';
import {
	CreateStashDialog,
	type CreateStashOptions,
} from './CreateStashDialog';
import { StashContextMenu } from './StashContextMenu';
import { StashDiffView, type StashFileChange } from './StashDiffView';
import { StashList } from './StashList';
import styles from './StashPanel.module.css';

// ============================================================================
// Icons
// ============================================================================

const StashIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0113.25 12H9v1.5h1.75a.75.75 0 010 1.5h-5.5a.75.75 0 010-1.5H7V12H2.75A1.75 1.75 0 011 10.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H2.75z" />
	</svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
	</svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 3a5 5 0 104.546 2.914.75.75 0 011.364-.628A6.5 6.5 0 118 1.5v2A.75.75 0 018 3z" />
		<path d="M8 1a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 1z" />
		<path d="M5.22 3.22a.75.75 0 011.06 0L8 4.94l1.72-1.72a.75.75 0 111.06 1.06l-2.25 2.25a.75.75 0 01-1.06 0L5.22 4.28a.75.75 0 010-1.06z" />
	</svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" />
	</svg>
);

// ============================================================================
// Types
// ============================================================================

export interface StashPanelProps {
	variant?: 'panel' | 'dropdown';
	className?: string;
}

interface ContextMenuState {
	isOpen: boolean;
	position: { x: number; y: number };
	stash: GitStash | null;
}

interface DiffViewState {
	isOpen: boolean;
	stash: GitStash | null;
	files: StashFileChange[];
	selectedFile: StashFileChange | null;
	diffContent: string;
}

// ============================================================================
// Component
// ============================================================================

export function StashPanel({
	variant = 'panel',
	className = '',
}: StashPanelProps) {
	// Store
	const stashes = useGitStore((state) => state.stashes);
	const loading = useGitStore((state) => state.loading);
	const fetchStashes = useGitStore((state) => state.fetchStashes);
	const stashSave = useGitStore((state) => state.stashSave);
	const stashApply = useGitStore((state) => state.stashApply);
	const stashPop = useGitStore((state) => state.stashPop);
	const stashDrop = useGitStore((state) => state.stashDrop);
	const getStashFiles = useGitStore((state) => state.getStashFiles);
	const getStashDiff = useGitStore((state) => state.getStashDiff);

	// Local state
	const [selectedStash, setSelectedStash] = useState<GitStash | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		isOpen: false,
		position: { x: 0, y: 0 },
		stash: null,
	});
	const [diffView, setDiffView] = useState<DiffViewState>({
		isOpen: false,
		stash: null,
		files: [],
		selectedFile: null,
		diffContent: '',
	});

	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown on click outside
	useEffect(() => {
		if (variant !== 'dropdown' || !isDropdownOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [variant, isDropdownOpen]);

	// Handlers
	const handleRefresh = useCallback(() => {
		fetchStashes();
	}, [fetchStashes]);

	const handleSelectStash = useCallback((stash: GitStash) => {
		setSelectedStash(stash);
	}, []);

	const handleApplyStash = useCallback(
		(stash: GitStash) => {
			stashApply(stash.index);
		},
		[stashApply],
	);

	const handlePopStash = useCallback(
		(stash: GitStash) => {
			stashPop(stash.index);
		},
		[stashPop],
	);

	const handleDropStash = useCallback(
		(stash: GitStash) => {
			stashDrop(stash.index);
			if (selectedStash?.index === stash.index) {
				setSelectedStash(null);
			}
		},
		[stashDrop, selectedStash],
	);

	const handleViewStash = useCallback(
		(stash: GitStash) => {
			// Open diff view and fetch files
			setDiffView({
				isOpen: true,
				stash,
				files: [],
				selectedFile: null,
				diffContent: '',
			});
			// Request stash files from extension
			getStashFiles(stash.index);
		},
		[getStashFiles],
	);

	const handleCreateBranchFromStash = useCallback((stash: GitStash) => {
		// TODO: Implement create branch from stash
		console.log('Create branch from stash:', stash.index);
	}, []);

	const handleContextMenu = useCallback(
		(event: React.MouseEvent, stash: GitStash) => {
			event.preventDefault();
			setContextMenu({
				isOpen: true,
				position: { x: event.clientX, y: event.clientY },
				stash,
			});
		},
		[],
	);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const handleOpenCreateDialog = useCallback(() => {
		setIsCreateDialogOpen(true);
	}, []);

	const handleCloseCreateDialog = useCallback(() => {
		setIsCreateDialogOpen(false);
	}, []);

	const handleCreateStash = useCallback(
		(options: CreateStashOptions) => {
			stashSave(options.message, options.includeUntracked);
			setIsCreateDialogOpen(false);
		},
		[stashSave],
	);

	const handleCloseDiffView = useCallback(() => {
		setDiffView((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const handleSelectDiffFile = useCallback(
		(file: StashFileChange) => {
			setDiffView((prev) => {
				if (prev.stash) {
					// Request diff content from extension
					getStashDiff(prev.stash.index, file.path);
				}
				return {
					...prev,
					selectedFile: file,
					diffContent: 'Loading diff...',
				};
			});
		},
		[getStashDiff],
	);

	const handleDiffViewBack = useCallback(() => {
		setDiffView((prev) => ({
			...prev,
			selectedFile: null,
			diffContent: '',
		}));
	}, []);

	const toggleDropdown = useCallback(() => {
		setIsDropdownOpen((prev) => !prev);
	}, []);

	// Render dropdown variant
	if (variant === 'dropdown') {
		return (
			<div className={`${styles.stashDropdown} ${className}`} ref={dropdownRef}>
				<button
					type="button"
					className={styles.dropdownTrigger}
					onClick={toggleDropdown}
					aria-expanded={isDropdownOpen}
					aria-haspopup="true"
				>
					<StashIcon className={styles.dropdownTriggerIcon} />
					<span>Stash</span>
					{stashes.length > 0 && (
						<span className={styles.dropdownTriggerBadge}>
							{stashes.length}
						</span>
					)}
					<ChevronDownIcon className={styles.dropdownTriggerIcon} />
				</button>

				{isDropdownOpen && (
					<div className={styles.dropdownMenu}>
						<div className={styles.dropdownHeader}>
							<span className={styles.dropdownTitle}>
								Stashes ({stashes.length})
							</span>
							<div className={styles.panelActions}>
								<button
									type="button"
									className={styles.iconButton}
									onClick={handleOpenCreateDialog}
									title="Create stash"
									aria-label="Create stash"
								>
									<PlusIcon />
								</button>
								<button
									type="button"
									className={styles.iconButton}
									onClick={handleRefresh}
									title="Refresh stashes"
									aria-label="Refresh stashes"
								>
									<RefreshIcon />
								</button>
							</div>
						</div>

						{loading ? (
							<div className={styles.loading}>
								<div className={styles.spinner} />
							</div>
						) : (
							<StashList
								stashes={stashes}
								selectedStash={selectedStash}
								onSelectStash={handleSelectStash}
								onApplyStash={handleApplyStash}
								onPopStash={handlePopStash}
								onDropStash={handleDropStash}
								onViewStash={handleViewStash}
								onContextMenu={handleContextMenu}
							/>
						)}
					</div>
				)}

				<CreateStashDialog
					isOpen={isCreateDialogOpen}
					onClose={handleCloseCreateDialog}
					onCreateStash={handleCreateStash}
					loading={loading}
				/>

				{contextMenu.isOpen && contextMenu.stash && (
					<StashContextMenu
						stash={contextMenu.stash}
						position={contextMenu.position}
						onClose={handleCloseContextMenu}
						onApply={handleApplyStash}
						onPop={handlePopStash}
						onDrop={handleDropStash}
						onViewDiff={handleViewStash}
						onCreateBranch={handleCreateBranchFromStash}
					/>
				)}
			</div>
		);
	}

	// Render panel variant (default)
	return (
		<div className={`${styles.stashPanel} ${className}`}>
			{diffView.isOpen && diffView.stash ? (
				<StashDiffView
					stash={diffView.stash}
					files={diffView.files}
					selectedFile={diffView.selectedFile}
					diffContent={diffView.diffContent}
					loading={loading}
					onClose={handleCloseDiffView}
					onSelectFile={handleSelectDiffFile}
					onBack={handleDiffViewBack}
				/>
			) : (
				<>
					<div className={styles.panelHeader}>
						<div className={styles.panelTitle}>
							<StashIcon />
							<span>Stashes</span>
							{stashes.length > 0 && (
								<span className={styles.stashCount}>{stashes.length}</span>
							)}
						</div>
						<div className={styles.panelActions}>
							<button
								type="button"
								className={styles.iconButton}
								onClick={handleOpenCreateDialog}
								title="Create stash"
								aria-label="Create stash"
							>
								<PlusIcon />
							</button>
							<button
								type="button"
								className={styles.iconButton}
								onClick={handleRefresh}
								title="Refresh stashes"
								aria-label="Refresh stashes"
							>
								<RefreshIcon />
							</button>
						</div>
					</div>

					<div className={styles.panelContent}>
						{loading ? (
							<div className={styles.loading}>
								<div className={styles.spinner} />
							</div>
						) : (
							<StashList
								stashes={stashes}
								selectedStash={selectedStash}
								onSelectStash={handleSelectStash}
								onApplyStash={handleApplyStash}
								onPopStash={handlePopStash}
								onDropStash={handleDropStash}
								onViewStash={handleViewStash}
								onContextMenu={handleContextMenu}
							/>
						)}
					</div>
				</>
			)}

			<CreateStashDialog
				isOpen={isCreateDialogOpen}
				onClose={handleCloseCreateDialog}
				onCreateStash={handleCreateStash}
				loading={loading}
			/>

			{contextMenu.isOpen && contextMenu.stash && (
				<StashContextMenu
					stash={contextMenu.stash}
					position={contextMenu.position}
					onClose={handleCloseContextMenu}
					onApply={handleApplyStash}
					onPop={handlePopStash}
					onDrop={handleDropStash}
					onViewDiff={handleViewStash}
					onCreateBranch={handleCreateBranchFromStash}
				/>
			)}
		</div>
	);
}

export default StashPanel;
