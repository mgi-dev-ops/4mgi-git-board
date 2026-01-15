/**
 * GitService Unit Tests
 * Tests for Git operations wrapper
 */

import * as path from 'node:path';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from 'vitest';

// Create mock git instance
const mockGit = {
	checkIsRepo: vi.fn(),
	getRemotes: vi.fn(),
	status: vi.fn(),
	raw: vi.fn(),
	log: vi.fn(),
	branchLocal: vi.fn(),
	branch: vi.fn(),
	checkout: vi.fn(),
	checkoutBranch: vi.fn(),
	checkoutLocalBranch: vi.fn(),
	merge: vi.fn(),
	rebase: vi.fn(),
	add: vi.fn(),
	reset: vi.fn(),
	commit: vi.fn(),
	diff: vi.fn(),
	diffSummary: vi.fn(),
	fetch: vi.fn(),
	pull: vi.fn(),
	push: vi.fn(),
};

// Mock simple-git module
vi.mock('simple-git', () => ({
	default: vi.fn(() => mockGit),
}));

// Mock fs module
vi.mock('fs', () => ({
	existsSync: vi.fn(),
	unlinkSync: vi.fn(),
	promises: {
		readFile: vi.fn(),
	},
}));

// Import after mocks are set up
import * as fs from 'node:fs';
import {
	createGitService,
	GitError,
	GitErrorCode,
	GitService,
} from '../GitService';

describe('GitService', () => {
	let gitService: GitService;
	const testWorkspace = '/test/workspace';

	beforeEach(() => {
		vi.clearAllMocks();
		gitService = createGitService(testWorkspace);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('constructor', () => {
		it('should create GitService instance with correct workspace path', () => {
			expect(gitService.getWorkspacePath()).toBe(testWorkspace);
		});

		it('should initialize simple-git with correct options', async () => {
			const simpleGitModule = await import('simple-git');
			expect(simpleGitModule.default).toHaveBeenCalledWith(
				expect.objectContaining({
					baseDir: testWorkspace,
					binary: 'git',
					maxConcurrentProcesses: 6,
					trimmed: true,
				}),
			);
		});
	});

	describe('getRepositoryInfo', () => {
		it('should return repository info for valid git repo', async () => {
			mockGit.checkIsRepo.mockResolvedValue(true);
			mockGit.getRemotes.mockResolvedValue([
				{
					name: 'origin',
					refs: {
						fetch: 'https://github.com/test/repo.git',
						push: 'https://github.com/test/repo.git',
					},
				},
			]);
			mockGit.raw.mockImplementation((args: string[]) => {
				if (args.includes('--is-shallow-repository'))
					return Promise.resolve('false');
				if (args.includes('--is-bare-repository'))
					return Promise.resolve('false');
				return Promise.resolve('');
			});
			(fs.existsSync as Mock).mockReturnValue(false);

			const info = await gitService.getRepositoryInfo();

			expect(info.isGitRepository).toBe(true);
			expect(info.path).toBe(testWorkspace);
			expect(info.name).toBe('workspace');
			expect(info.remotes).toHaveLength(1);
			expect(info.remotes[0].name).toBe('origin');
		});

		it('should throw error if not a git repository', async () => {
			mockGit.checkIsRepo.mockResolvedValue(false);

			await expect(gitService.getRepositoryInfo()).rejects.toThrow(GitError);
		});
	});

	describe('getStatus', () => {
		it('should return status with staged and unstaged files', async () => {
			mockGit.status.mockResolvedValue({
				current: 'main',
				tracking: 'origin/main',
				files: [
					{ path: 'file1.ts', index: 'M', working_dir: ' ' },
					{ path: 'file2.ts', index: ' ', working_dir: 'M' },
				],
				staged: ['file1.ts'],
				modified: ['file2.ts'],
				created: [],
				deleted: [],
				renamed: [],
				conflicted: [],
				not_added: [],
				isClean: () => false,
			});

			const status = await gitService.getStatus();

			expect(status.current).toBe('main');
			// staged is array of FileChange objects
			expect(status.staged.some((f: any) => f.path === 'file1.ts')).toBe(true);
		});
	});

	describe('getLog', () => {
		it('should return commits with correct format', async () => {
			mockGit.raw.mockResolvedValue(
				'abc123|abc123|Initial commit|Body text|John Doe|john@example.com|2024-01-15T10:00:00Z|parent1|HEAD -> main',
			);

			const commits = await gitService.getLog({ limit: 10 });

			expect(commits).toHaveLength(1);
			expect(commits[0].sha).toBe('abc123');
			expect(commits[0].message).toBe('Initial commit');
			expect(commits[0].author.name).toBe('John Doe');
		});

		it('should return empty array for empty repo', async () => {
			mockGit.raw.mockResolvedValue('');

			const commits = await gitService.getLog();

			expect(commits).toEqual([]);
		});

		it('should apply log options correctly', async () => {
			mockGit.raw.mockResolvedValue('');

			await gitService.getLog({
				limit: 50,
				author: 'john',
				since: '2024-01-01',
				until: '2024-12-31',
				branch: 'develop',
			});

			expect(mockGit.raw).toHaveBeenCalledWith(
				expect.arrayContaining([
					'log',
					'develop',
					expect.stringContaining('-n50'),
					expect.stringContaining('--author=john'),
					expect.stringContaining('--since=2024-01-01'),
					expect.stringContaining('--until=2024-12-31'),
				]),
			);
		});
	});

	describe('commit', () => {
		it('should create commit with message', async () => {
			mockGit.commit.mockResolvedValue({ commit: 'abc123' });

			const result = await gitService.commit('Test commit');

			expect(result).toBe('abc123');
			expect(mockGit.commit).toHaveBeenCalledWith(
				'Test commit',
				[],
				expect.arrayContaining(['-m', 'Test commit']),
			);
		});

		it('should stage files before commit if provided', async () => {
			mockGit.add.mockResolvedValue(undefined);
			mockGit.commit.mockResolvedValue({ commit: 'abc123' });

			await gitService.commit('Test commit', ['file1.ts', 'file2.ts']);

			expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);
		});

		it('should support amend option', async () => {
			mockGit.commit.mockResolvedValue({ commit: 'abc123' });

			await gitService.commit('Amended message', [], { amend: true });

			expect(mockGit.commit).toHaveBeenCalledWith(
				'Amended message',
				[],
				expect.arrayContaining(['--amend']),
			);
		});
	});

	describe('getBranches', () => {
		it('should return local and remote branches', async () => {
			mockGit.branchLocal.mockResolvedValue({
				all: ['main', 'develop'],
				branches: {
					main: {
						current: true,
						name: 'main',
						commit: 'abc123',
						label: 'main',
					},
					develop: {
						current: false,
						name: 'develop',
						commit: 'def456',
						label: 'develop',
					},
				},
				current: 'main',
			});
			mockGit.branch.mockResolvedValue({
				all: ['origin/main', 'origin/develop'],
				branches: {
					'origin/main': {
						current: false,
						name: 'origin/main',
						commit: 'abc123',
						label: 'origin/main',
					},
					'origin/develop': {
						current: false,
						name: 'origin/develop',
						commit: 'def456',
						label: 'origin/develop',
					},
				},
				current: '',
			});
			mockGit.raw.mockResolvedValue('');

			const branches = await gitService.getBranches();

			// Should have both local and remote branches
			expect(branches.length).toBeGreaterThan(0);
			// Verify branches were fetched from both local and remote
			expect(mockGit.branchLocal).toHaveBeenCalled();
			expect(mockGit.branch).toHaveBeenCalledWith(['-r']);
		});
	});

	describe('checkout', () => {
		it('should checkout a branch', async () => {
			mockGit.checkout.mockResolvedValue(undefined);

			await gitService.checkout('develop');

			expect(mockGit.checkout).toHaveBeenCalledWith('develop');
		});

		it('should throw error on checkout failure', async () => {
			mockGit.checkout.mockRejectedValue(new Error('pathspec not found'));

			await expect(gitService.checkout('nonexistent')).rejects.toThrow();
		});
	});

	describe('createBranch', () => {
		it('should create and checkout new branch', async () => {
			mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

			await gitService.createBranch('feature/new-feature');

			expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith(
				'feature/new-feature',
			);
		});

		it('should create branch from specific commit', async () => {
			mockGit.checkoutBranch.mockResolvedValue(undefined);

			await gitService.createBranch('feature/from-commit', 'abc123');

			expect(mockGit.checkoutBranch).toHaveBeenCalledWith(
				'feature/from-commit',
				'abc123',
			);
		});
	});

	describe('deleteBranch', () => {
		it('should delete branch with -d flag by default', async () => {
			mockGit.branch.mockResolvedValue(undefined);

			await gitService.deleteBranch('old-branch');

			expect(mockGit.branch).toHaveBeenCalledWith(['-d', 'old-branch']);
		});

		it('should use -D flag when force is true', async () => {
			mockGit.branch.mockResolvedValue(undefined);

			await gitService.deleteBranch('unmerged-branch', true);

			expect(mockGit.branch).toHaveBeenCalledWith(['-D', 'unmerged-branch']);
		});
	});

	describe('merge', () => {
		it('should merge branch successfully', async () => {
			mockGit.merge.mockResolvedValue(undefined);
			mockGit.log.mockResolvedValue({ latest: { hash: 'merge123' } });

			const result = await gitService.merge('feature-branch');

			expect(result.success).toBe(true);
			expect(result.mergeCommit).toBe('merge123');
		});

		it('should handle merge conflicts', async () => {
			const conflictError = new Error('CONFLICT (content): Merge conflict');
			(conflictError as any).git = { conflicts: ['file.ts'] };
			mockGit.merge.mockRejectedValue(conflictError);
			mockGit.status.mockResolvedValue({
				current: 'main',
				conflicted: ['file.ts'],
				files: [],
				staged: [],
				modified: [],
				created: [],
				deleted: [],
				renamed: [],
				not_added: [],
				isClean: () => false,
			});

			const result = await gitService.merge('feature-branch');

			expect(result.success).toBe(false);
			expect(result.conflicts).toContain('file.ts');
		});
	});

	describe('stage/unstage', () => {
		it('should stage files', async () => {
			mockGit.add.mockResolvedValue(undefined);

			await gitService.stage(['file1.ts', 'file2.ts']);

			expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);
		});

		it('should unstage files', async () => {
			mockGit.reset.mockResolvedValue(undefined);

			await gitService.unstage(['file1.ts']);

			expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', '--', 'file1.ts']);
		});

		it('should stage all files', async () => {
			mockGit.add.mockResolvedValue(undefined);

			await gitService.stageAll();

			expect(mockGit.add).toHaveBeenCalledWith(['-A']);
		});
	});

	describe('stash operations', () => {
		it('should list stashes', async () => {
			mockGit.raw.mockResolvedValue(
				'abc123|2024-01-15T10:00:00Z|WIP on main: initial commit\ndef456|2024-01-14T09:00:00Z|stash@{1}: On main: test stash',
			);

			const stashes = await gitService.stashList();

			expect(stashes).toHaveLength(2);
		});

		it('should create stash with message', async () => {
			mockGit.raw.mockResolvedValue(undefined);

			await gitService.stashCreate('My stash message');

			expect(mockGit.raw).toHaveBeenCalledWith([
				'stash',
				'push',
				'-m',
				'My stash message',
			]);
		});

		it('should apply stash by index', async () => {
			mockGit.raw.mockResolvedValue(undefined);

			await gitService.stashApply(1);

			expect(mockGit.raw).toHaveBeenCalledWith(['stash', 'apply', 'stash@{1}']);
		});

		it('should pop stash by index', async () => {
			mockGit.raw.mockResolvedValue(undefined);

			await gitService.stashPop(0);

			expect(mockGit.raw).toHaveBeenCalledWith(['stash', 'pop', 'stash@{0}']);
		});

		it('should drop stash by index', async () => {
			mockGit.raw.mockResolvedValue(undefined);

			await gitService.stashDrop(2);

			expect(mockGit.raw).toHaveBeenCalledWith(['stash', 'drop', 'stash@{2}']);
		});
	});

	describe('remote operations', () => {
		it('should fetch from remote', async () => {
			mockGit.fetch.mockResolvedValue(undefined);

			await gitService.fetch('origin', true);

			expect(mockGit.fetch).toHaveBeenCalledWith(['origin', '--prune']);
		});

		it('should pull from remote', async () => {
			mockGit.pull.mockResolvedValue(undefined);

			await gitService.pull('origin', 'main', true);

			expect(mockGit.pull).toHaveBeenCalledWith('origin', 'main', ['--rebase']);
		});

		it('should push to remote', async () => {
			mockGit.push.mockResolvedValue(undefined);

			await gitService.push('origin', 'main', {
				force: true,
				setUpstream: true,
			});

			expect(mockGit.push).toHaveBeenCalledWith([
				'--force',
				'-u',
				'origin',
				'main',
			]);
		});
	});

	describe('utility methods', () => {
		it('should check if repo is locked', () => {
			(fs.existsSync as Mock).mockReturnValue(true);

			expect(gitService.isLocked()).toBe(true);
		});

		it('should remove lock file', () => {
			(fs.existsSync as Mock).mockReturnValue(true);

			gitService.removeLock();

			expect(fs.unlinkSync).toHaveBeenCalledWith(
				path.join(testWorkspace, '.git', 'index.lock'),
			);
		});
	});
});

describe('GitError', () => {
	it('should create GitError with correct code', () => {
		const error = new GitError(GitErrorCode.NOT_A_REPOSITORY);
		expect(error.code).toBe(GitErrorCode.NOT_A_REPOSITORY);
		expect(error).toBeInstanceOf(Error);
	});

	it('should create GitError with code', () => {
		const error = new GitError(GitErrorCode.MERGE_CONFLICT);
		expect(error.code).toBe(GitErrorCode.MERGE_CONFLICT);
		expect(error.message).toBeTruthy(); // Has default message
	});
});

describe('createGitService factory', () => {
	it('should create GitService instance', () => {
		const service = createGitService('/some/path');
		expect(service).toBeInstanceOf(GitService);
		expect(service.getWorkspacePath()).toBe('/some/path');
	});
});
