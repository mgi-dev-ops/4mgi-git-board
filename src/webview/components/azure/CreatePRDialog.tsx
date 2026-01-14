import React, { useState, useCallback } from "react";
import styles from "./CreatePRDialog.module.css";
import Button from "../common/Button";
import { WorkItemBadge, WorkItemType } from "./WorkItemBadge";

export interface BranchOption {
  name: string;
  isDefault?: boolean;
}

export interface ReviewerOption {
  id: string;
  displayName: string;
  imageUrl?: string;
}

export interface WorkItemOption {
  id: number;
  type: WorkItemType;
  title: string;
}

export interface CreatePRDialogProps {
  /** Source branch (current branch) */
  sourceBranch: string;
  /** Available target branches */
  targetBranches: BranchOption[];
  /** Available reviewers */
  availableReviewers: ReviewerOption[];
  /** Available work items to link */
  availableWorkItems: WorkItemOption[];
  /** Handler for create PR */
  onCreatePR: (data: CreatePRData) => void;
  /** Handler for close dialog */
  onClose: () => void;
  /** Is creating in progress */
  isCreating?: boolean;
  /** Optional className */
  className?: string;
}

export interface CreatePRData {
  title: string;
  description: string;
  targetBranch: string;
  reviewerIds: string[];
  workItemIds: number[];
  autoComplete: boolean;
}

export const CreatePRDialog: React.FC<CreatePRDialogProps> = ({
  sourceBranch,
  targetBranches,
  availableReviewers,
  availableWorkItems,
  onCreatePR,
  onClose,
  isCreating = false,
  className = "",
}) => {
  const defaultTarget = targetBranches.find((b) => b.isDefault)?.name || targetBranches[0]?.name || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetBranch, setTargetBranch] = useState(defaultTarget);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedWorkItems, setSelectedWorkItems] = useState<number[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState("");
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);

  const dialogClasses = [styles.dialog, className].filter(Boolean).join(" ");

  const filteredReviewers = availableReviewers.filter(
    (r) =>
      r.displayName.toLowerCase().includes(reviewerSearchQuery.toLowerCase()) &&
      !selectedReviewers.includes(r.id)
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !targetBranch) return;

      onCreatePR({
        title: title.trim(),
        description: description.trim(),
        targetBranch,
        reviewerIds: selectedReviewers,
        workItemIds: selectedWorkItems,
        autoComplete,
      });
    },
    [title, description, targetBranch, selectedReviewers, selectedWorkItems, autoComplete, onCreatePR]
  );

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId]
    );
    setReviewerSearchQuery("");
    setShowReviewerDropdown(false);
  };

  const removeReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) => prev.filter((id) => id !== reviewerId));
  };

  const toggleWorkItem = (workItemId: number) => {
    setSelectedWorkItems((prev) =>
      prev.includes(workItemId) ? prev.filter((id) => id !== workItemId) : [...prev, workItemId]
    );
  };

  const isValid = title.trim().length > 0 && targetBranch.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={dialogClasses} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-pr-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 id="create-pr-title" className={styles.title}>Create Pull Request</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
            disabled={isCreating}
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Branch Selection */}
          <div className={styles.branchSection}>
            <div className={styles.branchFlow}>
              <div className={styles.branchBox}>
                <span className={styles.branchLabel}>Source</span>
                <span className={styles.branchName}>{sourceBranch}</span>
              </div>
              <span className={styles.arrow} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </span>
              <div className={styles.branchBox}>
                <label htmlFor="targetBranch" className={styles.branchLabel}>Target</label>
                <select
                  id="targetBranch"
                  className={styles.branchSelect}
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  disabled={isCreating}
                >
                  {targetBranches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="prTitle" className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              id="prTitle"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="prDescription" className={styles.label}>Description</label>
            <textarea
              id="prDescription"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your changes..."
              rows={4}
              disabled={isCreating}
            />
          </div>

          {/* Reviewers */}
          <div className={styles.field}>
            <label className={styles.label}>Reviewers</label>
            <div className={styles.reviewerSection}>
              {/* Selected Reviewers */}
              {selectedReviewers.length > 0 && (
                <div className={styles.selectedReviewers}>
                  {selectedReviewers.map((reviewerId) => {
                    const reviewer = availableReviewers.find((r) => r.id === reviewerId);
                    if (!reviewer) return null;
                    return (
                      <span key={reviewerId} className={styles.selectedReviewer}>
                        {reviewer.imageUrl ? (
                          <img src={reviewer.imageUrl} alt="" className={styles.reviewerAvatar} />
                        ) : (
                          <span className={styles.reviewerAvatarPlaceholder}>
                            {reviewer.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className={styles.reviewerName}>{reviewer.displayName}</span>
                        <button
                          type="button"
                          className={styles.removeReviewerButton}
                          onClick={() => removeReviewer(reviewerId)}
                          aria-label={`Remove ${reviewer.displayName}`}
                          disabled={isCreating}
                        >
                          <svg viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Reviewer Search */}
              <div className={styles.reviewerSearch}>
                <input
                  type="text"
                  className={styles.reviewerSearchInput}
                  value={reviewerSearchQuery}
                  onChange={(e) => {
                    setReviewerSearchQuery(e.target.value);
                    setShowReviewerDropdown(true);
                  }}
                  onFocus={() => setShowReviewerDropdown(true)}
                  placeholder="Search reviewers..."
                  disabled={isCreating}
                />
                {showReviewerDropdown && filteredReviewers.length > 0 && (
                  <ul className={styles.reviewerDropdown}>
                    {filteredReviewers.slice(0, 5).map((reviewer) => (
                      <li key={reviewer.id}>
                        <button
                          type="button"
                          className={styles.reviewerOption}
                          onClick={() => toggleReviewer(reviewer.id)}
                        >
                          {reviewer.imageUrl ? (
                            <img src={reviewer.imageUrl} alt="" className={styles.reviewerAvatar} />
                          ) : (
                            <span className={styles.reviewerAvatarPlaceholder}>
                              {reviewer.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{reviewer.displayName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Work Items */}
          {availableWorkItems.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Work Items to Link</label>
              <div className={styles.workItemsList}>
                {availableWorkItems.map((workItem) => (
                  <label key={workItem.id} className={styles.workItemOption}>
                    <input
                      type="checkbox"
                      checked={selectedWorkItems.includes(workItem.id)}
                      onChange={() => toggleWorkItem(workItem.id)}
                      disabled={isCreating}
                    />
                    <WorkItemBadge id={workItem.id} type={workItem.type} />
                    <span className={styles.workItemTitle}>{workItem.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Auto-complete */}
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={autoComplete}
                onChange={(e) => setAutoComplete(e.target.checked)}
                disabled={isCreating}
              />
              <span className={styles.checkboxText}>
                Set auto-complete
                <span className={styles.checkboxHint}>
                  Automatically complete this pull request when all policies are satisfied
                </span>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!isValid || isCreating} loading={isCreating}>
              Create Pull Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreatePRDialog.displayName = "CreatePRDialog";

export default CreatePRDialog;
