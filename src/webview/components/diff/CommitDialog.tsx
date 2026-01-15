import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DiffSection.module.css';

export interface CommitDialogProps {
	isAmend: boolean;
	previousMessage?: string;
	onCommit: (message: string, amend: boolean, workItemId?: string) => void;
	onCancel: () => void;
}

const SUBJECT_CHAR_LIMIT = 50;
const SUBJECT_CHAR_WARNING = 50;

export function CommitDialog({
	isAmend,
	previousMessage = '',
	onCommit,
	onCancel,
}: CommitDialogProps) {
	const [subject, setSubject] = useState(() => {
		if (isAmend && previousMessage) {
			const lines = previousMessage.split('\n');
			return lines[0] || '';
		}
		return '';
	});

	const [body, setBody] = useState(() => {
		if (isAmend && previousMessage) {
			const lines = previousMessage.split('\n');
			// Skip first line (subject) and blank line
			return lines.slice(2).join('\n');
		}
		return '';
	});

	const [amend, setAmend] = useState(isAmend);
	const [workItemId, setWorkItemId] = useState('');

	const subjectInputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		subjectInputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onCancel();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onCancel]);

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === overlayRef.current) {
				onCancel();
			}
		},
		[onCancel],
	);

	const handleSubjectChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSubject(e.target.value);
		},
		[],
	);

	const handleBodyChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setBody(e.target.value);
		},
		[],
	);

	const handleAmendChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setAmend(e.target.checked);
		},
		[],
	);

	const handleWorkItemChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setWorkItemId(e.target.value);
		},
		[],
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!subject.trim()) return;

			let message = subject.trim();
			if (body.trim()) {
				message += `\n\n${body.trim()}`;
			}

			onCommit(message, amend, workItemId.trim() || undefined);
		},
		[subject, body, amend, workItemId, onCommit],
	);

	const getSubjectCounterClass = () => {
		if (subject.length > SUBJECT_CHAR_LIMIT) {
			return `${styles.charCounter} ${styles.error}`;
		}
		if (subject.length > SUBJECT_CHAR_WARNING) {
			return `${styles.charCounter} ${styles.warning}`;
		}
		return styles.charCounter;
	};

	const getSubjectInputClass = () => {
		if (subject.length > SUBJECT_CHAR_LIMIT) {
			return `${styles.subjectInput} ${styles.warning}`;
		}
		return styles.subjectInput;
	};

	return (
		<div
			className={styles.dialogOverlay}
			ref={overlayRef}
			onClick={handleOverlayClick}
			onKeyDown={(e) => e.key === 'Escape' && onCancel()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="commit-dialog-title"
		>
			<div className={styles.dialog}>
				<div className={styles.dialogHeader}>
					<h2 id="commit-dialog-title" className={styles.dialogTitle}>
						{isAmend ? 'Amend Commit' : 'Create Commit'}
					</h2>
					<button
						type="button"
						className={styles.dialogCloseButton}
						onClick={onCancel}
						aria-label="Close dialog"
					>
						x
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className={styles.dialogContent}>
						<div className={styles.commitForm}>
							<div className={styles.formGroup}>
								<label htmlFor="commit-subject" className={styles.formLabel}>
									Subject (first line)
								</label>
								<input
									id="commit-subject"
									ref={subjectInputRef}
									type="text"
									className={getSubjectInputClass()}
									value={subject}
									onChange={handleSubjectChange}
									placeholder="Brief summary of changes"
									aria-describedby="subject-hint subject-counter"
								/>
								<div className={styles.formHint} id="subject-hint">
									Keep under 50 characters for best compatibility
								</div>
								<div className={getSubjectCounterClass()} id="subject-counter">
									{subject.length}/{SUBJECT_CHAR_LIMIT}
								</div>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="commit-body" className={styles.formLabel}>
									Body (optional)
								</label>
								<textarea
									id="commit-body"
									className={styles.bodyTextarea}
									value={body}
									onChange={handleBodyChange}
									placeholder="Detailed explanation of what and why (not how)"
									rows={5}
								/>
								<div className={styles.formHint}>
									Separate from subject with a blank line
								</div>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={amend}
										onChange={handleAmendChange}
									/>
									Amend previous commit
								</label>
							</div>

							<div className={styles.formGroup}>
								<label htmlFor="work-item" className={styles.formLabel}>
									Work Item ID (Azure DevOps)
								</label>
								<input
									id="work-item"
									type="text"
									className={styles.workItemInput}
									value={workItemId}
									onChange={handleWorkItemChange}
									placeholder="e.g., AB#1234"
								/>
								<div className={styles.formHint}>
									Links commit to Azure DevOps work item
								</div>
							</div>
						</div>
					</div>

					<div className={styles.dialogFooter}>
						<button
							type="button"
							className={styles.actionButtonSecondary}
							onClick={onCancel}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={styles.actionButtonPrimary}
							disabled={!subject.trim()}
						>
							{amend ? 'Amend' : 'Commit'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default CommitDialog;
