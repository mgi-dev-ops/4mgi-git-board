/**
 * Keyboard Shortcuts Commands
 * Registers VS Code keybindings for Git Board
 *
 * Note: Keybindings are defined in package.json contributes.keybindings
 * This file handles command registration and execution
 */

import * as vscode from 'vscode';

// =============================================================================
// Types
// =============================================================================

export interface ShortcutCommand {
	/** Command ID (must match package.json) */
	id: string;
	/** Handler function */
	handler: () => void | Promise<void>;
}

// =============================================================================
// Context Keys
// =============================================================================

/**
 * Context key manager for enabling/disabling shortcuts
 */
export class ShortcutContextManager {
	private static instance: ShortcutContextManager;
	private contextKeys: Map<string, boolean> = new Map();

	private constructor() {}

	static getInstance(): ShortcutContextManager {
		if (!ShortcutContextManager.instance) {
			ShortcutContextManager.instance = new ShortcutContextManager();
		}
		return ShortcutContextManager.instance;
	}

	/**
	 * Set a context key value
	 */
	setContext(key: string, value: boolean): void {
		this.contextKeys.set(key, value);
		vscode.commands.executeCommand('setContext', key, value);
	}

	/**
	 * Get a context key value
	 */
	getContext(key: string): boolean {
		return this.contextKeys.get(key) ?? false;
	}

	/**
	 * Set Git Board as active/focused
	 */
	setGitBoardActive(active: boolean): void {
		this.setContext('gitBoard.active', active);
	}

	/**
	 * Set rebase mode
	 */
	setRebaseMode(active: boolean): void {
		this.setContext('gitBoard.rebaseMode', active);
	}

	/**
	 * Set commit dialog open
	 */
	setCommitDialogOpen(open: boolean): void {
		this.setContext('gitBoard.commitDialogOpen', open);
	}

	/**
	 * Set search focused
	 */
	setSearchFocused(focused: boolean): void {
		this.setContext('gitBoard.searchFocused', focused);
	}

	/**
	 * Set modal open
	 */
	setModalOpen(open: boolean): void {
		this.setContext('gitBoard.modalOpen', open);
	}
}

// =============================================================================
// Shortcut Commands
// =============================================================================

/**
 * Create shortcut commands for Git Board
 */
export function createShortcutCommands(
	webviewPanel: vscode.WebviewPanel | undefined,
	contextManager: ShortcutContextManager,
): ShortcutCommand[] {
	/**
	 * Send message to webview
	 */
	const sendToWebview = (type: string, payload?: unknown): void => {
		if (webviewPanel?.webview) {
			webviewPanel.webview.postMessage({ type, payload });
		}
	};

	return [
		// =========================================================================
		// Graph Navigation
		// =========================================================================
		{
			id: 'gitBoard.toggleExpandCommit',
			handler: () => {
				sendToWebview('shortcut:toggle-expand-commit');
			},
		},
		{
			id: 'gitBoard.checkoutOrOpen',
			handler: () => {
				sendToWebview('shortcut:checkout-or-open');
			},
		},
		{
			id: 'gitBoard.focusSearch',
			handler: () => {
				sendToWebview('shortcut:focus-search');
			},
		},
		{
			id: 'gitBoard.navigateUp',
			handler: () => {
				sendToWebview('shortcut:navigate-up');
			},
		},
		{
			id: 'gitBoard.navigateDown',
			handler: () => {
				sendToWebview('shortcut:navigate-down');
			},
		},

		// =========================================================================
		// Git Operations
		// =========================================================================
		{
			id: 'gitBoard.openCommitDialog',
			handler: () => {
				contextManager.setCommitDialogOpen(true);
				sendToWebview('shortcut:open-commit-dialog');
			},
		},
		{
			id: 'gitBoard.push',
			handler: () => {
				sendToWebview('shortcut:push');
			},
		},
		{
			id: 'gitBoard.fetch',
			handler: () => {
				sendToWebview('shortcut:fetch');
			},
		},
		{
			id: 'gitBoard.undo',
			handler: () => {
				sendToWebview('shortcut:undo');
			},
		},
		{
			id: 'gitBoard.linkWorkItem',
			handler: () => {
				sendToWebview('shortcut:link-work-item');
			},
		},

		// =========================================================================
		// Interactive Rebase
		// =========================================================================
		{
			id: 'gitBoard.rebase.pick',
			handler: () => {
				sendToWebview('shortcut:rebase-pick');
			},
		},
		{
			id: 'gitBoard.rebase.reword',
			handler: () => {
				sendToWebview('shortcut:rebase-reword');
			},
		},
		{
			id: 'gitBoard.rebase.edit',
			handler: () => {
				sendToWebview('shortcut:rebase-edit');
			},
		},
		{
			id: 'gitBoard.rebase.squash',
			handler: () => {
				sendToWebview('shortcut:rebase-squash');
			},
		},
		{
			id: 'gitBoard.rebase.fixup',
			handler: () => {
				sendToWebview('shortcut:rebase-fixup');
			},
		},
		{
			id: 'gitBoard.rebase.drop',
			handler: () => {
				sendToWebview('shortcut:rebase-drop');
			},
		},
		{
			id: 'gitBoard.rebase.moveUp',
			handler: () => {
				sendToWebview('shortcut:rebase-move-up');
			},
		},
		{
			id: 'gitBoard.rebase.moveDown',
			handler: () => {
				sendToWebview('shortcut:rebase-move-down');
			},
		},
		{
			id: 'gitBoard.rebase.editMessage',
			handler: () => {
				sendToWebview('shortcut:rebase-edit-message');
			},
		},
		{
			id: 'gitBoard.rebase.cancel',
			handler: () => {
				contextManager.setRebaseMode(false);
				sendToWebview('shortcut:rebase-cancel');
			},
		},
		{
			id: 'gitBoard.rebase.start',
			handler: () => {
				sendToWebview('shortcut:rebase-start');
			},
		},

		// =========================================================================
		// General
		// =========================================================================
		{
			id: 'gitBoard.showShortcutHelp',
			handler: () => {
				sendToWebview('shortcut:show-help');
			},
		},
		{
			id: 'gitBoard.escape',
			handler: () => {
				contextManager.setModalOpen(false);
				contextManager.setCommitDialogOpen(false);
				sendToWebview('shortcut:escape');
			},
		},
	];
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Register all shortcut commands
 */
export function registerShortcutCommands(
	_context: vscode.ExtensionContext,
	webviewPanel: vscode.WebviewPanel | undefined,
): vscode.Disposable[] {
	const contextManager = ShortcutContextManager.getInstance();
	const commands = createShortcutCommands(webviewPanel, contextManager);
	const disposables: vscode.Disposable[] = [];

	for (const command of commands) {
		const disposable = vscode.commands.registerCommand(
			command.id,
			command.handler,
		);
		disposables.push(disposable);
	}

	return disposables;
}

/**
 * Update webview panel reference for shortcuts
 */
export function updateShortcutWebviewPanel(
	_context: vscode.ExtensionContext,
	webviewPanel: vscode.WebviewPanel | undefined,
): void {
	const contextManager = ShortcutContextManager.getInstance();

	if (webviewPanel) {
		contextManager.setGitBoardActive(true);

		// Handle panel disposal
		webviewPanel.onDidDispose(() => {
			contextManager.setGitBoardActive(false);
			contextManager.setRebaseMode(false);
			contextManager.setCommitDialogOpen(false);
			contextManager.setModalOpen(false);
		});

		// Handle panel visibility change
		webviewPanel.onDidChangeViewState((e) => {
			contextManager.setGitBoardActive(e.webviewPanel.visible);
		});
	} else {
		contextManager.setGitBoardActive(false);
	}
}

// =============================================================================
// Export Context Manager for external use
// =============================================================================

export { ShortcutContextManager as ContextManager };
