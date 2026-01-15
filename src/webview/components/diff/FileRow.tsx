import type React from 'react';
import type { GitFileChange } from '../../stores/gitStore';
import styles from './DiffSection.module.css';

export interface FileRowProps {
	file: GitFileChange;
	selected: boolean;
	onSelect: (path: string, selected: boolean) => void;
	onOpenFile: (path: string) => void;
	onStage?: (path: string) => void;
	onUnstage?: (path: string) => void;
	isStaged: boolean;
}

const STATUS_ICONS: Record<GitFileChange['status'], string> = {
	added: '+',
	modified: '~',
	deleted: '-',
	renamed: 'R',
	copied: 'C',
};

const STATUS_LABELS: Record<GitFileChange['status'], string> = {
	added: 'Added',
	modified: 'Modified',
	deleted: 'Deleted',
	renamed: 'Renamed',
	copied: 'Copied',
};

export function FileRow({
	file,
	selected,
	onSelect,
	onOpenFile,
	onStage,
	onUnstage,
	isStaged,
}: FileRowProps) {
	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSelect(file.path, e.target.checked);
	};

	const handleOpenClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onOpenFile(file.path);
	};

	const handleStageToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isStaged && onUnstage) {
			onUnstage(file.path);
		} else if (!isStaged && onStage) {
			onStage(file.path);
		}
	};

	const truncatePath = (path: string, maxLength: number = 40): string => {
		if (path.length <= maxLength) return path;
		const parts = path.split('/');
		if (parts.length === 1) {
			return `...${path.slice(-maxLength + 3)}`;
		}
		const filename = parts[parts.length - 1];
		const remaining = maxLength - filename.length - 4;
		if (remaining <= 0) {
			return `...${filename.slice(-maxLength + 3)}`;
		}
		const dirPath = parts.slice(0, -1).join('/');
		return `...${dirPath.slice(-remaining)}/${filename}`;
	};

	const displayPath = file.oldPath
		? `${truncatePath(file.oldPath)} -> ${truncatePath(file.path)}`
		: truncatePath(file.path);

	const fullPath = file.oldPath ? `${file.oldPath} -> ${file.path}` : file.path;

	return (
		<div className={styles.fileRow}>
			<label className={styles.fileCheckbox}>
				<input
					type="checkbox"
					checked={selected}
					onChange={handleCheckboxChange}
					aria-label={`Select ${file.path}`}
				/>
			</label>

			<span
				className={`${styles.fileStatus} ${styles[`status${file.status.charAt(0).toUpperCase() + file.status.slice(1)}`]}`}
				title={STATUS_LABELS[file.status]}
			>
				{STATUS_ICONS[file.status]}
			</span>

			<span
				className={styles.linesAdded}
				title={`${file.additions ?? 0} lines added`}
			>
				+{file.additions ?? 0}
			</span>

			<span
				className={styles.linesRemoved}
				title={`${file.deletions ?? 0} lines removed`}
			>
				-{file.deletions ?? 0}
			</span>

			<span className={styles.filePath} title={fullPath}>
				{displayPath}
			</span>

			<div className={styles.fileActions}>
				{(onStage || onUnstage) && (
					<button
						type="button"
						className={styles.actionButton}
						onClick={handleStageToggle}
						title={isStaged ? 'Unstage file' : 'Stage file'}
						aria-label={isStaged ? 'Unstage file' : 'Stage file'}
					>
						{isStaged ? '-' : '+'}
					</button>
				)}
				<button
					type="button"
					className={styles.actionButton}
					onClick={handleOpenClick}
					title="Open file in editor"
					aria-label="Open file in editor"
				>
					Open
				</button>
			</div>
		</div>
	);
}

export default FileRow;
