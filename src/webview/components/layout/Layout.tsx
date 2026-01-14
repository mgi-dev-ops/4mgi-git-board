import React, { useState } from "react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { DetailPanel } from "./DetailPanel";
import { StatusBar } from "./StatusBar";
import styles from "./Layout.module.css";

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
  status: "added" | "modified" | "deleted" | "renamed";
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
    null
  );
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stashes, setStashes] = useState<Stash[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBranches, setShowBranches] = useState(true);
  const [showTags, setShowTags] = useState(true);

  const handleCommitSelect = (commit: SelectedCommit | null) => {
    setSelectedCommit(commit);
    setIsDetailPanelOpen(commit !== null);
  };

  const handleBranchChange = (branchName: string) => {
    setCurrentBranch(branchName);
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
    // Trigger refresh of commit history
    console.log("Refresh triggered");
  };

  const handlePull = () => {
    // Trigger git pull
    console.log("Pull triggered");
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
          onBranchChange={handleBranchChange}
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
          onBranchSelect={handleBranchChange}
        />
      </aside>

      <main className={styles.mainCanvas}>{children}</main>

      <aside
        className={`${styles.detailPanel} ${isDetailPanelOpen ? styles.detailPanelOpen : ""}`}
      >
        {selectedCommit && (
          <DetailPanel commit={selectedCommit} onClose={handleCloseDetailPanel} />
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
