import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Branch, Commit } from '../../../core/messages/types';
import styles from './BranchList.module.css';

export interface CreateBranchDialogProps {
	isOpen: boolean;
	branches: Branch[];
	commits?: Commit[];
	currentBranch: string;
	onClose: () => void;
	onCreate: (name: string, from: string, checkout: boolean) => void;
}

type SourceType = 'branch' | 'commit';

/**
 * CreateBranchDialog component - dialog for creating a new branch
 *
 * Features:
 * - Branch name input with validation
 * - From commit/branch selector
 * - Checkout after create checkbox
 * - Create button
 */
export function CreateBranchDialog({
	isOpen,
	branches,
	commits = [],
	currentBranch,
	onClose,
	onCreate,
}: CreateBranchDialogProps) {
	const [branchName, setBranchName] = useState('');
	const [sourceType, setSourceType] = useState<SourceType>('branch');
	const [selectedSource, setSelectedSource] = useState(currentBranch);
	const [checkoutAfterCreate, setCheckoutAfterCreate] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setBranchName('');
			setSourceType('branch');
			setSelectedSource(currentBranch);
			setCheckoutAfterCreate(true);
			setError(null);

			// Focus input when dialog opens
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [isOpen, currentBranch]);

	// Handle escape key and click outside
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dialogRef.current &&
				!dialogRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	// Validate branch name
	const validateBranchName = useCallback(
		(name: string): string | null => {
			if (!name.trim()) {
				return 'Branch name is required';
			}

			// Git branch name validation rules
			const invalidPatterns = [
				/^\./, // Cannot start with dot
				/\.\./, // Cannot contain double dots
				/\/$/, // Cannot end with slash
				/\.lock$/, // Cannot end with .lock
				/@\{/, // Cannot contain @{
				/[\x00-\x1f\x7f]/, // Cannot contain control characters
				/[\s~^:?*[\]\\]/, // Cannot contain special characters
			];

			for (const pattern of invalidPatterns) {
				if (pattern.test(name)) {
					return 'Invalid branch name. Avoid special characters and patterns like .., @{, etc.';
				}
			}

			// Check if branch already exists
			const branchExists = branches.some(
				(b) => b.name === name || b.name === `origin/${name}`,
			);
			if (branchExists) {
				return `Branch "${name}" already exists`;
			}

			return null;
		},
		[branches],
	);

	const handleBranchNameChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const name = event.target.value;
			setBranchName(name);
			setError(validateBranchName(name));
		},
		[validateBranchName],
	);

	const handleSourceTypeChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const type = event.target.value as SourceType;
			setSourceType(type);

			// Reset selected source based on type
			if (type === 'branch') {
				setSelectedSource(currentBranch);
			} else if (commits.length > 0) {
				setSelectedSource(commits[0].sha);
			}
		},
		[currentBranch, commits],
	);

	const handleSourceChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			setSelectedSource(event.target.value);
		},
		[],
	);

	const handleCheckoutChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setCheckoutAfterCreate(event.target.checked);
		},
		[],
	);

	const handleSubmit = useCallback(
		(event: React.FormEvent) => {
			event.preventDefault();

			const validationError = validateBranchName(branchName);
			if (validationError) {
				setError(validationError);
				return;
			}

			onCreate(branchName.trim(), selectedSource, checkoutAfterCreate);
			onClose();
		},
		[
			branchName,
			selectedSource,
			checkoutAfterCreate,
			validateBranchName,
			onCreate,
			onClose,
		],
	);

	const handleCancel = useCallback(() => {
		onClose();
	}, [onClose]);

	if (!isOpen) {
		return null;
	}

	// Filter local branches for selection
	const localBranches = branches.filter((b) => !b.remote || b.tracking);

	const isSubmitDisabled = !branchName.trim() || !!error;

	return (
		<div
			className={styles.dialogOverlay}
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-branch-title"
		>
			<div ref={dialogRef} className={styles.dialog}>
				{/* Header */}
				<div className={styles.dialogHeader}>
					<h2 id="create-branch-title" className={styles.dialogTitle}>
						Create New Branch
					</h2>
					<button
						type="button"
						className={styles.dialogCloseButton}
						onClick={handleCancel}
						aria-label="Close dialog"
					>
						<CloseIcon />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit}>
					<div className={styles.dialogContent}>
						{/* Branch Name */}
						<div className={styles.formGroup}>
							<label htmlFor="branch-name" className={styles.formLabel}>
								Branch Name
							</label>
							<input
								ref={inputRef}
								id="branch-name"
								type="text"
								className={styles.formInput}
								value={branchName}
								onChange={handleBranchNameChange}
								placeholder="feature/my-new-feature"
								autoComplete="off"
								spellCheck={false}
							/>
							{error && (
								<span className={styles.error} role="alert">
									{error}
								</span>
							)}
						</div>

						{/* Source Type */}
						<div className={styles.formGroup}>
							<label htmlFor="source-type" className={styles.formLabel}>
								Create From
							</label>
							<select
								id="source-type"
								className={styles.formSelect}
								value={sourceType}
								onChange={handleSourceTypeChange}
							>
								<option value="branch">Branch</option>
								<option value="commit" disabled={commits.length === 0}>
									Commit
								</option>
							</select>
						</div>

						{/* Source Selection */}
						<div className={styles.formGroup}>
							<label htmlFor="source-select" className={styles.formLabel}>
								{sourceType === 'branch' ? 'Source Branch' : 'Source Commit'}
							</label>
							<select
								id="source-select"
								className={styles.formSelect}
								value={selectedSource}
								onChange={handleSourceChange}
							>
								{sourceType === 'branch'
									? localBranches.map((branch) => (
											<option key={branch.name} value={branch.name}>
												{branch.name}
												{branch.current ? ' (current)' : ''}
											</option>
										))
									: commits.slice(0, 20).map((commit) => (
											<option key={commit.sha} value={commit.sha}>
												{commit.shortSha} - {commit.message.substring(0, 50)}
												{commit.message.length > 50 ? '...' : ''}
											</option>
										))}
							</select>
						</div>

						{/* Checkout After Create */}
						<div className={styles.formGroup}>
							<div className={styles.checkboxGroup}>
								<input
									id="checkout-after-create"
									type="checkbox"
									className={styles.checkbox}
									checked={checkoutAfterCreate}
									onChange={handleCheckoutChange}
								/>
								<label
									htmlFor="checkout-after-create"
									className={styles.checkboxLabel}
								>
									Checkout new branch after creation
								</label>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className={styles.dialogFooter}>
						<button
							type="button"
							className={`${styles.dialogButton} ${styles.dialogButtonSecondary}`}
							onClick={handleCancel}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}
							disabled={isSubmitDisabled}
						>
							Create Branch
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

/**
 * Close icon for dialog
 */
function CloseIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M8 8.70711L11.1464 11.8536C11.3417 12.0488 11.6583 12.0488 11.8536 11.8536C12.0488 11.6583 12.0488 11.3417 11.8536 11.1464L8.70711 8L11.8536 4.85355C12.0488 4.65829 12.0488 4.34171 11.8536 4.14645C11.6583 3.95118 11.3417 3.95118 11.1464 4.14645L8 7.29289L4.85355 4.14645C4.65829 3.95118 4.34171 3.95118 4.14645 4.14645C3.95118 4.34171 3.95118 4.65829 4.14645 4.85355L7.29289 8L4.14645 11.1464C3.95118 11.3417 3.95118 11.6583 4.14645 11.8536C4.34171 12.0488 4.65829 12.0488 4.85355 11.8536L8 8.70711Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export default CreateBranchDialog;
