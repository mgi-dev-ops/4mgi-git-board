import { useState } from 'react';
import styles from './DetailPanel.module.css';
import type { FileChange, SelectedCommit } from './Layout';

export interface DetailPanelProps {
	commit: SelectedCommit;
	onClose: () => void;
	onViewFullDiff?: () => void;
	onCherryPick?: (sha: string) => void;
	onCopySha?: (sha: string) => void;
	onFileClick?: (file: FileChange) => void;
	onParentClick?: (parentSha: string) => void;
}

export function DetailPanel({
	commit,
	onClose,
	onViewFullDiff,
	onCherryPick,
	onCopySha,
	onFileClick,
	onParentClick,
}: DetailPanelProps) {
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [copiedSha, setCopiedSha] = useState(false);

	const handleCopySha = () => {
		navigator.clipboard.writeText(commit.sha).then(() => {
			setCopiedSha(true);
			setTimeout(() => setCopiedSha(false), 2000);
			onCopySha?.(commit.sha);
		});
	};

	const handleFileToggle = (filePath: string) => {
		const newSelected = new Set(selectedFiles);
		if (newSelected.has(filePath)) {
			newSelected.delete(filePath);
		} else {
			newSelected.add(filePath);
		}
		setSelectedFiles(newSelected);
	};

	const handleSelectAllFiles = () => {
		if (selectedFiles.size === commit.filesChanged.length) {
			setSelectedFiles(new Set());
		} else {
			setSelectedFiles(new Set(commit.filesChanged.map((f) => f.path)));
		}
	};

	const getFileStatusClass = (status: FileChange['status']) => {
		switch (status) {
			case 'added':
				return styles.fileAdded;
			case 'modified':
				return styles.fileModified;
			case 'deleted':
				return styles.fileDeleted;
			case 'renamed':
				return styles.fileRenamed;
			default:
				return '';
		}
	};

	const getFileStatusIcon = (status: FileChange['status']) => {
		switch (status) {
			case 'added':
				return 'A';
			case 'modified':
				return 'M';
			case 'deleted':
				return 'D';
			case 'renamed':
				return 'R';
			default:
				return '?';
		}
	};

	const formatDate = (date: Date) => {
		return date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
		});
	};

	return (
		<div className={styles.detailPanel}>
			{/* Header with close button */}
			<div className={styles.header}>
				<h3 className={styles.headerTitle}>Commit Details</h3>
				<button
					type="button"
					className={styles.closeButton}
					onClick={onClose}
					aria-label="Close detail panel"
				>
					×
				</button>
			</div>

			{/* Branch Tags */}
			{(commit.branches.length > 0 || commit.tags.length > 0) && (
				<div className={styles.section}>
					<div className={styles.sectionLabel}>BRANCH TAGS</div>
					<div className={styles.tagContainer}>
						{commit.branches.map((branch) => (
							<span key={branch} className={styles.branchTag}>
								{branch}
							</span>
						))}
						{commit.tags.map((tag) => (
							<span key={tag} className={styles.tagTag}>
								{tag}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Title */}
			<div className={styles.section}>
				<div className={styles.sectionLabel}>TITLE</div>
				<div className={styles.commitTitle}>{commit.message}</div>
			</div>

			{/* Description */}
			{commit.description && (
				<div className={styles.section}>
					<div className={styles.sectionLabel}>DESCRIPTION</div>
					<pre className={styles.commitDescription}>{commit.description}</pre>
				</div>
			)}

			{/* Author */}
			<div className={styles.section}>
				<div className={styles.sectionLabel}>AUTHOR</div>
				<div className={styles.authorInfo}>
					<span className={styles.authorIcon} aria-hidden="true">
						👤
					</span>
					<div className={styles.authorDetails}>
						<span className={styles.authorName}>{commit.author}</span>
						<span className={styles.authorEmail}>{commit.email}</span>
					</div>
				</div>
			</div>

			{/* Date */}
			<div className={styles.section}>
				<div className={styles.sectionLabel}>DATE</div>
				<div className={styles.dateInfo}>
					<span className={styles.dateIcon} aria-hidden="true">
						📅
					</span>
					<div className={styles.dateDetails}>
						<span className={styles.relativeDate}>{commit.relativeDate}</span>
						<span className={styles.absoluteDate}>
							{formatDate(commit.date)}
						</span>
					</div>
				</div>
			</div>

			{/* SHA */}
			<div className={styles.section}>
				<div className={styles.sectionLabel}>HEAD</div>
				<div className={styles.shaContainer}>
					<span className={styles.shaIcon} aria-hidden="true">
						🔗
					</span>
					<code
						className={styles.sha}
						onClick={handleCopySha}
						title="Click to copy"
						onKeyDown={(e) => e.key === 'Enter' && handleCopySha()}
					>
						{commit.sha}
					</code>
					{copiedSha && <span className={styles.copiedBadge}>Copied!</span>}
				</div>
			</div>

			{/* Parent */}
			{commit.parentSha && (
				<div className={styles.section}>
					<div className={styles.sectionLabel}>PARENT</div>
					<div className={styles.parentContainer}>
						<span className={styles.parentIcon} aria-hidden="true">
							🔗
						</span>
						<code
							className={styles.parentSha}
							onClick={() => onParentClick?.(commit.parentSha!)}
							title="Click to view parent commit"
							onKeyDown={(e) =>
								e.key === 'Enter' && onParentClick?.(commit.parentSha!)
							}
						>
							#{commit.parentSha.substring(0, 7)}
						</code>
					</div>
				</div>
			)}

			{/* Files Changed */}
			<div className={styles.section}>
				<div className={styles.sectionLabelWithAction}>
					<span className={styles.sectionLabel}>
						FILES CHANGED ({commit.filesChanged.length})
					</span>
					{commit.filesChanged.length > 0 && (
						<button
							type="button"
							className={styles.selectAllButton}
							onClick={handleSelectAllFiles}
						>
							{selectedFiles.size === commit.filesChanged.length
								? 'Deselect All'
								: 'Select All'}
						</button>
					)}
				</div>

				<div className={styles.filesContainer}>
					{commit.filesChanged.length > 0 ? (
						<table className={styles.filesTable}>
							<tbody>
								{commit.filesChanged.map((file) => (
									<tr
										key={file.path}
										className={styles.fileRow}
										onClick={() => onFileClick?.(file)}
									>
										<td className={styles.fileCheckbox}>
											<input
												type="checkbox"
												checked={selectedFiles.has(file.path)}
												onChange={(e) => {
													e.stopPropagation();
													handleFileToggle(file.path);
												}}
												aria-label={`Select ${file.path}`}
											/>
										</td>
										<td
											className={`${styles.fileStatus} ${getFileStatusClass(file.status)}`}
										>
											{getFileStatusIcon(file.status)}
										</td>
										<td className={styles.fileDeletions}>
											{file.deletions > 0 && `-${file.deletions}`}
										</td>
										<td className={styles.fileAdditions}>
											{file.additions > 0 && `+${file.additions}`}
										</td>
										<td className={styles.filePath} title={file.path}>
											{file.path}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<div className={styles.noFiles}>No files changed</div>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div className={styles.actions}>
				<button
					type="button"
					className={styles.actionButton}
					onClick={onViewFullDiff}
					title="View full diff"
				>
					View Full Diff
				</button>
				<button
					type="button"
					className={styles.actionButton}
					onClick={() => onCherryPick?.(commit.sha)}
					title="Cherry-pick this commit"
				>
					Cherry-pick
				</button>
				<button
					type="button"
					className={styles.actionButton}
					onClick={handleCopySha}
					title="Copy SHA to clipboard"
				>
					Copy SHA
				</button>
			</div>
		</div>
	);
}

export default DetailPanel;
