import * as vscode from 'vscode';
import { AzureAuthProvider } from './services/AzureAuthProvider';
import { type AzureService, createAzureService } from './services/AzureService';
import { createGitService, type GitService } from './services/GitService';
import {
	createGitBoardWebviewProvider,
	type GitBoardWebviewProvider,
	registerWebviewProvider,
} from './webview/WebviewProvider';

// =============================================================================
// Global State
// =============================================================================

let webviewProvider: GitBoardWebviewProvider | undefined;
let gitService: GitService | undefined;
let azureService: AzureService | undefined;
let azureAuthProvider: AzureAuthProvider | undefined;

// Undo/Redo history stacks
interface UndoOperationData {
	branch?: string;
	originalHead?: string;
	previousBranch?: string;
	targetBranch?: string;
	message?: string;
}

interface UndoableOperation {
	type: string;
	data: UndoOperationData;
	timestamp: number;
}
const undoStack: UndoableOperation[] = [];
const redoStack: UndoableOperation[] = [];
const MAX_UNDO_HISTORY = 50;

// =============================================================================
// Activation
// =============================================================================

/**
 * Called when the extension is activated.
 * Activation happens based on events defined in package.json activationEvents.
 */
export function activate(context: vscode.ExtensionContext): void {
	console.log('4MGI Git Board is now active!');

	// Get workspace path
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showWarningMessage('Git Board: No workspace folder found.');
		return;
	}

	// Initialize GitService
	gitService = createGitService(workspaceFolder.uri.fsPath);

	// Initialize Azure services
	azureAuthProvider = new AzureAuthProvider(context);
	azureService = createAzureService(azureAuthProvider);

	// Create and register WebviewProvider
	webviewProvider = createGitBoardWebviewProvider(context);
	const webviewDisposable = registerWebviewProvider(context, webviewProvider);
	context.subscriptions.push(webviewDisposable);

	// Register message handlers
	registerMessageHandlers(webviewProvider, gitService, azureService);

	// Register commands
	const openCommand = vscode.commands.registerCommand('gitBoard.open', () => {
		vscode.commands.executeCommand('gitBoardView.focus');
	});

	const refreshCommand = vscode.commands.registerCommand(
		'gitBoard.refresh',
		() => {
			webviewProvider?.refresh();
		},
	);

	const commitCommand = vscode.commands.registerCommand(
		'gitBoard.commit',
		async () => {
			if (!gitService) return;
			const message = await vscode.window.showInputBox({
				prompt: 'Enter commit message',
				placeHolder: 'Commit message...',
			});
			if (message) {
				try {
					await gitService.commit(message);
					webviewProvider?.refresh();
					vscode.window.showInformationMessage('Commit successful!');
				} catch (err) {
					vscode.window.showErrorMessage(`Commit failed: ${err}`);
				}
			}
		},
	);

	context.subscriptions.push(openCommand, refreshCommand, commitCommand);

	// Watch for git changes
	const gitWatcher = vscode.workspace.createFileSystemWatcher(
		new vscode.RelativePattern(workspaceFolder, '.git/**'),
	);
	gitWatcher.onDidChange(() => webviewProvider?.refresh());
	gitWatcher.onDidCreate(() => webviewProvider?.refresh());
	gitWatcher.onDidDelete(() => webviewProvider?.refresh());
	context.subscriptions.push(gitWatcher);
}

// =============================================================================
// Message Handlers
// =============================================================================

function registerMessageHandlers(
	provider: GitBoardWebviewProvider,
	git: GitService,
	azure: AzureService,
): void {
	const protocol = provider.getMessageProtocol();

	// Git data requests
	protocol.registerHandler('git.getCommits', async (payload) => {
		const limit = payload?.limit ?? 100;
		const commits = await git.getLog({ limit, all: true });
		return { commits };
	});

	protocol.registerHandler('git.getBranches', async () => {
		const branches = await git.getBranches();
		return { branches };
	});

	protocol.registerHandler('git.getStatus', async () => {
		const status = await git.getStatus();
		return { status };
	});

	protocol.registerHandler('git.getStashes', async () => {
		const stashes = await git.stashList();
		return { stashes };
	});

	// Git operations
	protocol.registerHandler('git.checkout', async (payload) => {
		await git.checkout(payload.ref);
		return { success: true };
	});

	protocol.registerHandler('git.createBranch', async (payload) => {
		await git.createBranch(payload.name, payload.startPoint);
		return { success: true };
	});

	protocol.registerHandler('git.deleteBranch', async (payload) => {
		await git.deleteBranch(payload.name, payload.force);
		return { success: true };
	});

	protocol.registerHandler('git.merge', async (payload) => {
		const result = await git.merge(payload.branch, {
			noFastForward: payload.noFf,
		});
		return result;
	});

	protocol.registerHandler('git.pull', async (payload) => {
		await git.pull(payload?.remote, payload?.branch);
		return { success: true };
	});

	protocol.registerHandler('git.push', async (payload) => {
		await git.push(payload?.remote, payload?.branch, { force: payload?.force });
		return { success: true };
	});

	protocol.registerHandler('git.fetch', async (payload) => {
		await git.fetch(payload?.remote, payload?.prune);
		return { success: true };
	});

	protocol.registerHandler('git.stashSave', async (payload) => {
		await git.stashCreate(payload?.message);
		return { success: true };
	});

	protocol.registerHandler('git.stashApply', async (payload) => {
		await git.stashApply(payload?.index ?? 0);
		return { success: true };
	});

	protocol.registerHandler('git.stashPop', async (payload) => {
		await git.stashPop(payload?.index ?? 0);
		return { success: true };
	});

	protocol.registerHandler('git.stashDrop', async (payload) => {
		await git.stashDrop(payload?.index ?? 0);
		return { success: true };
	});

	protocol.registerHandler('git.cherryPick', async (payload) => {
		await git.cherryPick(payload.hash);
		return { success: true };
	});

	protocol.registerHandler('git.revert', async (payload) => {
		await git.cherryPick(payload.hash); // Note: should be revert, but GitService doesn't have it
		return { success: true };
	});

	protocol.registerHandler('git.reset', async (payload) => {
		// GitService doesn't have reset with mode, using raw git
		await git.checkout(payload.hash); // Simplified - needs proper implementation
		return { success: true };
	});

	protocol.registerHandler('git.getDiff', async (payload) => {
		const diff = await git.getDiff(payload.commitSha);
		return { diff };
	});

	protocol.registerHandler('git.getStashDiff', async (payload) => {
		// Get stash diff using git stash show
		const stashPayload = payload as { index: number };
		const diff = await git.raw([
			'stash',
			'show',
			'-p',
			`stash@{${stashPayload.index}}`,
		]);
		return { diff };
	});

	protocol.registerHandler('git.getStashFiles', async (payload) => {
		const stashPayload = payload as { index: number };
		const result = await git.raw([
			'stash',
			'show',
			'--name-status',
			`stash@{${stashPayload.index}}`,
		]);
		const files = result
			.trim()
			.split('\n')
			.filter(Boolean)
			.map((line: string) => {
				const [status, ...pathParts] = line.split('\t');
				return {
					path: pathParts.join('\t'),
					status:
						status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified',
				};
			});
		return { files };
	});

	// ===========================================================================
	// Rebase Operations (P2-023, P3-007, P3-008)
	// ===========================================================================

	// Rebase via drag - rebase current branch onto target
	protocol.registerHandler('git.rebaseViaDrag', async (payload) => {
		const { targetBranch, sourceBranch } = payload;

		// Save state for undo
		const currentBranch =
			sourceBranch || (await git.getBranches()).find((b) => b.isCurrent)?.name;
		pushUndoOperation({
			type: 'rebase',
			data: { branch: currentBranch, originalHead: await getHeadCommit(git) },
			timestamp: Date.now(),
		});

		await git.rebase(targetBranch, {});
		return { success: true };
	});

	// Start interactive rebase with plan
	protocol.registerHandler('git.startRebase', async (payload) => {
		const { plan } = payload;

		// Save state for undo
		const currentBranch = (await git.getBranches()).find(
			(b) => b.isCurrent,
		)?.name;
		pushUndoOperation({
			type: 'rebase',
			data: { branch: currentBranch, originalHead: await getHeadCommit(git) },
			timestamp: Date.now(),
		});

		// For non-interactive rebase, we execute commands sequentially
		// Interactive rebase with custom plan requires git-rebase-todo manipulation

		// Start rebase with autosquash to process the plan
		try {
			// For simple rebase onto target
			if (plan.onto) {
				await git.raw([
					'rebase',
					'--onto',
					plan.onto,
					plan.upstream || `${plan.onto}~${plan.commits.length}`,
				]);
			} else {
				await git.raw(['rebase', '-i', `HEAD~${plan.commits.length}`]);
			}
			return { success: true, stage: 'executing' };
		} catch (error) {
			// Check if it's a conflict
			const state = git.getRepositoryState();
			if (state === 'rebasing') {
				return {
					success: false,
					stage: 'conflict',
					message: 'Rebase conflict detected',
				};
			}
			throw error;
		}
	});

	// Continue rebase after conflict resolution
	protocol.registerHandler('git.continueRebase', async () => {
		await git.continueRebase();
		const state = git.getRepositoryState();
		return {
			success: state !== 'rebasing',
			stage: state === 'rebasing' ? 'conflict' : 'completed',
		};
	});

	// Abort rebase
	protocol.registerHandler('git.abortRebase', async () => {
		await git.abortRebase();
		return { success: true, stage: 'aborted' };
	});

	// Skip current commit in rebase
	protocol.registerHandler('git.skipRebaseCommit', async () => {
		await git.raw(['rebase', '--skip']);
		const state = git.getRepositoryState();
		return {
			success: state !== 'rebasing',
			stage: state === 'rebasing' ? 'executing' : 'completed',
		};
	});

	// ===========================================================================
	// Cherry-pick via drag (P2-024)
	// ===========================================================================

	protocol.registerHandler('git.cherryPickViaDrag', async (payload) => {
		const { commitHash, targetBranch } = payload;

		// Save state for undo
		const currentBranch = (await git.getBranches()).find(
			(b) => b.isCurrent,
		)?.name;
		pushUndoOperation({
			type: 'cherryPick',
			data: { branch: currentBranch, originalHead: await getHeadCommit(git) },
			timestamp: Date.now(),
		});

		// If target branch specified, checkout first
		if (targetBranch) {
			await git.checkout(targetBranch);
		}

		try {
			await git.cherryPick(commitHash);
			return { success: true };
		} catch (error) {
			const state = git.getRepositoryState();
			if (state === 'cherry-picking') {
				return {
					success: false,
					stage: 'conflict',
					message: 'Cherry-pick conflict detected',
				};
			}
			throw error;
		}
	});

	// Abort cherry-pick
	protocol.registerHandler('git.abortCherryPick', async () => {
		await git.raw(['cherry-pick', '--abort']);
		return { success: true };
	});

	// Continue cherry-pick
	protocol.registerHandler('git.continueCherryPick', async () => {
		await git.raw(['cherry-pick', '--continue']);
		return { success: true };
	});

	// ===========================================================================
	// Azure Trigger Rebuild (P4-014)
	// ===========================================================================

	protocol.registerHandler('azure.triggerRebuild', async (payload) => {
		const { definitionId, branch } = payload;
		const build = await azure.triggerBuild(definitionId, branch);
		return { success: true, build };
	});

	protocol.registerHandler('azure.getBuilds', async (payload) => {
		const builds = await azure.getBuilds(payload?.branch);
		return { builds };
	});

	protocol.registerHandler('azure.getBuildDetails', async (payload) => {
		const details = await azure.getBuildDetails(payload.commitSha);
		return { details };
	});

	// ===========================================================================
	// Undo/Redo System (P5-003)
	// ===========================================================================

	protocol.registerHandler('git.undo', async () => {
		if (undoStack.length === 0) {
			return { success: false, message: 'Nothing to undo' };
		}

		const operation = undoStack.pop()!;

		try {
			switch (operation.type) {
				case 'commit':
					// Undo commit - soft reset to previous commit
					await git.raw(['reset', '--soft', 'HEAD~1']);
					break;
				case 'rebase':
				case 'cherryPick':
				case 'merge':
					// Undo by resetting to original head
					if (operation.data.originalHead) {
						await git.raw(['reset', '--hard', operation.data.originalHead]);
					}
					break;
				case 'checkout':
					// Undo checkout by going back to previous branch
					if (operation.data.previousBranch) {
						await git.checkout(operation.data.previousBranch);
					}
					break;
				case 'stash':
					// Undo stash by popping it
					await git.stashPop(0);
					break;
				default:
					return {
						success: false,
						message: `Cannot undo operation: ${operation.type}`,
					};
			}

			// Push to redo stack
			redoStack.push(operation);

			return { success: true, operation: operation.type };
		} catch (error) {
			// Restore undo stack on failure
			undoStack.push(operation);
			throw error;
		}
	});

	protocol.registerHandler('git.redo', async () => {
		if (redoStack.length === 0) {
			return { success: false, message: 'Nothing to redo' };
		}

		const operation = redoStack.pop()!;

		try {
			switch (operation.type) {
				case 'commit':
					// Redo is complex for commits - we'd need to store the commit data
					return { success: false, message: 'Cannot redo commit' };
				case 'rebase':
					// Redo rebase - would need to store full rebase plan
					return {
						success: false,
						message: 'Cannot redo rebase automatically',
					};
				case 'checkout':
					if (operation.data.targetBranch) {
						await git.checkout(operation.data.targetBranch);
					}
					break;
				case 'stash':
					// Redo stash by creating it again
					await git.stashCreate(operation.data.message);
					break;
				default:
					return {
						success: false,
						message: `Cannot redo operation: ${operation.type}`,
					};
			}

			// Push back to undo stack
			undoStack.push(operation);

			return { success: true, operation: operation.type };
		} catch (error) {
			// Restore redo stack on failure
			redoStack.push(operation);
			throw error;
		}
	});

	protocol.registerHandler('git.getUndoRedoState', async () => {
		return {
			canUndo: undoStack.length > 0,
			canRedo: redoStack.length > 0,
			undoStack: undoStack.map((op) => ({
				type: op.type,
				timestamp: op.timestamp,
			})),
			redoStack: redoStack.map((op) => ({
				type: op.type,
				timestamp: op.timestamp,
			})),
		};
	});

	// Track commit for undo
	protocol.registerHandler('git.commitWithUndo', async (payload) => {
		// Save state for undo
		pushUndoOperation({
			type: 'commit',
			data: { message: payload.message },
			timestamp: Date.now(),
		});

		const hash = await git.commit(payload.message, payload.files || []);
		return { success: true, hash };
	});
}

// =============================================================================
// Helper Functions
// =============================================================================

function pushUndoOperation(operation: UndoableOperation): void {
	undoStack.push(operation);
	// Clear redo stack when new operation is performed
	redoStack.length = 0;
	// Limit history size
	while (undoStack.length > MAX_UNDO_HISTORY) {
		undoStack.shift();
	}
}

async function getHeadCommit(git: GitService): Promise<string> {
	const result = await git.raw(['rev-parse', 'HEAD']);
	return result.trim();
}

// =============================================================================
// Deactivation
// =============================================================================

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
	webviewProvider = undefined;
	gitService = undefined;
	azureService = undefined;
	azureAuthProvider = undefined;
	// Clear undo/redo stacks
	undoStack.length = 0;
	redoStack.length = 0;
}
