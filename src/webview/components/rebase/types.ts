/**
 * Types for Interactive Rebase components
 * Based on docs/04-UI-UX-DESIGN.md section 2.2
 */

/** Rebase action types - equivalent to git rebase -i commands */
export type RebaseAction =
	| 'pick'
	| 'reword'
	| 'edit'
	| 'squash'
	| 'fixup'
	| 'drop';

/** Commit status during rebase execution */
export type CommitStatus =
	| 'pending'
	| 'in_progress'
	| 'completed'
	| 'dropped'
	| 'conflict'
	| 'skipped';

/** Commit data for interactive rebase */
export interface RebaseCommit {
	sha: string;
	shortSha: string;
	message: string;
	author: string;
	email: string;
	date: Date;
	relativeDate: string;
	action: RebaseAction;
	originalIndex: number;
}

/** Rebase operation state */
export interface RebaseState {
	/** Target branch to rebase onto */
	ontoBranch: string;
	/** Target commit SHA */
	ontoSha: string;
	/** List of commits to rebase */
	commits: RebaseCommit[];
	/** Whether rebase is in progress */
	isExecuting: boolean;
	/** Current progress during execution */
	progress: RebaseProgress;
	/** Whether simplified labels are enabled */
	simplifiedLabels: boolean;
	/** Currently selected commit index */
	selectedIndex: number;
}

/** Progress tracking during rebase execution */
export interface RebaseProgress {
	current: number;
	total: number;
	currentCommitSha: string | null;
	completedCommits: string[];
	status: 'idle' | 'running' | 'paused' | 'completed' | 'conflict' | 'aborted';
}

/** Conflict information */
export interface ConflictInfo {
	commitSha: string;
	commitMessage: string;
	files: ConflictFile[];
}

/** Conflicted file information */
export interface ConflictFile {
	path: string;
	resolved: boolean;
}

/** Action labels - standard and simplified */
export interface ActionLabels {
	pick: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
	reword: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
	edit: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
	squash: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
	fixup: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
	drop: {
		standard: string;
		simplified: string;
		icon: string;
		shortcut: string;
	};
}

/** Action tooltips */
export interface ActionTooltips {
	pick: { title: string; description: string };
	reword: { title: string; description: string };
	edit: { title: string; description: string };
	squash: { title: string; description: string };
	fixup: { title: string; description: string };
	drop: { title: string; description: string };
}

/** Default action labels */
export const ACTION_LABELS: ActionLabels = {
	pick: { standard: 'pick', simplified: 'Keep', icon: '\u2713', shortcut: 'p' },
	reword: {
		standard: 'reword',
		simplified: 'Edit Message',
		icon: '\u270F\uFE0F',
		shortcut: 'r',
	},
	edit: {
		standard: 'edit',
		simplified: 'Edit Code',
		icon: '\u23F8\uFE0F',
		shortcut: 'e',
	},
	squash: {
		standard: 'squash',
		simplified: 'Merge (keep messages)',
		icon: '\uD83D\uDD17',
		shortcut: 's',
	},
	fixup: {
		standard: 'fixup',
		simplified: 'Merge (discard message)',
		icon: '\uD83D\uDD27',
		shortcut: 'f',
	},
	drop: {
		standard: 'drop',
		simplified: 'Delete',
		icon: '\uD83D\uDDD1\uFE0F',
		shortcut: 'd',
	},
};

/** Default action tooltips */
export const ACTION_TOOLTIPS: ActionTooltips = {
	pick: {
		title: 'Keep this commit',
		description: 'The commit stays exactly as it is. No changes.',
	},
	reword: {
		title: 'Change the commit message',
		description: 'Opens an editor to modify the message. Code stays the same.',
	},
	edit: {
		title: 'Pause to edit this commit',
		description:
			"Rebase will stop here. Make changes, then run 'Continue Rebase'.",
	},
	squash: {
		title: 'Combine with previous commit',
		description:
			"Merges into the commit above. You'll edit the combined message.",
	},
	fixup: {
		title: 'Combine, remove this message',
		description:
			'Merges into the commit above. Only the previous message is kept.',
	},
	drop: {
		title: 'Remove this commit entirely',
		description: 'The commit and its changes will be removed from history.',
	},
};

/** Keyboard shortcuts for rebase view */
export const KEYBOARD_SHORTCUTS = {
	pick: 'p',
	reword: 'r',
	edit: 'e',
	squash: 's',
	fixup: 'f',
	drop: 'd',
	moveUp: 'Ctrl+ArrowUp',
	moveDown: 'Ctrl+ArrowDown',
	editMessage: 'Enter',
	cancel: 'Escape',
	startRebase: 'Ctrl+Enter',
	navigateUp: 'ArrowUp',
	navigateDown: 'ArrowDown',
} as const;
