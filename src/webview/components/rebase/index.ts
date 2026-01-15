/**
 * Interactive Rebase Components
 * Based on docs/04-UI-UX-DESIGN.md section 2.2
 *
 * Entry Points:
 * - Right-click commit -> "Interactive Rebase from here"
 * - Command Palette -> "Git: Interactive Rebase"
 * - Keyboard 'r' on selected commit
 * - Select multiple commits -> Right-click -> "Rebase Selected"
 */

export type { ActionDropdownProps } from './ActionDropdown';
// Action dropdown
export { ActionDropdown } from './ActionDropdown';
export type { CommitRowProps } from './CommitRow';
// Commit row
export { CommitRow } from './CommitRow';
export type { InteractiveRebaseViewProps } from './InteractiveRebaseView';
// Main view
export { InteractiveRebaseView } from './InteractiveRebaseView';
export type { RebaseConflictProps } from './RebaseConflict';
// Conflict resolution
export { RebaseConflict } from './RebaseConflict';
export type { RebasePreviewProps } from './RebasePreview';
// Preview
export { RebasePreview } from './RebasePreview';
export type { RebaseProgressProps } from './RebaseProgress';
// Progress indicator
export { RebaseProgress } from './RebaseProgress';
export type { RewordDialogProps } from './RewordDialog';
// Reword dialog
export { RewordDialog } from './RewordDialog';
export type { SquashMessageEditorProps } from './SquashMessageEditor';
// Squash message editor
export { SquashMessageEditor } from './SquashMessageEditor';

// Types
export type {
	ActionLabels,
	ActionTooltips,
	CommitStatus,
	ConflictFile,
	ConflictInfo,
	RebaseAction,
	RebaseCommit,
	RebaseProgress as RebaseProgressType,
	RebaseState,
} from './types';

// Constants
export {
	ACTION_LABELS,
	ACTION_TOOLTIPS,
	KEYBOARD_SHORTCUTS,
} from './types';
export type { UseRebaseKeyboardOptions } from './useRebaseKeyboard';
// Hooks
export { useRebaseKeyboard } from './useRebaseKeyboard';
