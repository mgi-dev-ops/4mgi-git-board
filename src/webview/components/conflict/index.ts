/**
 * Conflict Resolution Components
 * Export all conflict-related components for easy importing
 */

export { ConflictResolutionView } from "./ConflictResolutionView";
export type {
  ConflictResolutionViewProps,
  ConflictStateInfo,
  ThreeWayDiffData,
} from "./ConflictResolutionView";

export { ConflictFileList } from "./ConflictFileList";
export type {
  ConflictFileListProps,
  ConflictedFileInfo,
} from "./ConflictFileList";

export { ThreeWayDiff } from "./ThreeWayDiff";
export type {
  ThreeWayDiffProps,
  DiffLine,
  ConflictHunkDisplay,
} from "./ThreeWayDiff";

export { HunkActions } from "./HunkActions";
export type { HunkActionsProps, HunkResolution } from "./HunkActions";

export { ConflictActions } from "./ConflictActions";
export type { ConflictActionsProps, ConflictOperation } from "./ConflictActions";
