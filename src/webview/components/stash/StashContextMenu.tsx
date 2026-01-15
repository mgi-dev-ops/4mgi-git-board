import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GitStash } from '../../stores/gitStore';
import styles from './StashPanel.module.css';

// ============================================================================
// Icons
// ============================================================================

const ApplyIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
	</svg>
);

const PopIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M4.25 3A2.25 2.25 0 002 5.25v5.5A2.25 2.25 0 004.25 13h7.5A2.25 2.25 0 0014 10.75v-5.5A2.25 2.25 0 0011.75 3h-7.5zm4.03 1.72a.75.75 0 00-1.06 1.06L8.44 7H5.75a.75.75 0 000 1.5h2.69l-1.22 1.22a.75.75 0 101.06 1.06l2.5-2.5a.75.75 0 000-1.06l-2.5-2.5z" />
	</svg>
);

const DropIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z" />
	</svg>
);

const ViewIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 010 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 010-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2zM1.679 7.932a.12.12 0 000 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.824-.742 3.955-1.715 1.125-.967 1.955-2.095 2.366-2.717a.12.12 0 000-.136c-.411-.622-1.241-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.824.742-3.955 1.715-1.125.967-1.955 2.095-2.366 2.717zM8 6a2 2 0 100 4 2 2 0 000-4z" />
	</svg>
);

const BranchIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6.5a2 2 0 01-2 2H8v2.878a2.25 2.25 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v2.128a.5.5 0 00.5.5h2.5a.5.5 0 00.5-.5v-1.128A2.251 2.251 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
	</svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 16 16" fill="currentColor">
		<path d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />
	</svg>
);

// ============================================================================
// Types
// ============================================================================

export interface StashContextMenuProps {
	stash: GitStash;
	position: { x: number; y: number };
	onClose: () => void;
	onApply?: (stash: GitStash) => void;
	onPop?: (stash: GitStash) => void;
	onDrop?: (stash: GitStash) => void;
	onViewDiff?: (stash: GitStash) => void;
	onCreateBranch?: (stash: GitStash) => void;
}

export interface ConfirmDropDialogProps {
	stash: GitStash;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

// ============================================================================
// Confirm Drop Dialog
// ============================================================================

export function ConfirmDropDialog({
	stash,
	isOpen,
	onConfirm,
	onCancel,
}: ConfirmDropDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onCancel();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onCancel]);

	const handleOverlayClick = useCallback(
		(event: React.MouseEvent) => {
			if (event.target === event.currentTarget) {
				onCancel();
			}
		},
		[onCancel],
	);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className={styles.dialogOverlay}
			onClick={handleOverlayClick}
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="confirm-drop-title"
		>
			<div
				className={`${styles.dialog} ${styles.confirmDialog}`}
				ref={dialogRef}
			>
				<div className={styles.dialogHeader}>
					<h2 className={styles.dialogTitle} id="confirm-drop-title">
						Drop Stash
					</h2>
				</div>

				<div className={styles.dialogContent}>
					<p className={styles.confirmMessage}>
						Are you sure you want to drop{' '}
						<strong>stash@{`{${stash.index}}`}</strong>?
					</p>
					<div className={styles.confirmWarning}>
						<WarningIcon className={styles.confirmWarningIcon} />
						<span>
							This action cannot be undone. The stash will be permanently
							deleted.
						</span>
					</div>
				</div>

				<div className={styles.dialogFooter}>
					<button
						type="button"
						className={styles.actionButton}
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						type="button"
						className={`${styles.actionButton} ${styles.actionButtonDanger}`}
						onClick={onConfirm}
					>
						Drop Stash
					</button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Context Menu Component
// ============================================================================

export function StashContextMenu({
	stash,
	position,
	onClose,
	onApply,
	onPop,
	onDrop,
	onViewDiff,
	onCreateBranch,
}: StashContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [showConfirmDrop, setShowConfirmDrop] = useState(false);
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	// Adjust menu position to stay within viewport
	useEffect(() => {
		if (menuRef.current) {
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let newX = position.x;
			let newY = position.y;

			// Adjust horizontal position
			if (position.x + menuRect.width > viewportWidth) {
				newX = viewportWidth - menuRect.width - 8;
			}

			// Adjust vertical position
			if (position.y + menuRect.height > viewportHeight) {
				newY = viewportHeight - menuRect.height - 8;
			}

			setAdjustedPosition({ x: Math.max(8, newX), y: Math.max(8, newY) });
		}
	}, [position]);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	// Close on escape
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (showConfirmDrop) {
					setShowConfirmDrop(false);
				} else {
					onClose();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose, showConfirmDrop]);

	const handleApply = useCallback(() => {
		onApply?.(stash);
		onClose();
	}, [stash, onApply, onClose]);

	const handlePop = useCallback(() => {
		onPop?.(stash);
		onClose();
	}, [stash, onPop, onClose]);

	const handleDropClick = useCallback(() => {
		setShowConfirmDrop(true);
	}, []);

	const handleConfirmDrop = useCallback(() => {
		onDrop?.(stash);
		setShowConfirmDrop(false);
		onClose();
	}, [stash, onDrop, onClose]);

	const handleCancelDrop = useCallback(() => {
		setShowConfirmDrop(false);
	}, []);

	const handleViewDiff = useCallback(() => {
		onViewDiff?.(stash);
		onClose();
	}, [stash, onViewDiff, onClose]);

	const handleCreateBranch = useCallback(() => {
		onCreateBranch?.(stash);
		onClose();
	}, [stash, onCreateBranch, onClose]);

	return (
		<>
			<div
				ref={menuRef}
				className={styles.contextMenu}
				style={{
					left: adjustedPosition.x,
					top: adjustedPosition.y,
				}}
				role="menu"
				aria-label="Stash actions"
			>
				{onApply && (
					<button
						type="button"
						className={styles.contextMenuItem}
						onClick={handleApply}
						role="menuitem"
					>
						<ApplyIcon className={styles.contextMenuIcon} />
						Apply
						<span className={styles.contextMenuShortcut}>Keep in list</span>
					</button>
				)}

				{onPop && (
					<button
						type="button"
						className={styles.contextMenuItem}
						onClick={handlePop}
						role="menuitem"
					>
						<PopIcon className={styles.contextMenuIcon} />
						Pop
						<span className={styles.contextMenuShortcut}>Apply & remove</span>
					</button>
				)}

				{(onApply || onPop) && (onViewDiff || onCreateBranch || onDrop) && (
					<div className={styles.contextMenuSeparator} role="separator" />
				)}

				{onViewDiff && (
					<button
						type="button"
						className={styles.contextMenuItem}
						onClick={handleViewDiff}
						role="menuitem"
					>
						<ViewIcon className={styles.contextMenuIcon} />
						View Diff
					</button>
				)}

				{onCreateBranch && (
					<button
						type="button"
						className={styles.contextMenuItem}
						onClick={handleCreateBranch}
						role="menuitem"
					>
						<BranchIcon className={styles.contextMenuIcon} />
						Create Branch from Stash
					</button>
				)}

				{(onViewDiff || onCreateBranch) && onDrop && (
					<div className={styles.contextMenuSeparator} role="separator" />
				)}

				{onDrop && (
					<button
						type="button"
						className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`}
						onClick={handleDropClick}
						role="menuitem"
					>
						<DropIcon className={styles.contextMenuIcon} />
						Drop
					</button>
				)}
			</div>

			<ConfirmDropDialog
				stash={stash}
				isOpen={showConfirmDrop}
				onConfirm={handleConfirmDrop}
				onCancel={handleCancelDrop}
			/>
		</>
	);
}

export default StashContextMenu;
