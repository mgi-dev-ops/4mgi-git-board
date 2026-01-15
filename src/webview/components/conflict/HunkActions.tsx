/**
 * HunkActions - Action buttons for resolving individual conflict hunks
 * Provides Accept Ours, Accept Theirs, Accept Both, and Manual Edit options
 */

import type React from 'react';
import styles from './ConflictResolutionView.module.css';

/**
 * Resolution type for a hunk
 */
export type HunkResolution = 'ours' | 'theirs' | 'both' | 'manual';

/**
 * Props for HunkActions component
 */
export interface HunkActionsProps {
	hunkId: string;
	disabled?: boolean;
	onAcceptOurs: (hunkId: string) => void;
	onAcceptTheirs: (hunkId: string) => void;
	onAcceptBoth: (hunkId: string) => void;
	onManualEdit: (hunkId: string) => void;
}

/**
 * HunkActions component
 * Renders action buttons for resolving a single conflict hunk
 */
export const HunkActions: React.FC<HunkActionsProps> = ({
	hunkId,
	disabled = false,
	onAcceptOurs,
	onAcceptTheirs,
	onAcceptBoth,
	onManualEdit,
}) => {
	const handleAcceptOurs = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			onAcceptOurs(hunkId);
		}
	};

	const handleAcceptTheirs = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			onAcceptTheirs(hunkId);
		}
	};

	const handleAcceptBoth = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			onAcceptBoth(hunkId);
		}
	};

	const handleManualEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			onManualEdit(hunkId);
		}
	};

	return (
		<div className={styles.hunkActions}>
			<button
				type="button"
				className={`${styles.hunkButton} ${styles.hunkButtonOurs}`}
				onClick={handleAcceptOurs}
				disabled={disabled}
				title="Accept current branch changes (ours)"
				aria-label="Accept Ours"
			>
				Accept Ours
			</button>

			<button
				type="button"
				className={`${styles.hunkButton} ${styles.hunkButtonTheirs}`}
				onClick={handleAcceptTheirs}
				disabled={disabled}
				title="Accept incoming changes (theirs)"
				aria-label="Accept Theirs"
			>
				Accept Theirs
			</button>

			<button
				type="button"
				className={`${styles.hunkButton} ${styles.hunkButtonBoth}`}
				onClick={handleAcceptBoth}
				disabled={disabled}
				title="Accept both changes"
				aria-label="Accept Both"
			>
				Accept Both
			</button>

			<button
				type="button"
				className={`${styles.hunkButton} ${styles.hunkButtonEdit}`}
				onClick={handleManualEdit}
				disabled={disabled}
				title="Edit manually in editor"
				aria-label="Manual Edit"
			>
				Edit
			</button>
		</div>
	);
};

export default HunkActions;
