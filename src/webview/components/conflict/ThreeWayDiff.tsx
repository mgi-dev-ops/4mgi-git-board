/**
 * ThreeWayDiff - Three-column diff view for conflict resolution
 * Displays Base (ancestor), Ours (current branch), and Theirs (incoming) versions
 */

import type React from 'react';
import { useMemo } from 'react';
import styles from './ConflictResolutionView.module.css';
import { HunkActions } from './HunkActions';

/**
 * Diff line information
 */
export interface DiffLine {
	lineNumber: number;
	content: string;
	type: 'normal' | 'added' | 'removed' | 'modified' | 'conflict';
}

/**
 * Conflict hunk information for display
 */
export interface ConflictHunkDisplay {
	id: string;
	startLine: number;
	endLine: number;
	oursContent: string[];
	theirsContent: string[];
	baseContent?: string[];
	oursLabel: string;
	theirsLabel: string;
	baseLabel?: string;
	resolved: boolean;
}

/**
 * Props for ThreeWayDiff component
 */
export interface ThreeWayDiffProps {
	baseContent: string;
	oursContent: string;
	theirsContent: string;
	baseLabel?: string;
	oursLabel?: string;
	theirsLabel?: string;
	hunks?: ConflictHunkDisplay[];
	onAcceptOurs?: (hunkId: string) => void;
	onAcceptTheirs?: (hunkId: string) => void;
	onAcceptBoth?: (hunkId: string) => void;
	onManualEdit?: (hunkId: string) => void;
}

/**
 * Parse content into diff lines
 */
const parseLines = (content: string): DiffLine[] => {
	const lines = content.split('\n');
	return lines.map((line, index) => ({
		lineNumber: index + 1,
		content: line,
		type: 'normal' as const,
	}));
};

/**
 * DiffColumn component - renders a single column of the diff
 */
const DiffColumn: React.FC<{
	lines: DiffLine[];
	highlightRanges?: { start: number; end: number; type: DiffLine['type'] }[];
}> = ({ lines, highlightRanges = [] }) => {
	const getLineClass = (lineNumber: number): string => {
		for (const range of highlightRanges) {
			if (lineNumber >= range.start && lineNumber <= range.end) {
				switch (range.type) {
					case 'added':
						return styles.lineAdded;
					case 'removed':
						return styles.lineRemoved;
					case 'modified':
						return styles.lineModified;
					case 'conflict':
						return styles.lineConflict;
					default:
						return '';
				}
			}
		}
		return '';
	};

	return (
		<div className={styles.diffColumn}>
			{lines.map((line) => (
				<div
					key={line.lineNumber}
					className={`${styles.diffLine} ${getLineClass(line.lineNumber)}`}
				>
					<span className={styles.lineNumber}>{line.lineNumber}</span>
					<span className={styles.lineContent}>{line.content || ' '}</span>
				</div>
			))}
		</div>
	);
};

/**
 * ThreeWayDiff component
 * Renders a three-column diff view showing base, ours, and theirs versions
 */
export const ThreeWayDiff: React.FC<ThreeWayDiffProps> = ({
	baseContent,
	oursContent,
	theirsContent,
	baseLabel = 'Base',
	oursLabel = 'Ours (Current)',
	theirsLabel = 'Theirs (Incoming)',
	hunks = [],
	onAcceptOurs,
	onAcceptTheirs,
	onAcceptBoth,
	onManualEdit,
}) => {
	const baseLines = useMemo(() => parseLines(baseContent), [baseContent]);
	const oursLines = useMemo(() => parseLines(oursContent), [oursContent]);
	const theirsLines = useMemo(() => parseLines(theirsContent), [theirsContent]);

	// If we have hunks with actions, render them individually
	if (
		hunks.length > 0 &&
		onAcceptOurs &&
		onAcceptTheirs &&
		onAcceptBoth &&
		onManualEdit
	) {
		return (
			<div className={styles.diffContainer}>
				{hunks.map((hunk) => (
					<div key={hunk.id} className={styles.hunkSection}>
						<div className={styles.hunkHeader}>
							<span className={styles.hunkInfo}>
								Lines {hunk.startLine}-{hunk.endLine}
								{hunk.resolved && ' (Resolved)'}
							</span>
							<HunkActions
								hunkId={hunk.id}
								disabled={hunk.resolved}
								onAcceptOurs={onAcceptOurs}
								onAcceptTheirs={onAcceptTheirs}
								onAcceptBoth={onAcceptBoth}
								onManualEdit={onManualEdit}
							/>
						</div>
						<div className={styles.hunkContent}>
							<div className={styles.diffBody}>
								{/* Base column */}
								{hunk.baseContent && (
									<div className={styles.diffColumn}>
										<div className={styles.diffColumnHeader}>
											{hunk.baseLabel || baseLabel}
										</div>
										{hunk.baseContent.map((line, idx) => (
											<div key={idx} className={styles.diffLine}>
												<span className={styles.lineNumber}>{idx + 1}</span>
												<span className={styles.lineContent}>
													{line || ' '}
												</span>
											</div>
										))}
									</div>
								)}

								{/* Ours column */}
								<div className={styles.diffColumn}>
									<div className={styles.diffColumnHeader}>
										{hunk.oursLabel || oursLabel}
									</div>
									{hunk.oursContent.map((line, idx) => (
										<div
											key={idx}
											className={`${styles.diffLine} ${styles.lineAdded}`}
										>
											<span className={styles.lineNumber}>{idx + 1}</span>
											<span className={styles.lineContent}>{line || ' '}</span>
										</div>
									))}
								</div>

								{/* Theirs column */}
								<div className={styles.diffColumn}>
									<div className={styles.diffColumnHeader}>
										{hunk.theirsLabel || theirsLabel}
									</div>
									{hunk.theirsContent.map((line, idx) => (
										<div
											key={idx}
											className={`${styles.diffLine} ${styles.lineModified}`}
										>
											<span className={styles.lineNumber}>{idx + 1}</span>
											<span className={styles.lineContent}>{line || ' '}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	// Simple three-way diff without hunk actions
	return (
		<div className={styles.diffContainer}>
			<div className={styles.diffHeader}>
				<div className={styles.diffColumnHeader}>{baseLabel}</div>
				<div className={styles.diffColumnHeader}>{oursLabel}</div>
				<div className={styles.diffColumnHeader}>{theirsLabel}</div>
			</div>
			<div className={styles.diffBody}>
				<DiffColumn lines={baseLines} />
				<DiffColumn lines={oursLines} />
				<DiffColumn lines={theirsLines} />
			</div>
		</div>
	);
};

export default ThreeWayDiff;
