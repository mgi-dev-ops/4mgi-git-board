/**
 * VS Code API Singleton
 * Ensures acquireVsCodeApi() is called only once per webview session
 */

// Type for VS Code API
export type VsCodeApi = {
	postMessage(message: unknown): void;
	getState<T = unknown>(): T | undefined;
	setState<T>(newState: T): T;
};

// Declare the global function provided by VS Code
declare function acquireVsCodeApi(): VsCodeApi;

// Singleton instance - acquired once when this module loads
let vscodeApi: VsCodeApi | null = null;

/**
 * Get the VS Code API instance
 * Safe to call multiple times - returns cached instance
 */
export function getVsCodeApi(): VsCodeApi | null {
	if (!vscodeApi && typeof acquireVsCodeApi !== 'undefined') {
		vscodeApi = acquireVsCodeApi();
	}
	return vscodeApi;
}

// Initialize immediately when module loads
export const vscode = getVsCodeApi();
