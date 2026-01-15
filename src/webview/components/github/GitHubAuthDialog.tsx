import type React from 'react';
import { useCallback, useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import styles from './GitHubAuthDialog.module.css';

export interface GitHubAuthDialogProps {
	/** Whether the dialog is open */
	isOpen: boolean;
	/** Close handler */
	onClose: () => void;
	/** Authentication handler - returns success status */
	onAuthenticate: (
		pat: string,
	) => Promise<{ success: boolean; error?: string }>;
	/** Optional: currently authenticated user */
	currentUser?: {
		login: string;
		avatarUrl: string;
	} | null;
	/** Optional: sign out handler */
	onSignOut?: () => Promise<void>;
}

/**
 * GitHub icon
 */
const GitHubIcon: React.FC = () => (
	<svg
		className={styles.githubIcon}
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
	</svg>
);

/**
 * Check icon
 */
const CheckIcon: React.FC = () => (
	<svg
		className={styles.checkIcon}
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
	</svg>
);

/**
 * Warning icon
 */
const WarningIcon: React.FC = () => (
	<svg
		className={styles.warningIcon}
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
	</svg>
);

/**
 * External link icon
 */
const ExternalLinkIcon: React.FC = () => (
	<svg
		className={styles.externalIcon}
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
	</svg>
);

/**
 * GitHub Authentication Dialog
 * Allows users to authenticate with GitHub using a Personal Access Token
 */
export const GitHubAuthDialog: React.FC<GitHubAuthDialogProps> = ({
	isOpen,
	onClose,
	onAuthenticate,
	currentUser,
	onSignOut,
}) => {
	const [pat, setPat] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [testSuccess, setTestSuccess] = useState(false);

	const handlePatChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setPat(e.target.value);
			setError(null);
			setTestSuccess(false);
		},
		[],
	);

	const handleClearPat = useCallback(() => {
		setPat('');
		setError(null);
		setTestSuccess(false);
	}, []);

	const handleTestConnection = useCallback(async () => {
		if (!pat.trim()) {
			setError('Please enter a Personal Access Token');
			return;
		}

		setIsLoading(true);
		setError(null);
		setTestSuccess(false);

		try {
			const result = await onAuthenticate(pat);
			if (result.success) {
				setTestSuccess(true);
			} else {
				setError(result.error ?? 'Authentication failed');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Connection test failed');
		} finally {
			setIsLoading(false);
		}
	}, [pat, onAuthenticate]);

	const handleSignOut = useCallback(async () => {
		if (onSignOut) {
			setIsLoading(true);
			try {
				await onSignOut();
				setPat('');
				setTestSuccess(false);
			} finally {
				setIsLoading(false);
			}
		}
	}, [onSignOut]);

	const handleClose = useCallback(() => {
		setPat('');
		setError(null);
		setTestSuccess(false);
		onClose();
	}, [onClose]);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				handleClose();
			}
		},
		[handleClose],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
			}
		},
		[handleClose],
	);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className={styles.overlay}
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="github-auth-title"
		>
			<div className={styles.dialog}>
				<div className={styles.header}>
					<GitHubIcon />
					<h2 id="github-auth-title" className={styles.title}>
						GitHub Authentication
					</h2>
					<button
						type="button"
						className={styles.closeButton}
						onClick={handleClose}
						aria-label="Close dialog"
					>
						<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
							<path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
						</svg>
					</button>
				</div>

				<div className={styles.content}>
					{currentUser ? (
						<div className={styles.authenticatedSection}>
							<div className={styles.userInfo}>
								{currentUser.avatarUrl && (
									<img
										src={currentUser.avatarUrl}
										alt=""
										className={styles.userAvatar}
									/>
								)}
								<div className={styles.userDetails}>
									<span className={styles.userLogin}>{currentUser.login}</span>
									<span className={styles.userStatus}>
										<CheckIcon />
										Authenticated
									</span>
								</div>
							</div>
							{onSignOut && (
								<Button
									variant="secondary"
									onClick={handleSignOut}
									disabled={isLoading}
									loading={isLoading}
								>
									Sign Out
								</Button>
							)}
						</div>
					) : (
						<>
							<p className={styles.description}>
								To access GitHub features, you need to authenticate using a
								Personal Access Token (PAT).
							</p>

							<div className={styles.patSection}>
								<Input
									label="Personal Access Token"
									type="password"
									value={pat}
									onChange={handlePatChange}
									onClear={handleClearPat}
									placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
									error={error ?? undefined}
									disabled={isLoading}
								/>

								<a
									href="https://github.com/settings/tokens/new?scopes=repo,read:user"
									target="_blank"
									rel="noopener noreferrer"
									className={styles.createTokenLink}
								>
									Create new token on GitHub
									<ExternalLinkIcon />
								</a>
							</div>

							<div className={styles.scopeInfo}>
								<WarningIcon />
								<span>
									Required scopes: <code>repo</code>, <code>read:user</code>
								</span>
							</div>

							{testSuccess && (
								<div className={styles.successMessage}>
									<CheckIcon />
									<span>Connection successful! You are now authenticated.</span>
								</div>
							)}
						</>
					)}
				</div>

				<div className={styles.footer}>
					<Button variant="secondary" onClick={handleClose}>
						{currentUser ? 'Close' : 'Cancel'}
					</Button>
					{!currentUser && (
						<Button
							variant="primary"
							onClick={handleTestConnection}
							disabled={isLoading || !pat.trim()}
							loading={isLoading}
						>
							{testSuccess ? 'Connected' : 'Test Connection'}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default GitHubAuthDialog;
