import type React from 'react';
import { useState } from 'react';
import type { Branch, Stash } from './Layout';
import styles from './Toolbar.module.css';

export interface ToolbarProps {
	currentBranch: string;
	branches: Branch[];
	stashes: Stash[];
	showBranches: boolean;
	showTags: boolean;
	onBranchChange: (branch: string) => void;
	onSearch: (query: string) => void;
	onToggleBranches: () => void;
	onToggleTags: () => void;
	onRefresh: () => void;
	onPull: () => void;
	onSettings?: () => void;
	onStashApply?: (index: number) => void;
	onStashPop?: (index: number) => void;
	onStashDrop?: (index: number) => void;
}

export function Toolbar({
	currentBranch,
	branches,
	stashes,
	showBranches,
	showTags,
	onBranchChange,
	onSearch,
	onToggleBranches,
	onToggleTags,
	onRefresh,
	onPull,
	onSettings,
	onStashApply,
	onStashPop,
	onStashDrop,
}: ToolbarProps) {
	const [searchValue, setSearchValue] = useState('');
	const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
	const [isStashDropdownOpen, setIsStashDropdownOpen] = useState(false);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchValue(value);
		onSearch(value);
	};

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setSearchValue('');
			onSearch('');
		}
	};

	const handleBranchSelect = (branchName: string) => {
		onBranchChange(branchName);
		setIsBranchDropdownOpen(false);
	};

	const toggleBranchDropdown = () => {
		setIsBranchDropdownOpen(!isBranchDropdownOpen);
		setIsStashDropdownOpen(false);
	};

	const toggleStashDropdown = () => {
		setIsStashDropdownOpen(!isStashDropdownOpen);
		setIsBranchDropdownOpen(false);
	};

	return (
		<div className={styles.toolbar}>
			{/* Pull Button */}
			<button
				type="button"
				className={styles.toolbarButton}
				onClick={onPull}
				title="Pull from remote"
				aria-label="Pull from remote"
			>
				<span className={styles.icon} aria-hidden="true">
					↓
				</span>
				<span className={styles.buttonText}>Pull</span>
			</button>

			{/* Branch Selector Dropdown */}
			<div className={styles.dropdownContainer}>
				<button
					type="button"
					className={styles.branchSelector}
					onClick={toggleBranchDropdown}
					aria-expanded={isBranchDropdownOpen}
					aria-haspopup="listbox"
					title="Select branch"
				>
					<span className={styles.branchIcon} aria-hidden="true">
						⑂
					</span>
					<span className={styles.branchName}>{currentBranch}</span>
					<span className={styles.dropdownArrow} aria-hidden="true">
						▼
					</span>
				</button>

				{isBranchDropdownOpen && (
					<ul className={styles.dropdown} aria-label="Branches">
						{branches.length > 0 ? (
							branches.map((branch) => (
								<li
									key={branch.name}
									aria-selected={branch.name === currentBranch}
									className={`${styles.dropdownItem} ${branch.isCurrent ? styles.currentBranch : ''}`}
									onClick={() => handleBranchSelect(branch.name)}
								>
									<span className={styles.branchItemIcon}>
										{branch.isRemote ? '☁' : '⑂'}
									</span>
									<span className={styles.branchItemName}>{branch.name}</span>
									{branch.isProtected && (
										<span className={styles.protectedIcon} title="Protected">
											🔒
										</span>
									)}
								</li>
							))
						) : (
							<li className={styles.dropdownItemEmpty}>
								No branches available
							</li>
						)}
					</ul>
				)}
			</div>

			{/* Search Input */}
			<div className={styles.searchContainer}>
				<span className={styles.searchIcon} aria-hidden="true">
					🔍
				</span>
				<input
					type="text"
					className={styles.searchInput}
					placeholder="Search commits..."
					value={searchValue}
					onChange={handleSearchChange}
					onKeyDown={handleSearchKeyDown}
					aria-label="Search commits"
				/>
				{searchValue && (
					<button
						type="button"
						className={styles.searchClear}
						onClick={() => {
							setSearchValue('');
							onSearch('');
						}}
						aria-label="Clear search"
					>
						×
					</button>
				)}
			</div>

			{/* Stash Dropdown */}
			<div className={styles.dropdownContainer}>
				<button
					type="button"
					className={styles.toolbarButton}
					onClick={toggleStashDropdown}
					aria-expanded={isStashDropdownOpen}
					aria-haspopup="listbox"
					title="Manage stashes"
				>
					<span className={styles.icon} aria-hidden="true">
						📦
					</span>
					<span className={styles.buttonText}>
						Stash{stashes.length > 0 && ` (${stashes.length})`}
					</span>
					<span className={styles.dropdownArrow} aria-hidden="true">
						▼
					</span>
				</button>

				{isStashDropdownOpen && (
					<ul className={styles.dropdown} aria-label="Stashes">
						{stashes.length > 0 ? (
							stashes.map((stash) => (
								<li
									key={stash.index}
									className={styles.stashItem}
									aria-selected={false}
								>
									<div className={styles.stashInfo}>
										<span className={styles.stashIndex}>
											stash@{`{${stash.index}}`}
										</span>
										<span className={styles.stashMessage}>{stash.message}</span>
									</div>
									<div className={styles.stashActions}>
										<button
											type="button"
											className={styles.stashActionButton}
											onClick={() => onStashApply?.(stash.index)}
											title="Apply stash"
										>
											Apply
										</button>
										<button
											type="button"
											className={styles.stashActionButton}
											onClick={() => onStashPop?.(stash.index)}
											title="Pop stash"
										>
											Pop
										</button>
										<button
											type="button"
											className={`${styles.stashActionButton} ${styles.stashActionDanger}`}
											onClick={() => onStashDrop?.(stash.index)}
											title="Drop stash"
										>
											Drop
										</button>
									</div>
								</li>
							))
						) : (
							<li className={styles.dropdownItemEmpty}>No stashes available</li>
						)}
					</ul>
				)}
			</div>

			{/* Spacer */}
			<div className={styles.spacer} />

			{/* Branches + Tags Toggle */}
			<div className={styles.toggleGroup}>
				<button
					type="button"
					className={`${styles.toggleButton} ${showBranches ? styles.toggleActive : ''}`}
					onClick={onToggleBranches}
					aria-pressed={showBranches}
					title="Toggle branches visibility"
				>
					Branches
				</button>
				<button
					type="button"
					className={`${styles.toggleButton} ${showTags ? styles.toggleActive : ''}`}
					onClick={onToggleTags}
					aria-pressed={showTags}
					title="Toggle tags visibility"
				>
					Tags
				</button>
			</div>

			{/* History Refresh Button */}
			<button
				type="button"
				className={styles.toolbarButton}
				onClick={onRefresh}
				title="Refresh history"
				aria-label="Refresh history"
			>
				<span className={styles.icon} aria-hidden="true">
					⟳
				</span>
				<span className={styles.buttonText}>History</span>
			</button>

			{/* Settings Button */}
			<button
				type="button"
				className={styles.toolbarButton}
				onClick={onSettings}
				title="Settings"
				aria-label="Open settings"
			>
				<span className={styles.icon} aria-hidden="true">
					⚙
				</span>
			</button>
		</div>
	);
}

export default Toolbar;
