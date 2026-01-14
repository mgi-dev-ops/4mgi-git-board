/**
 * useDragOperation - Hook to determine Git operation based on drag source/target
 *
 * Operation mapping from docs:
 * | Operation       | Drag Source       | Drop Target   | Git Command        |
 * |-----------------|-------------------|---------------|---------------------|
 * | Rebase          | Branch/Commit     | Commit        | git rebase          |
 * | Cherry-pick     | Commit            | Branch        | git cherry-pick     |
 * | Move branch     | Branch pointer    | Commit        | git branch -f       |
 * | Merge           | Branch            | Branch        | git merge           |
 * | Create branch   | Commit            | Empty space   | git branch          |
 * | Reorder commits | Commit            | Position      | git rebase -i       |
 */

import { useCallback, useMemo } from 'react';

import type {
  DragSource,
  DropTarget,
  OperationInfo,
  GitOperation,
} from '../components/dnd/types';
import { useGitStore } from '../stores/gitStore';

// ============================================================================
// Types
// ============================================================================

export interface DragOperationHook {
  /** Determine the operation based on source and target */
  determineOperation: (source: DragSource, target: DropTarget) => OperationInfo;
  /** Check if an operation is dangerous (requires confirmation) */
  isDangerousOperation: (operation: GitOperation) => boolean;
  /** Get warning message for an operation */
  getOperationWarning: (source: DragSource, target: DropTarget) => string | undefined;
  /** Generate the git command that would be executed */
  generateCommand: (source: DragSource, target: DropTarget, operation: GitOperation) => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDragOperation(): DragOperationHook {
  const currentBranch = useGitStore((state) => state.currentBranch);
  const commits = useGitStore((state) => state.commits);

  /**
   * Determine which git operation should be performed based on source and target
   */
  const determineOperation = useCallback(
    (source: DragSource, target: DropTarget): OperationInfo => {
      // Commit -> Commit = Rebase
      if (source.type === 'commit' && target.type === 'commit') {
        return createRebaseOperation(source, target);
      }

      // Branch -> Commit = Rebase
      if (source.type === 'branch' && target.type === 'commit') {
        return createBranchRebaseOperation(source, target);
      }

      // Commit -> Branch = Cherry-pick
      if (source.type === 'commit' && target.type === 'branch') {
        return createCherryPickOperation(source, target, currentBranch);
      }

      // Branch pointer -> Commit = Move branch
      if (source.type === 'branch-pointer' && target.type === 'commit') {
        return createMoveBranchOperation(source, target);
      }

      // Branch -> Branch = Merge
      if (source.type === 'branch' && target.type === 'branch') {
        return createMergeOperation(source, target, currentBranch);
      }

      // Commit -> Empty space = Create branch
      if (source.type === 'commit' && target.type === 'empty-space') {
        return createCreateBranchOperation(source);
      }

      // Commit -> Position = Reorder commits
      if (source.type === 'commit' && target.type === 'position') {
        return createReorderOperation(source, target);
      }

      // Invalid operation
      return {
        operation: 'invalid',
        isValid: false,
        description: 'Invalid operation',
        command: '',
        icon: 'error',
      };
    },
    [currentBranch]
  );

  /**
   * Check if an operation is dangerous and requires confirmation
   */
  const isDangerousOperation = useCallback((operation: GitOperation): boolean => {
    const dangerousOps: GitOperation[] = [
      'rebase',
      'move-branch',
      'reorder-commits',
    ];
    return dangerousOps.includes(operation);
  }, []);

  /**
   * Get warning message for potentially dangerous operations
   */
  const getOperationWarning = useCallback(
    (source: DragSource, target: DropTarget): string | undefined => {
      const operation = determineOperation(source, target);

      if (!operation.isValid) {
        return undefined;
      }

      switch (operation.operation) {
        case 'rebase':
          return 'Rebase will rewrite commit history. This can cause issues if the branch has been pushed.';
        case 'move-branch':
          return 'Moving a branch pointer will change where the branch points to. Use with caution.';
        case 'reorder-commits':
          return 'Reordering commits will rewrite history. This is a destructive operation.';
        case 'merge':
          if (source.type === 'branch' && target.type === 'branch') {
            const sourceBranch = source.branch;
            const targetBranch = target.branch;
            if (sourceBranch.isRemote || targetBranch.isRemote) {
              return 'Merging remote branches may require pulling first.';
            }
          }
          return undefined;
        default:
          return undefined;
      }
    },
    [determineOperation]
  );

  /**
   * Generate the git command that would be executed
   */
  const generateCommand = useCallback(
    (source: DragSource, target: DropTarget, operation: GitOperation): string => {
      switch (operation) {
        case 'rebase':
          if (target.type === 'commit') {
            return `git rebase ${target.commit.hash}`;
          }
          return 'git rebase';

        case 'cherry-pick':
          if (source.type === 'commit') {
            return `git cherry-pick ${source.commit.hash}`;
          }
          return 'git cherry-pick';

        case 'move-branch':
          if (source.type === 'branch-pointer' && target.type === 'commit') {
            return `git branch -f ${source.branch.name} ${target.commit.hash}`;
          }
          return 'git branch -f';

        case 'merge':
          if (source.type === 'branch') {
            return `git merge ${source.branch.name}`;
          }
          return 'git merge';

        case 'create-branch':
          if (source.type === 'commit') {
            return `git branch <new-branch-name> ${source.commit.hash}`;
          }
          return 'git branch';

        case 'reorder-commits':
          return 'git rebase -i';

        default:
          return '';
      }
    },
    []
  );

  return {
    determineOperation,
    isDangerousOperation,
    getOperationWarning,
    generateCommand,
  };
}

// ============================================================================
// Operation Factory Functions
// ============================================================================

function createRebaseOperation(
  source: { type: 'commit'; commit: { hash: string; shortHash: string; message: string }; branchName?: string },
  target: { type: 'commit'; commit: { hash: string; shortHash: string } }
): OperationInfo {
  // Cannot rebase onto the same commit
  if (source.commit.hash === target.commit.hash) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Cannot rebase commit onto itself',
      command: '',
      icon: 'error',
    };
  }

  return {
    operation: 'rebase',
    isValid: true,
    description: `Rebase ${source.commit.shortHash} onto ${target.commit.shortHash}`,
    command: `git rebase ${target.commit.hash}`,
    icon: 'git-pull-request-go-to-changes',
    warning: 'This will rewrite commit history',
  };
}

function createBranchRebaseOperation(
  source: { type: 'branch'; branch: { name: string; isRemote: boolean } },
  target: { type: 'commit'; commit: { hash: string; shortHash: string } }
): OperationInfo {
  // Cannot rebase remote branches directly
  if (source.branch.isRemote) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Cannot rebase remote branch directly',
      command: '',
      icon: 'error',
    };
  }

  return {
    operation: 'rebase',
    isValid: true,
    description: `Rebase ${source.branch.name} onto ${target.commit.shortHash}`,
    command: `git rebase ${target.commit.hash} ${source.branch.name}`,
    icon: 'git-pull-request-go-to-changes',
    warning: 'This will rewrite commit history',
  };
}

function createCherryPickOperation(
  source: { type: 'commit'; commit: { hash: string; shortHash: string; message: string } },
  target: { type: 'branch'; branch: { name: string; isHead: boolean } },
  currentBranch: string | null
): OperationInfo {
  const needsCheckout = !target.branch.isHead && target.branch.name !== currentBranch;

  return {
    operation: 'cherry-pick',
    isValid: true,
    description: `Cherry-pick ${source.commit.shortHash} to ${target.branch.name}`,
    command: needsCheckout
      ? `git checkout ${target.branch.name} && git cherry-pick ${source.commit.hash}`
      : `git cherry-pick ${source.commit.hash}`,
    icon: 'git-cherry-pick',
    warning: needsCheckout ? 'Will checkout to target branch first' : undefined,
  };
}

function createMoveBranchOperation(
  source: { type: 'branch-pointer'; branch: { name: string; isRemote: boolean }; commitHash: string },
  target: { type: 'commit'; commit: { hash: string; shortHash: string } }
): OperationInfo {
  // Cannot move remote branch pointers
  if (source.branch.isRemote) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Cannot move remote branch pointer',
      command: '',
      icon: 'error',
    };
  }

  // No change if same commit
  if (source.commitHash === target.commit.hash) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Branch already points to this commit',
      command: '',
      icon: 'error',
    };
  }

  return {
    operation: 'move-branch',
    isValid: true,
    description: `Move ${source.branch.name} to ${target.commit.shortHash}`,
    command: `git branch -f ${source.branch.name} ${target.commit.hash}`,
    icon: 'git-branch',
    warning: 'This will force-move the branch pointer',
  };
}

function createMergeOperation(
  source: { type: 'branch'; branch: { name: string; isRemote: boolean } },
  target: { type: 'branch'; branch: { name: string; isHead: boolean } },
  currentBranch: string | null
): OperationInfo {
  // Cannot merge branch into itself
  if (source.branch.name === target.branch.name) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Cannot merge branch into itself',
      command: '',
      icon: 'error',
    };
  }

  const needsCheckout = !target.branch.isHead && target.branch.name !== currentBranch;

  return {
    operation: 'merge',
    isValid: true,
    description: `Merge ${source.branch.name} into ${target.branch.name}`,
    command: needsCheckout
      ? `git checkout ${target.branch.name} && git merge ${source.branch.name}`
      : `git merge ${source.branch.name}`,
    icon: 'git-merge',
    warning: needsCheckout ? 'Will checkout to target branch first' : undefined,
  };
}

function createCreateBranchOperation(
  source: { type: 'commit'; commit: { hash: string; shortHash: string } }
): OperationInfo {
  return {
    operation: 'create-branch',
    isValid: true,
    description: `Create new branch at ${source.commit.shortHash}`,
    command: `git branch <branch-name> ${source.commit.hash}`,
    icon: 'git-branch-create',
  };
}

function createReorderOperation(
  source: { type: 'commit'; commit: { hash: string; shortHash: string }; branchName?: string },
  target: { type: 'position'; index: number; branchName: string }
): OperationInfo {
  // Must be same branch for reordering
  if (source.branchName && source.branchName !== target.branchName) {
    return {
      operation: 'invalid',
      isValid: false,
      description: 'Cannot reorder commits across branches',
      command: '',
      icon: 'error',
    };
  }

  return {
    operation: 'reorder-commits',
    isValid: true,
    description: `Reorder ${source.commit.shortHash} to position ${target.index}`,
    command: 'git rebase -i',
    icon: 'list-ordered',
    warning: 'This will start an interactive rebase',
  };
}

export default useDragOperation;
