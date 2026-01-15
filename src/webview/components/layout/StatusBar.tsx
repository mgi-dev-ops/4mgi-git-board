import styles from './StatusBar.module.css';

export interface StatusBarProps {
	currentBranch: string;
	ahead: number;
	behind: number;
	isSynced: boolean;
	isLoading?: boolean;
	lastFetched?: Date;
	totalCommits?: number;
	onSync?: () => void;
	onBranchClick?: () => void;
}

export function StatusBar({
	currentBranch,
	ahead,
	behind,
	isSynced,
	isLoading = false,
	lastFetched,
	totalCommits,
	onSync,
	onBranchClick,
}: StatusBarProps) {
	const getSyncStatusIcon = () => {
		if (isLoading) return '⟳';
		if (isSynced && ahead === 0 && behind === 0) return '✓';
		if (ahead > 0 && behind > 0) return '⇅';
		if (ahead > 0) return '↑';
		if (behind > 0) return '↓';
		return '○';
	};

	const getSyncStatusText = () => {
		if (isLoading) return 'Syncing...';
		if (isSynced && ahead === 0 && behind === 0) return 'Up to date';

		const parts: string[] = [];
		if (ahead > 0) parts.push(`${ahead} ahead`);
		if (behind > 0) parts.push(`${behind} behind`);

		return parts.length > 0 ? parts.join(', ') : 'Unknown status';
	};

	const getSyncStatusClass = () => {
		if (isLoading) return styles.statusLoading;
		if (isSynced && ahead === 0 && behind === 0) return styles.statusSynced;
		if (behind > 0) return styles.statusBehind;
		if (ahead > 0) return styles.statusAhead;
		return '';
	};

	const formatLastFetched = (date: Date) => {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		return date.toLocaleDateString();
	};

	return (
		<div className={styles.statusBar} role="status" aria-live="polite">
			{/* Current Branch */}
			<button
				type="button"
				className={styles.branchIndicator}
				onClick={onBranchClick}
				title={`Current branch: ${currentBranch}`}
				aria-label={`Current branch: ${currentBranch}`}
			>
				<span className={styles.branchIcon} aria-hidden="true">
					●
				</span>
				<span className={styles.branchName}>{currentBranch}</span>
			</button>

			{/* Sync Status */}
			<div className={`${styles.syncStatus} ${getSyncStatusClass()}`}>
				<span
					className={`${styles.syncIcon} ${isLoading ? styles.syncIconLoading : ''}`}
					aria-hidden="true"
				>
					{getSyncStatusIcon()}
				</span>
				<span className={styles.syncText}>{getSyncStatusText()}</span>
				{(ahead > 0 || behind > 0) && !isLoading && (
					<button
						type="button"
						className={styles.syncButton}
						onClick={onSync}
						title="Sync with remote"
						aria-label="Sync with remote"
					>
						Sync
					</button>
				)}
			</div>

			{/* Commits Count */}
			{totalCommits !== undefined && totalCommits > 0 && (
				<div className={styles.commitCount}>
					<span className={styles.commitIcon} aria-hidden="true">
						○
					</span>
					<span>{totalCommits} commit(s)</span>
				</div>
			)}

			{/* Spacer */}
			<div className={styles.spacer} />

			{/* Last Fetched */}
			{lastFetched && (
				<div
					className={styles.lastFetched}
					title={lastFetched.toLocaleString()}
				>
					<span className={styles.lastFetchedLabel}>Last fetched:</span>
					<span className={styles.lastFetchedTime}>
						{formatLastFetched(lastFetched)}
					</span>
				</div>
			)}
		</div>
	);
}

export default StatusBar;
