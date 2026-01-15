/**
 * ConflictActions - Global action buttons for conflict resolution
 * Provides Abort, Skip (rebase only), Continue, and Mark as Resolved actions
 */

import type React from 'react';
import { Button } from '../common/Button';
import styles from './ConflictResolutionView.module.css';

/**
 * Operation type affecting available actions
 */
export type ConflictOperation = 'merge' | 'rebase' | 'cherryPick' | 'revert';

/**
 * Props for ConflictActions component
 */
export interface ConflictActionsProps {
	operation: ConflictOperation;
	canContinue: boolean;
	loading?: boolean;
	onAbort: () => void;
	onContinue: () => void;
	onSkip?: () => void;
	onMarkResolved?: () => void;
}

/**
 * Get abort button text based on operation
 */
const getAbortText = (operation: ConflictOperation): string => {
	switch (operation) {
		case 'merge':
			return 'Abort Merge';
		case 'rebase':
			return 'Abort Rebase';
		case 'cherryPick':
			return 'Abort Cherry-Pick';
		case 'revert':
			return 'Abort Revert';
		default:
			return 'Abort';
	}
};

/**
 * Get continue button text based on operation
 */
const getContinueText = (operation: ConflictOperation): string => {
	switch (operation) {
		case 'merge':
			return 'Continue Merge';
		case 'rebase':
			return 'Continue Rebase';
		case 'cherryPick':
			return 'Continue Cherry-Pick';
		case 'revert':
			return 'Continue Revert';
		default:
			return 'Continue';
	}
};

/**
 * ConflictActions component
 * Renders global action buttons for conflict resolution workflow
 */
export const ConflictActions: React.FC<ConflictActionsProps> = ({
	operation,
	canContinue,
	loading = false,
	onAbort,
	onContinue,
	onSkip,
	onMarkResolved,
}) => {
	const showSkip = operation === 'rebase' && onSkip;

	return (
		<div className={styles.footer}>
			<div className={styles.footerLeft}>
				<Button
					variant="danger"
					size="medium"
					onClick={onAbort}
					disabled={loading}
				>
					{getAbortText(operation)}
				</Button>

				{showSkip && (
					<Button
						variant="secondary"
						size="medium"
						onClick={onSkip}
						disabled={loading}
					>
						Skip Commit
					</Button>
				)}
			</div>

			<div className={styles.footerRight}>
				{onMarkResolved && (
					<Button
						variant="secondary"
						size="medium"
						onClick={onMarkResolved}
						disabled={loading || !canContinue}
					>
						Mark as Resolved
					</Button>
				)}

				<Button
					variant="primary"
					size="medium"
					onClick={onContinue}
					disabled={loading || !canContinue}
					loading={loading}
				>
					{getContinueText(operation)}
				</Button>
			</div>
		</div>
	);
};

export default ConflictActions;
