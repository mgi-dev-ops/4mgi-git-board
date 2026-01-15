import type React from 'react';
import styles from './WorkItemBadge.module.css';

export type WorkItemType =
	| 'bug'
	| 'task'
	| 'userStory'
	| 'feature'
	| 'epic'
	| 'issue'
	| 'testCase';

export interface WorkItemBadgeProps {
	/** Work Item ID */
	id: number;
	/** Work Item type */
	type: WorkItemType;
	/** Click handler */
	onClick?: () => void;
	/** Optional className */
	className?: string;
	/** Show type icon only without ID */
	iconOnly?: boolean;
}

const typeConfig: Record<
	WorkItemType,
	{ icon: React.ReactNode; label: string; color: string }
> = {
	bug: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M4.72 3.22a.75.75 0 0 1 1.06 1.06L4.28 5.78A3.99 3.99 0 0 1 5 8.5h.75a.75.75 0 0 1 0 1.5H5c.002.68-.148 1.33-.418 1.914l1.196 1.196a.75.75 0 0 1-1.06 1.06l-1.133-1.133A4 4 0 0 1 .998 10H.25a.75.75 0 0 1 0-1.5H1A3.99 3.99 0 0 1 1.72 5.78L.22 4.28a.75.75 0 0 1 1.06-1.06l1.5 1.5L4.22 3.22Z" />
				<path d="M8 2.5A3.5 3.5 0 0 0 4.5 6v4a3.5 3.5 0 1 0 7 0V6A3.5 3.5 0 0 0 8 2.5Z" />
			</svg>
		),
		label: 'Bug',
		color: '#cc293d',
	},
	task: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M2.5 2.5A2.5 2.5 0 0 1 5 0h6a2.5 2.5 0 0 1 2.5 2.5v11a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5v-11ZM5 1.5A1 1 0 0 0 4 2.5v11a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1H5Z" />
				<path d="M6 5h4v1.5H6V5Zm0 3h4v1.5H6V8Zm0 3h2v1.5H6V11Z" />
			</svg>
		),
		label: 'Task',
		color: '#f2cb1d',
	},
	userStory: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M1.5 1.75V13.5h13.25a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.75.75 0 0 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.75.75 0 1 1 1.06 1.06Z" />
			</svg>
		),
		label: 'User Story',
		color: '#009ccc',
	},
	feature: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M8.75 1.5a.75.75 0 0 0-1.5 0v5.75H1.5a.75.75 0 0 0 0 1.5h5.75v5.75a.75.75 0 0 0 1.5 0V8.75h5.75a.75.75 0 0 0 0-1.5H8.75V1.5Z" />
			</svg>
		),
		label: 'Feature',
		color: '#773b93',
	},
	epic: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
			</svg>
		),
		label: 'Epic',
		color: '#ff7b00',
	},
	issue: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.22-5.5 5.5a.75.75 0 0 1-1.06-1.06l5.5-5.5a.75.75 0 1 1 1.06 1.06Z" />
			</svg>
		),
		label: 'Issue',
		color: '#b4009e',
	},
	testCase: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3ZM8 6.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5Zm0 5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z" />
				<path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v11A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-11Z" />
			</svg>
		),
		label: 'Test Case',
		color: '#004b50',
	},
};

export const WorkItemBadge: React.FC<WorkItemBadgeProps> = ({
	id,
	type,
	onClick,
	className = '',
	iconOnly = false,
}) => {
	const config = typeConfig[type];

	const badgeClasses = [
		styles.badge,
		onClick ? styles.clickable : '',
		iconOnly ? styles.iconOnly : '',
		className,
	]
		.filter(Boolean)
		.join(' ');

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onClick?.();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			onClick?.();
		}
	};

	return (
		<span
			className={badgeClasses}
			onClick={onClick ? handleClick : undefined}
			onKeyDown={onClick ? handleKeyDown : undefined}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			title={`${config.label} #${id}`}
			style={{ '--work-item-color': config.color } as React.CSSProperties}
		>
			<span className={styles.icon} aria-hidden="true">
				{config.icon}
			</span>
			{!iconOnly && <span className={styles.id}>#{id}</span>}
		</span>
	);
};

WorkItemBadge.displayName = 'WorkItemBadge';

export default WorkItemBadge;
