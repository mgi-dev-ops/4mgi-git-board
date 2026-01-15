import type React from 'react';
import styles from './BuildStatusBadge.module.css';

export type BuildStatus =
	| 'running'
	| 'succeeded'
	| 'failed'
	| 'canceled'
	| 'partial';

export interface BuildStatusBadgeProps {
	/** Build status */
	status: BuildStatus;
	/** Build number (optional) */
	buildNumber?: string;
	/** Click handler */
	onClick?: () => void;
	/** Optional className */
	className?: string;
	/** Compact mode - shows only icon */
	compact?: boolean;
}

const statusConfig: Record<
	BuildStatus,
	{ icon: React.ReactNode; label: string; ariaLabel: string }
> = {
	running: {
		icon: (
			<svg
				className={styles.spinnerIcon}
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
			>
				<circle
					cx="8"
					cy="8"
					r="6"
					strokeWidth="2"
					strokeLinecap="round"
					strokeDasharray="30"
					strokeDashoffset="10"
				/>
			</svg>
		),
		label: 'Running',
		ariaLabel: 'Build running',
	},
	succeeded: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
			</svg>
		),
		label: 'Succeeded',
		ariaLabel: 'Build succeeded',
	},
	failed: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
			</svg>
		),
		label: 'Failed',
		ariaLabel: 'Build failed',
	},
	canceled: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z" />
				<path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
			</svg>
		),
		label: 'Canceled',
		ariaLabel: 'Build canceled',
	},
	partial: {
		icon: (
			<svg viewBox="0 0 16 16" fill="currentColor">
				<path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047Zm1.543.955L1.918 13.38a.25.25 0 0 0 .22.37h12.164a.25.25 0 0 0 .22-.37L8.458 2.002a.25.25 0 0 0-.458 0Z" />
				<path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM8 4.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75Z" />
			</svg>
		),
		label: 'Partial',
		ariaLabel: 'Build partially succeeded',
	},
};

export const BuildStatusBadge: React.FC<BuildStatusBadgeProps> = ({
	status,
	buildNumber,
	onClick,
	className = '',
	compact = false,
}) => {
	const config = statusConfig[status];

	const badgeClasses = [
		styles.badge,
		styles[status],
		compact ? styles.compact : '',
		onClick ? styles.clickable : '',
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

	const titleText = buildNumber
		? `${config.label} - Build #${buildNumber}`
		: config.label;

	return (
		<span
			className={badgeClasses}
			onClick={onClick ? handleClick : undefined}
			onKeyDown={onClick ? handleKeyDown : undefined}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			title={titleText}
		>
			<span className={styles.icon} aria-hidden="true">
				{config.icon}
			</span>
			{!compact && (
				<>
					{buildNumber && (
						<span className={styles.buildNumber}>#{buildNumber}</span>
					)}
					<span className={styles.statusText}>{config.label}</span>
				</>
			)}
		</span>
	);
};

BuildStatusBadge.displayName = 'BuildStatusBadge';

export default BuildStatusBadge;
