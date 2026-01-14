import React, { useState, useCallback, useMemo } from "react";
import styles from "./LinkWorkItemDialog.module.css";
import Button from "../common/Button";
import { WorkItemBadge, WorkItemType } from "./WorkItemBadge";

export interface WorkItemSearchResult {
  id: number;
  type: WorkItemType;
  title: string;
  state: string;
}

export interface LinkWorkItemDialogProps {
  /** Recently used work items */
  recentWorkItems: WorkItemSearchResult[];
  /** Handler for search work items */
  onSearch: (query: string) => Promise<WorkItemSearchResult[]>;
  /** Handler for link work item */
  onLinkWorkItem: (workItemId: number) => void;
  /** Handler for close dialog */
  onClose: () => void;
  /** Is linking in progress */
  isLinking?: boolean;
  /** Current commit SHA (for display) */
  commitSha?: string;
  /** Optional className */
  className?: string;
}

export const LinkWorkItemDialog: React.FC<LinkWorkItemDialogProps> = ({
  recentWorkItems,
  onSearch,
  onLinkWorkItem,
  onClose,
  isLinking = false,
  commitSha,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkItemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
  const [idInput, setIdInput] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "id" | "recent">("search");

  const dialogClasses = [styles.dialog, className].filter(Boolean).join(" ");

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const handleIdSubmit = useCallback(() => {
    const id = parseInt(idInput, 10);
    if (!isNaN(id) && id > 0) {
      onLinkWorkItem(id);
    }
  }, [idInput, onLinkWorkItem]);

  const handleLinkSelected = useCallback(() => {
    if (selectedWorkItemId !== null) {
      onLinkWorkItem(selectedWorkItemId);
    }
  }, [selectedWorkItemId, onLinkWorkItem]);

  const selectWorkItem = (id: number) => {
    setSelectedWorkItemId(id === selectedWorkItemId ? null : id);
  };

  const displayItems = useMemo(() => {
    switch (activeTab) {
      case "search":
        return searchResults;
      case "recent":
        return recentWorkItems;
      default:
        return [];
    }
  }, [activeTab, searchResults, recentWorkItems]);

  const isValidId = useMemo(() => {
    const id = parseInt(idInput, 10);
    return !isNaN(id) && id > 0;
  }, [idInput]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={dialogClasses} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="link-workitem-title">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id="link-workitem-title" className={styles.title}>Link Work Item</h2>
            {commitSha && (
              <span className={styles.commitInfo}>
                to commit <code>{commitSha.substring(0, 8)}</code>
              </span>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
            disabled={isLinking}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "search"}
            className={`${styles.tab} ${activeTab === "search" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("search")}
            disabled={isLinking}
          >
            Search
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "id"}
            className={`${styles.tab} ${activeTab === "id" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("id")}
            disabled={isLinking}
          >
            By ID
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "recent"}
            className={`${styles.tab} ${activeTab === "recent" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("recent")}
            disabled={isLinking}
          >
            Recent
          </button>
        </div>

        <div className={styles.content}>
          {/* Search Tab */}
          {activeTab === "search" && (
            <div className={styles.searchTab}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search work items by title or ID..."
                  disabled={isLinking}
                  autoFocus
                />
                {isSearching && (
                  <span className={styles.searchSpinner}>
                    <svg className={styles.spinnerIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <circle cx="8" cy="8" r="6" strokeWidth="2" strokeLinecap="round" strokeDasharray="30" strokeDashoffset="10" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ID Tab */}
          {activeTab === "id" && (
            <div className={styles.idTab}>
              <div className={styles.idInputWrapper}>
                <label htmlFor="workItemId" className={styles.idLabel}>
                  Work Item ID
                </label>
                <div className={styles.idInputRow}>
                  <input
                    id="workItemId"
                    type="number"
                    className={styles.idInput}
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    placeholder="Enter ID (e.g., 1234)"
                    disabled={isLinking}
                    min="1"
                  />
                  <Button
                    variant="primary"
                    onClick={handleIdSubmit}
                    disabled={!isValidId || isLinking}
                    loading={isLinking}
                  >
                    Link
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Work Item List (for search and recent tabs) */}
          {(activeTab === "search" || activeTab === "recent") && (
            <div className={styles.workItemListContainer}>
              {displayItems.length > 0 ? (
                <ul className={styles.workItemList}>
                  {displayItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`${styles.workItemRow} ${selectedWorkItemId === item.id ? styles.selected : ""}`}
                        onClick={() => selectWorkItem(item.id)}
                        disabled={isLinking}
                      >
                        <WorkItemBadge id={item.id} type={item.type} />
                        <div className={styles.workItemContent}>
                          <span className={styles.workItemTitle}>{item.title}</span>
                          <span className={styles.workItemState}>{item.state}</span>
                        </div>
                        {selectedWorkItemId === item.id && (
                          <span className={styles.checkmark}>
                            <svg viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyState}>
                  {activeTab === "search" && !searchQuery && (
                    <p>Enter a search term to find work items</p>
                  )}
                  {activeTab === "search" && searchQuery && !isSearching && (
                    <p>No work items found for "{searchQuery}"</p>
                  )}
                  {activeTab === "recent" && (
                    <p>No recent work items</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (for search and recent tabs) */}
        {(activeTab === "search" || activeTab === "recent") && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose} disabled={isLinking}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleLinkSelected}
              disabled={selectedWorkItemId === null || isLinking}
              loading={isLinking}
            >
              Link Work Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

LinkWorkItemDialog.displayName = "LinkWorkItemDialog";

export default LinkWorkItemDialog;
