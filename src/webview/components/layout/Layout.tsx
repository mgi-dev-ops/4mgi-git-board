import type React from 'react';
import { useState, useMemo } from 'react';
import { useGitStore } from '../../stores/gitStore';
import { DetailPanel } from './DetailPanel';
import styles from './Layout.module.css';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';

export interface LayoutProps {
	children?: React.ReactNode;
}

export interface SelectedCommit {
	sha: string;
	shortSha: string;
	message: string;
	description?: string;
	author: string;
	email: string;
	date: Date;
	relativeDate: string;
	parentSha?: string;
	branches: string[];
	tags: string[];
	filesChanged: FileChange[];
}

export interface FileChange {
	path: string;
	additions: number;
	deletions: number;
	status: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface Branch {
	name: string;
	isRemote: boolean;
	isCurrent: boolean;
	isProtected?: boolean;
	ahead?: number;
	behind?: number;
}

export interface Stash {
	index: number;
	message: string;
	date: Date;
}

export function Layout({ children }: LayoutProps) {
	const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
	const [selectedCommit, setSelectedCommit] = useState<SelectedCommit | null>(
		null,
	);
	const [_searchQuery, setSearchQuery] = useState('');
	const [showBranches, setShowBranches] = useState(true);
	const [showTags, setShowTags] = useState(true);

	// Get data from gitStore
	const gitBranches = useGitStore((state) => state.branches);
	const gitStashes = useGitStore((state) => state.stashes);
	const storeBranch = useGitStore((state) => state.currentBranch);

	// Get actions from gitStore
	const checkout = useGitStore((state) => state.checkout);
	const pull = useGitStore((state) => state.pull);
	const fetchAll = useGitStore((state) => state.fetchAll);
	const stashApply = useGitStore((state) => state.stashApply);
	const stashPop = useGitStore((state) => state.stashPop);
	const stashDrop = useGitStore((state) => state.stashDrop);

	// Map gitStore types to Layout types
	const branches: Branch[] = useMemo(
		() =>
			gitBranches.map((b) => ({
				name: b.name,
				isRemote: b.isRemote,
				isCurrent: b.isHead,
				ahead: b.ahead,
				behind: b.behind,
			})),
		[gitBranches],
	);

	const stashes: Stash[] = useMemo(
		() =>
			gitStashes.map((s) => ({
				index: s.index,
				message: s.message,
				date: new Date(s.date),
			})),
		[gitStashes],
	);

	const currentBranch = storeBranch ?? 'main';

	const _handleCommitSelect = (commit: SelectedCommit | null) => {
		setSelectedCommit(commit);
		setIsDetailPanelOpen(commit !== null);
	};

	const handleBranchSelect = (branchName: string) => {
		// For now, just log - could show commit history for this branch
		console.log('Branch selected:', branchName);
	};

	const handleBranchCheckout = (branchName: string) => {
		checkout(branchName);
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
	};

	const handleToggleBranches = () => {
		setShowBranches(!showBranches);
	};

	const handleToggleTags = () => {
		setShowTags(!showTags);
	};

	const handleRefresh = () => {
		fetchAll();
	};

	const handlePull = () => {
		pull();
	};

	const handleCloseDetailPanel = () => {
		setIsDetailPanelOpen(false);
	};

	return (
		<div className={styles.layout}>
			<header className={styles.toolbar}>
				<Toolbar
					currentBranch={currentBranch}
					branches={branches}
					stashes={stashes}
					showBranches={showBranches}
					showTags={showTags}
					onBranchChange={handleBranchCheckout}
					onSearch={handleSearch}
					onToggleBranches={handleToggleBranches}
					onToggleTags={handleToggleTags}
					onRefresh={handleRefresh}
					onPull={handlePull}
				/>
			</header>

			<aside className={styles.sidebar}>
				<Sidebar
					branches={branches}
					stashes={stashes}
					currentBranch={currentBranch}
					onBranchSelect={handleBranchSelect}
					onBranchCheckout={handleBranchCheckout}
					onStashApply={stashApply}
					onStashPop={stashPop}
					onStashDrop={stashDrop}
				/>
			</aside>

			<main className={styles.mainCanvas}>{children}</main>

			<aside
				className={`${styles.detailPanel} ${isDetailPanelOpen ? styles.detailPanelOpen : ''}`}
			>
				{selectedCommit && (
					<DetailPanel
						commit={selectedCommit}
						onClose={handleCloseDetailPanel}
					/>
				)}
			</aside>

			<footer className={styles.statusBar}>
				<StatusBar
					currentBranch={currentBranch}
					ahead={0}
					behind={0}
					isSynced={true}
				/>
			</footer>
		</div>
	);
}

export default Layout;
