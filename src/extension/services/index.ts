/**
 * Services barrel export
 */

export {
	GitError,
	GitErrorCode,
	hasConflicts,
	isGitError,
	parseGitError,
} from './GitError';
export { createGitService, GitService } from './GitService';
export type {
	SimpleGitBranchSummary,
	SimpleGitDiffSummary,
	SimpleGitLogEntry,
	SimpleGitRemote,
	SimpleGitStashEntry,
	SimpleGitStatusResult,
} from './GitService.types';
