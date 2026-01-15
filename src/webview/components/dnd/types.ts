/**
 * Drag and Drop Types
 * Defines types for drag-and-drop operations in Git Board
 */

import type { GitBranch, GitCommit } from '../../stores/gitStore';

// ============================================================================
// Drag Source Types
// ============================================================================

export type DragSourceType = 'commit' | 'branch' | 'branch-pointer' | 'tag';

export interface DragSourceCommit {
	type: 'commit';
	commit: GitCommit;
	branchName?: string;
}

export interface DragSourceBranch {
	type: 'branch';
	branch: GitBranch;
}

export interface DragSourceBranchPointer {
	type: 'branch-pointer';
	branch: GitBranch;
	commitHash: string;
}

export interface DragSourceTag {
	type: 'tag';
	tagName: string;
	commitHash: string;
}

export type DragSource =
	| DragSourceCommit
	| DragSourceBranch
	| DragSourceBranchPointer
	| DragSourceTag;

// ============================================================================
// Drop Target Types
// ============================================================================

export type DropTargetType = 'commit' | 'branch' | 'empty-space' | 'position';

export interface DropTargetCommit {
	type: 'commit';
	commit: GitCommit;
}

export interface DropTargetBranch {
	type: 'branch';
	branch: GitBranch;
}

export interface DropTargetEmptySpace {
	type: 'empty-space';
	position: { x: number; y: number };
}

export interface DropTargetPosition {
	type: 'position';
	index: number;
	branchName: string;
}

export type DropTarget =
	| DropTargetCommit
	| DropTargetBranch
	| DropTargetEmptySpace
	| DropTargetPosition;

// ============================================================================
// Git Operations
// ============================================================================

export type GitOperation =
	| 'rebase'
	| 'cherry-pick'
	| 'move-branch'
	| 'merge'
	| 'create-branch'
	| 'reorder-commits'
	| 'invalid';

export interface OperationInfo {
	operation: GitOperation;
	isValid: boolean;
	description: string;
	command: string;
	icon: string;
	warning?: string;
}

// ============================================================================
// Operation Mapping
// Based on docs specification:
// | Operation     | Drag Source       | Drop Target  | Git Command        |
// |---------------|-------------------|--------------|---------------------|
// | Rebase        | Branch/Commit     | Commit       | git rebase          |
// | Cherry-pick   | Commit            | Branch       | git cherry-pick     |
// | Move branch   | Branch pointer    | Commit       | git branch -f       |
// | Merge         | Branch            | Branch       | git merge           |
// | Create branch | Commit            | Empty space  | git branch          |
// | Reorder       | Commit            | Position     | git rebase -i       |
// ============================================================================

export const OPERATION_INFO: Record<
	GitOperation,
	Omit<OperationInfo, 'isValid' | 'description' | 'command'>
> = {
	rebase: {
		operation: 'rebase',
		icon: 'git-pull-request-go-to-changes',
	},
	'cherry-pick': {
		operation: 'cherry-pick',
		icon: 'git-cherry-pick',
	},
	'move-branch': {
		operation: 'move-branch',
		icon: 'git-branch',
	},
	merge: {
		operation: 'merge',
		icon: 'git-merge',
	},
	'create-branch': {
		operation: 'create-branch',
		icon: 'git-branch-create',
	},
	'reorder-commits': {
		operation: 'reorder-commits',
		icon: 'list-ordered',
	},
	invalid: {
		operation: 'invalid',
		icon: 'error',
	},
};

// ============================================================================
// Drag State
// ============================================================================

export interface DragState {
	isDragging: boolean;
	source: DragSource | null;
	target: DropTarget | null;
	operation: OperationInfo | null;
	isValidDrop: boolean;
}

export const initialDragState: DragState = {
	isDragging: false,
	source: null,
	target: null,
	operation: null,
	isValidDrop: false,
};

// ============================================================================
// Drag Context
// ============================================================================

export interface DndContextValue {
	dragState: DragState;
	setDragSource: (source: DragSource | null) => void;
	setDropTarget: (target: DropTarget | null) => void;
	startDrag: (source: DragSource) => void;
	endDrag: () => void;
	executeDrop: () => Promise<void>;
}
