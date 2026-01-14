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

// Main view
export { InteractiveRebaseView } from './InteractiveRebaseView';
export type { InteractiveRebaseViewProps } from './InteractiveRebaseView';

// Commit row
export { CommitRow } from './CommitRow';
export type { CommitRowProps } from './CommitRow';

// Action dropdown
export { ActionDropdown } from './ActionDropdown';
export type { ActionDropdownProps } from './ActionDropdown';

// Preview
export { RebasePreview } from './RebasePreview';
export type { RebasePreviewProps } from './RebasePreview';

// Reword dialog
export { RewordDialog } from './RewordDialog';
export type { RewordDialogProps } from './RewordDialog';

// Squash message editor
export { SquashMessageEditor } from './SquashMessageEditor';
export type { SquashMessageEditorProps } from './SquashMessageEditor';

// Progress indicator
export { RebaseProgress } from './RebaseProgress';
export type { RebaseProgressProps } from './RebaseProgress';

// Conflict resolution
export { RebaseConflict } from './RebaseConflict';
export type { RebaseConflictProps } from './RebaseConflict';

// Types
export type {
  RebaseAction,
  CommitStatus,
  RebaseCommit,
  RebaseState,
  RebaseProgress as RebaseProgressType,
  ConflictInfo,
  ConflictFile,
  ActionLabels,
  ActionTooltips,
} from './types';

// Constants
export {
  ACTION_LABELS,
  ACTION_TOOLTIPS,
  KEYBOARD_SHORTCUTS,
} from './types';

// Hooks
export { useRebaseKeyboard } from './useRebaseKeyboard';
export type { UseRebaseKeyboardOptions } from './useRebaseKeyboard';
