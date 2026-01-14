import React from "react";
import { useGitStore } from "./stores/gitStore";
import { useUIStore } from "./stores/uiStore";
import { Layout } from "./components/layout";

/**
 * Root component for 4MGI Git Board
 * Layout structure based on docs/04-UI-UX-DESIGN.md
 */
export const App: React.FC = () => {
  // Git state
  const loading = useGitStore((state) => state.loading);
  const error = useGitStore((state) => state.error);
  const commits = useGitStore((state) => state.commits);
  const status = useGitStore((state) => state.status);

  // Calculate unstaged/staged counts
  const unstagedCount = status
    ? status.unstaged.length + status.untracked.length
    : 0;
  const stagedCount = status ? status.staged.length : 0;

  return (
    <Layout>
      {/* Diff Section (Collapsible) */}
      <section className="git-board__diff-section">
        <details className="diff-section__container" open>
          <summary className="diff-section__header">
            <span>Unstaged Changes</span>
            <span className="diff-section__count">{unstagedCount} files</span>
          </summary>
          <div className="diff-section__files">
            {unstagedCount === 0 ? (
              <p className="diff-section__empty">No changes to commit</p>
            ) : (
              <p className="diff-section__empty">
                {unstagedCount} file(s) changed
              </p>
            )}
          </div>
        </details>
        {stagedCount > 0 && (
          <details className="diff-section__container">
            <summary className="diff-section__header">
              <span>Staged Changes</span>
              <span className="diff-section__count">{stagedCount} files</span>
            </summary>
            <div className="diff-section__files">
              <p className="diff-section__empty">
                {stagedCount} file(s) staged
              </p>
            </div>
          </details>
        )}
        <div className="diff-section__actions">
          <button
            className="action-button action-button--primary"
            disabled={stagedCount === 0}
          >
            Commit
          </button>
          <button className="action-button action-button--secondary">
            Amend
          </button>
        </div>
      </section>

      {/* Graph Area */}
      <div className="graph__container">
        {loading && <p className="graph__loading">Loading git history...</p>}
        {error && <p className="graph__error">Error: {error}</p>}
        {!loading && !error && commits.length === 0 && (
          <p className="graph__empty">No commits found</p>
        )}
        {!loading && !error && commits.length > 0 && (
          <div className="graph__placeholder">
            <p>Git Graph - {commits.length} commits loaded</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
