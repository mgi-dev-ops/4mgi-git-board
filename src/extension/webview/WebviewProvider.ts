/**
 * WebviewProvider
 * VS Code WebviewViewProvider implementation for Git Board panel
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

export class GitBoardWebviewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'gitBoard.mainView';

	private view?: vscode.WebviewView;
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
		return this.view?.visible ?? false;
	}

	/**
	 * Refresh the webview content
	 */
	public refresh(): void {
		if (this.view) {
			this.sendEvent({ type: 'git/changed' });
		}
	}

	/**
	 * WebviewViewProvider implementation
	 */
	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void | Thenable<void> {
		this.view = webviewView;

		// Configure webview options
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.extensionUri, 'dist'),
				vscode.Uri.joinPath(this.extensionUri, 'media'),
			],
		};

		// Set HTML content
		webviewView.webview.html = this.getHtmlContent(webviewView.webview);

		// Setup message protocol
		this.messageProtocol.setWebview(webviewView.webview);

		// Setup message listener
		this.messageListener = webviewView.webview.onDidReceiveMessage(
			(message: RequestMessage) => this.messageProtocol.handleMessage(message),
			undefined,
			this.extensionContext.subscriptions,
		);

		// Handle webview disposal
		webviewView.onDidDispose(() => {
			this.messageListener?.dispose();
			this.messageProtocol.clearWebview();
			this.view = undefined;
		});

		// Handle visibility changes
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				// Webview became visible - refresh data
				this.sendEvent({ type: 'git/changed' });
			}
		});
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

// =============================================================================
// Registration helper
// =============================================================================

export function registerWebviewProvider(
	_context: vscode.ExtensionContext,
	provider: GitBoardWebviewProvider,
): vscode.Disposable {
	return vscode.window.registerWebviewViewProvider(
		GitBoardWebviewProvider.viewType,
		provider,
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
		},
	);
}
