import type React from 'react';
import { useState } from 'react';
import type { Branch, Stash } from './Layout';
import styles from './Sidebar.module.css';

export interface WorkItem {
	id: string;
	title: string;
	type: 'bug' | 'task' | 'feature' | 'user-story';
	state: string;
}

export interface SidebarProps {
	branches: Branch[];
	stashes: Stash[];
	currentBranch: string;
	workItems?: WorkItem[];
	onBranchSelect: (branchName: string) => void;
	onBranchCheckout?: (branchName: string) => void;
	onBranchDelete?: (branchName: string) => void;
	onStashApply?: (index: number) => void;
	onStashPop?: (index: number) => void;
	onStashDrop?: (index: number) => void;
	onWorkItemClick?: (id: string) => void;
}

interface CollapsibleSectionProps {
	title: string;
	count?: number;
	defaultExpanded?: boolean;
	children: React.ReactNode;
}

function CollapsibleSection({
	title,
	count,
	defaultExpanded = true,
	children,
}: CollapsibleSectionProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	return (
		<div className={styles.section}>
			<button
				type="button"
				className={styles.sectionHeader}
				onClick={() => setIsExpanded(!isExpanded)}
				aria-expanded={isExpanded}
			>
				<span
					className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
					aria-hidden="true"
				>
					▶
				</span>
				<span className={styles.sectionTitle}>{title}</span>
				{count !== undefined && count > 0 && (
					<span className={styles.sectionCount}>{count}</span>
				)}
			</button>
			{isExpanded && <div className={styles.sectionContent}>{children}</div>}
		</div>
	);
}

export function Sidebar({
	branches,
	stashes,
	currentBranch: _currentBranch,
	workItems = [],
	onBranchSelect,
	onBranchCheckout,
	onBranchDelete: _onBranchDelete,
	onStashApply,
	onStashPop,
	onStashDrop,
	onWorkItemClick,
}: SidebarProps) {
	const localBranches = branches.filter((b) => !b.isRemote);
	const remoteBranches = branches.filter((b) => b.isRemote);

	const getWorkItemIcon = (type: WorkItem['type']) => {
		switch (type) {
			case 'bug':
				return '🐛';
			case 'task':
				return '📋';
			case 'feature':
				return '✨';
			case 'user-story':
				return '📖';
			default:
				return '📌';
		}
	};

	const handleBranchContextMenu = (e: React.MouseEvent, branch: Branch) => {
		e.preventDefault();
		// Context menu can be implemented with VS Code webview postMessage
		console.log('Context menu for branch:', branch.name);
	};

	return (
		<div className={styles.sidebar}>
			{/* Local Branches Section */}
			<CollapsibleSection title="Branches" count={localBranches.length}>
				<ul className={styles.branchList} aria-label="Local branches">
					{localBranches.length > 0 ? (
						localBranches.map((branch) => (
							<li
								key={branch.name}
								role="treeitem"
								className={`${styles.branchItem} ${branch.isCurrent ? styles.branchItemCurrent : ''}`}
								onClick={() => onBranchSelect(branch.name)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') onBranchSelect(branch.name);
								}}
								onContextMenu={(e) => handleBranchContextMenu(e, branch)}
								onDoubleClick={() => onBranchCheckout?.(branch.name)}
								tabIndex={0}
								aria-selected={branch.isCurrent}
							>
								<span className={styles.branchIcon} aria-hidden="true">
									{branch.isCurrent ? '●' : '○'}
								</span>
								<span className={styles.branchName}>{branch.name}</span>
								{branch.isProtected && (
									<span
										className={styles.protectedBadge}
										title="Protected branch"
									>
										🔒
									</span>
								)}
								{branch.ahead !== undefined && branch.ahead > 0 && (
									<span
										className={styles.aheadBehind}
										title={`${branch.ahead} ahead`}
									>
										↑{branch.ahead}
									</span>
								)}
								{branch.behind !== undefined && branch.behind > 0 && (
									<span
										className={styles.aheadBehind}
										title={`${branch.behind} behind`}
									>
										↓{branch.behind}
									</span>
								)}
							</li>
						))
					) : (
						<li className={styles.emptyMessage}>No local branches</li>
					)}
				</ul>
			</CollapsibleSection>

			{/* Remote Branches Section */}
			<CollapsibleSection
				title="Remote Branches"
				count={remoteBranches.length}
				defaultExpanded={false}
			>
				<ul className={styles.branchList} aria-label="Remote branches">
					{remoteBranches.length > 0 ? (
						remoteBranches.map((branch) => (
							<li
								key={branch.name}
								role="treeitem"
								className={styles.branchItem}
								onClick={() => onBranchSelect(branch.name)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') onBranchSelect(branch.name);
								}}
								onContextMenu={(e) => handleBranchContextMenu(e, branch)}
								tabIndex={0}
							>
								<span className={styles.branchIcon} aria-hidden="true">
									☁
								</span>
								<span className={styles.branchName}>{branch.name}</span>
							</li>
						))
					) : (
						<li className={styles.emptyMessage}>No remote branches</li>
					)}
				</ul>
			</CollapsibleSection>

			{/* Stashes Section */}
			<CollapsibleSection title="Stashes" count={stashes.length}>
				<ul className={styles.stashList} aria-label="Stashes">
					{stashes.length > 0 ? (
						stashes.map((stash) => (
							<li key={stash.index} className={styles.stashItem}>
								<div className={styles.stashHeader}>
									<span className={styles.stashIcon} aria-hidden="true">
										📦
									</span>
									<span className={styles.stashIndex}>
										stash@{`{${stash.index}}`}
									</span>
								</div>
								<span className={styles.stashMessage} title={stash.message}>
									{stash.message}
								</span>
								<div className={styles.stashActions}>
									<button
										type="button"
										className={styles.stashAction}
										onClick={() => onStashApply?.(stash.index)}
										title="Apply stash"
									>
										Apply
									</button>
									<button
										type="button"
										className={styles.stashAction}
										onClick={() => onStashPop?.(stash.index)}
										title="Pop stash"
									>
										Pop
									</button>
									<button
										type="button"
										className={`${styles.stashAction} ${styles.stashActionDanger}`}
										onClick={() => onStashDrop?.(stash.index)}
										title="Drop stash"
									>
										Drop
									</button>
								</div>
							</li>
						))
					) : (
						<li className={styles.emptyMessage}>No stashes</li>
					)}
				</ul>
			</CollapsibleSection>

			{/* Work Items Section (Placeholder) */}
			<CollapsibleSection
				title="Work Items"
				count={workItems.length}
				defaultExpanded={false}
			>
				<ul className={styles.workItemList} aria-label="Work items">
					{workItems.length > 0 ? (
						workItems.map((item) => (
							<li key={item.id} className={styles.workItem}>
								<button
									type="button"
									className={styles.workItemButton}
									onClick={() => onWorkItemClick?.(item.id)}
								>
									<span className={styles.workItemIcon} aria-hidden="true">
										{getWorkItemIcon(item.type)}
									</span>
									<div className={styles.workItemInfo}>
										<span className={styles.workItemId}>#{item.id}</span>
										<span className={styles.workItemTitle} title={item.title}>
											{item.title}
										</span>
									</div>
									<span
										className={styles.workItemState}
										data-state={item.state.toLowerCase()}
									>
										{item.state}
									</span>
								</button>
							</li>
						))
					) : (
						<li className={styles.emptyMessage}>No linked work items</li>
					)}
				</ul>
			</CollapsibleSection>
		</div>
	);
}

export default Sidebar;
