/**
 * WebviewProvider
 * VS Code WebviewPanel implementation for Git Board (full page editor)
 */

import * as vscode from 'vscode';
import {
	type HandlerContext,
	MessageProtocol,
} from '../../core/messages/protocol';
import type { EventMessage, RequestMessage } from '../../core/messages/types';

// =============================================================================
// WebviewProvider Class
// =============================================================================

export class GitBoardWebviewProvider {
	public static readonly viewType = 'gitBoard.mainView';

	private panel?: vscode.WebviewPanel;
	private messageProtocol: MessageProtocol;
	private messageListener?: vscode.Disposable;

	constructor(
		private readonly extensionContext: vscode.ExtensionContext,
		private readonly extensionUri: vscode.Uri,
	) {
		const context: HandlerContext = {
			extensionContext,
			workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
		};

		this.messageProtocol = new MessageProtocol(context);
	}

	/**
	 * Get the message protocol for registering handlers
	 */
	public getMessageProtocol(): MessageProtocol {
		return this.messageProtocol;
	}

	/**
	 * Send an event to the webview
	 */
	public sendEvent(event: EventMessage): void {
		this.messageProtocol.sendEvent(event);
	}

	/**
	 * Check if webview is visible
	 */
	public isVisible(): boolean {
		return this.panel?.visible ?? false;
	}

	/**
	 * Refresh the webview content
	 */
	public refresh(): void {
		if (this.panel) {
			this.sendEvent({ type: 'git/changed' });
		}
	}

	/**
	 * Show or create the webview panel
	 */
	public show(): void {
		// If panel exists, reveal it
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		// Create new panel
		this.panel = vscode.window.createWebviewPanel(
			GitBoardWebviewProvider.viewType,
			'Git Board',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(this.extensionUri, 'dist'),
					vscode.Uri.joinPath(this.extensionUri, 'media'),
					vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode/codicons', 'dist'),
				],
			},
		);

		// Set panel icon
		this.panel.iconPath = new vscode.ThemeIcon('git-merge');

		// Set HTML content
		this.panel.webview.html = this.getHtmlContent(this.panel.webview);

		// Setup message protocol
		this.messageProtocol.setWebview(this.panel.webview);

		// Setup message listener
		this.messageListener = this.panel.webview.onDidReceiveMessage(
			(message: RequestMessage) => this.messageProtocol.handleMessage(message),
			undefined,
			this.extensionContext.subscriptions,
		);

		// Handle panel disposal
		this.panel.onDidDispose(() => {
			this.messageListener?.dispose();
			this.messageProtocol.clearWebview();
			this.panel = undefined;
		});

		// Handle visibility changes
		this.panel.onDidChangeViewState(() => {
			if (this.panel?.visible) {
				// Panel became visible - refresh data
				this.sendEvent({ type: 'git/changed' });
			}
		});
	}

	/**
	 * Dispose the panel
	 */
	public dispose(): void {
		this.panel?.dispose();
	}

	/**
	 * Generate HTML content for webview
	 */
	private getHtmlContent(webview: vscode.Webview): string {
		// URIs for resources
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js'),
		);

		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.css'),
		);

		const codiconsUri = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this.extensionUri,
				'node_modules',
				'@vscode/codicons',
				'dist',
				'codicon.css',
			),
		);

		// CSP nonce for security
		const nonce = this.getNonce();

		return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none';
          style-src ${webview.cspSource} 'unsafe-inline';
          font-src ${webview.cspSource};
          script-src 'nonce-${nonce}';
          img-src ${webview.cspSource} https: data:;
        ">
        <link href="${codiconsUri}" rel="stylesheet" />
        <link href="${styleUri}" rel="stylesheet" />
        <title>4MGI Git Board</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
	}

	/**
	 * Generate cryptographic nonce for CSP
	 */
	private getNonce(): string {
		let text = '';
		const possible =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}

// =============================================================================
// Factory function
// =============================================================================

export function createGitBoardWebviewProvider(
	context: vscode.ExtensionContext,
): GitBoardWebviewProvider {
	return new GitBoardWebviewProvider(context, context.extensionUri);
}
