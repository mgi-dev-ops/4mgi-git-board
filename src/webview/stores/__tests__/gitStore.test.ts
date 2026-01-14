/**
 * GitStore Unit Tests
 * Tests for Zustand git store
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock VS Code API
const mockPostMessage = vi.fn();
const mockGetState = vi.fn();
const mockSetState = vi.fn();

vi.stubGlobal('acquireVsCodeApi', () => ({
  postMessage: mockPostMessage,
  getState: mockGetState,
  setState: mockSetState,
}));

// Import after mock is set up
import { useGitStore } from '../gitStore';
import type { GitCommit, GitBranch, GitStatus, GitStash } from '../gitStore';

describe('GitStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useGitStore.getState().resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have empty commits array', () => {
      expect(useGitStore.getState().commits).toEqual([]);
    });

    it('should have empty branches array', () => {
      expect(useGitStore.getState().branches).toEqual([]);
    });

    it('should have null current branch', () => {
      expect(useGitStore.getState().currentBranch).toBeNull();
    });

    it('should have null status', () => {
      expect(useGitStore.getState().status).toBeNull();
    });

    it('should have empty stashes array', () => {
      expect(useGitStore.getState().stashes).toEqual([]);
    });

    it('should not be loading', () => {
      expect(useGitStore.getState().loading).toBe(false);
    });

    it('should have no error', () => {
      expect(useGitStore.getState().error).toBeNull();
    });

    it('should have hasMoreCommits true', () => {
      expect(useGitStore.getState().hasMoreCommits).toBe(true);
    });
  });

  describe('setCommits', () => {
    it('should set commits and update offset', () => {
      const commits: GitCommit[] = [
        {
          hash: 'abc123',
          shortHash: 'abc123',
          message: 'Test commit',
          body: '',
          author: { name: 'John', email: 'john@test.com', date: '2024-01-15' },
          committer: { name: 'John', email: 'john@test.com', date: '2024-01-15' },
          parents: [],
          refs: [],
          isMerge: false,
        },
      ];

      act(() => {
        useGitStore.getState().setCommits(commits);
      });

      expect(useGitStore.getState().commits).toEqual(commits);
      expect(useGitStore.getState().commitOffset).toBe(1);
    });
  });

  describe('appendCommits', () => {
    it('should append commits to existing array', () => {
      const initialCommit: GitCommit = {
        hash: 'abc123',
        shortHash: 'abc123',
        message: 'Initial',
        body: '',
        author: { name: 'John', email: 'john@test.com', date: '2024-01-15' },
        committer: { name: 'John', email: 'john@test.com', date: '2024-01-15' },
        parents: [],
        refs: [],
        isMerge: false,
      };

      const newCommit: GitCommit = {
        hash: 'def456',
        shortHash: 'def456',
        message: 'New commit',
        body: '',
        author: { name: 'Jane', email: 'jane@test.com', date: '2024-01-16' },
        committer: { name: 'Jane', email: 'jane@test.com', date: '2024-01-16' },
        parents: ['abc123'],
        refs: [],
        isMerge: false,
      };

      act(() => {
        useGitStore.getState().setCommits([initialCommit]);
        useGitStore.getState().appendCommits([newCommit]);
      });

      expect(useGitStore.getState().commits).toHaveLength(2);
      expect(useGitStore.getState().commitOffset).toBe(2);
    });
  });

  describe('setBranches', () => {
    it('should set branches', () => {
      const branches: GitBranch[] = [
        { name: 'main', isRemote: false, isHead: true },
        { name: 'develop', isRemote: false, isHead: false },
        { name: 'origin/main', isRemote: true, isHead: false },
      ];

      act(() => {
        useGitStore.getState().setBranches(branches);
      });

      expect(useGitStore.getState().branches).toEqual(branches);
    });
  });

  describe('setCurrentBranch', () => {
    it('should set current branch', () => {
      act(() => {
        useGitStore.getState().setCurrentBranch('develop');
      });

      expect(useGitStore.getState().currentBranch).toBe('develop');
    });

    it('should accept null', () => {
      act(() => {
        useGitStore.getState().setCurrentBranch('main');
        useGitStore.getState().setCurrentBranch(null);
      });

      expect(useGitStore.getState().currentBranch).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('should set status', () => {
      const status: GitStatus = {
        staged: [],
        unstaged: [],
        untracked: ['new-file.ts'],
        conflicted: [],
        isClean: false,
        isMerging: false,
        isRebasing: false,
        isCherryPicking: false,
      };

      act(() => {
        useGitStore.getState().setStatus(status);
      });

      expect(useGitStore.getState().status).toEqual(status);
    });
  });

  describe('setStashes', () => {
    it('should set stashes', () => {
      const stashes: GitStash[] = [
        { index: 0, message: 'WIP', branch: 'main', hash: 'abc123', date: '2024-01-15' },
      ];

      act(() => {
        useGitStore.getState().setStashes(stashes);
      });

      expect(useGitStore.getState().stashes).toEqual(stashes);
    });
  });

  describe('selectCommit', () => {
    it('should select commit by hash', () => {
      act(() => {
        useGitStore.getState().selectCommit('abc123');
      });

      expect(useGitStore.getState().selectedCommitHash).toBe('abc123');
    });

    it('should clear selection with null', () => {
      act(() => {
        useGitStore.getState().selectCommit('abc123');
        useGitStore.getState().selectCommit(null);
      });

      expect(useGitStore.getState().selectedCommitHash).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      act(() => {
        useGitStore.getState().setLoading(true);
      });

      expect(useGitStore.getState().loading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should set error and clear loading', () => {
      act(() => {
        useGitStore.getState().setLoading(true);
        useGitStore.getState().setError('Something went wrong');
      });

      expect(useGitStore.getState().error).toBe('Something went wrong');
      expect(useGitStore.getState().loading).toBe(false);
    });

    it('should clear error', () => {
      act(() => {
        useGitStore.getState().setError('Error');
        useGitStore.getState().clearError();
      });

      expect(useGitStore.getState().error).toBeNull();
    });
  });

  describe('pagination', () => {
    it('should set hasMoreCommits', () => {
      act(() => {
        useGitStore.getState().setHasMoreCommits(false);
      });

      expect(useGitStore.getState().hasMoreCommits).toBe(false);
    });

    it('should set commit offset', () => {
      act(() => {
        useGitStore.getState().setCommitOffset(50);
      });

      expect(useGitStore.getState().commitOffset).toBe(50);
    });

    it('should increment commit offset', () => {
      act(() => {
        useGitStore.getState().setCommitOffset(50);
        useGitStore.getState().incrementCommitOffset(25);
      });

      expect(useGitStore.getState().commitOffset).toBe(75);
    });
  });

  describe('async actions - postMessage', () => {
    it('should post message for fetchCommits', () => {
      act(() => {
        useGitStore.getState().fetchCommits(100, 0);
      });

      expect(useGitStore.getState().loading).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.getCommits',
        limit: 100,
        offset: 0,
      });
    });

    it('should post message for fetchBranches', () => {
      act(() => {
        useGitStore.getState().fetchBranches();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'git.getBranches' });
    });

    it('should post message for fetchStatus', () => {
      act(() => {
        useGitStore.getState().fetchStatus();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'git.getStatus' });
    });

    it('should post message for fetchStashes', () => {
      act(() => {
        useGitStore.getState().fetchStashes();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'git.getStashes' });
    });

    it('should post message for checkout', () => {
      act(() => {
        useGitStore.getState().checkout('develop');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.checkout',
        ref: 'develop',
      });
    });

    it('should post message for createBranch', () => {
      act(() => {
        useGitStore.getState().createBranch('feature/new', 'main');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.createBranch',
        name: 'feature/new',
        startPoint: 'main',
      });
    });

    it('should post message for deleteBranch', () => {
      act(() => {
        useGitStore.getState().deleteBranch('old-branch', true);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.deleteBranch',
        name: 'old-branch',
        force: true,
      });
    });

    it('should post message for mergeBranch', () => {
      act(() => {
        useGitStore.getState().mergeBranch('feature-branch', true);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.merge',
        branch: 'feature-branch',
        noFf: true,
      });
    });

    it('should post message for pull', () => {
      act(() => {
        useGitStore.getState().pull('origin', 'main');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.pull',
        remote: 'origin',
        branch: 'main',
      });
    });

    it('should post message for push', () => {
      act(() => {
        useGitStore.getState().push('origin', 'main', true);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.push',
        remote: 'origin',
        branch: 'main',
        force: true,
      });
    });

    it('should post message for stash operations', () => {
      act(() => {
        useGitStore.getState().stashSave('WIP', true);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.stashSave',
        message: 'WIP',
        includeUntracked: true,
      });

      act(() => {
        useGitStore.getState().stashApply(0);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.stashApply',
        index: 0,
      });

      act(() => {
        useGitStore.getState().stashPop(1);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.stashPop',
        index: 1,
      });

      act(() => {
        useGitStore.getState().stashDrop(2);
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.stashDrop',
        index: 2,
      });
    });

    it('should post message for cherryPick', () => {
      act(() => {
        useGitStore.getState().cherryPick('abc123');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.cherryPick',
        hash: 'abc123',
      });
    });

    it('should post message for reset', () => {
      act(() => {
        useGitStore.getState().reset('abc123', 'hard');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.reset',
        hash: 'abc123',
        mode: 'hard',
      });
    });

    it('should post message for drag operations', () => {
      act(() => {
        useGitStore.getState().rebaseViaDrag('main', 'feature');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.rebaseViaDrag',
        targetBranch: 'main',
        sourceBranch: 'feature',
      });

      act(() => {
        useGitStore.getState().cherryPickViaDrag('abc123', 'main');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'git.cherryPickViaDrag',
        commitHash: 'abc123',
        targetBranch: 'main',
      });
    });

    it('should post message for undo/redo', () => {
      act(() => {
        useGitStore.getState().undo();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'git.undo' });

      act(() => {
        useGitStore.getState().redo();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'git.redo' });
    });
  });

  describe('resetStore', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      act(() => {
        useGitStore.getState().setCurrentBranch('develop');
        useGitStore.getState().setLoading(true);
        useGitStore.getState().setError('Some error');
        useGitStore.getState().setCommitOffset(100);
      });

      // Reset
      act(() => {
        useGitStore.getState().resetStore();
      });

      // Verify reset
      expect(useGitStore.getState().currentBranch).toBeNull();
      expect(useGitStore.getState().loading).toBe(false);
      expect(useGitStore.getState().error).toBeNull();
      expect(useGitStore.getState().commitOffset).toBe(0);
      expect(useGitStore.getState().commits).toEqual([]);
    });
  });
});
