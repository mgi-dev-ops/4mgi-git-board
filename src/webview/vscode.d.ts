/**
 * Type declarations for VS Code Webview API
 */

interface VsCodeApi {
	/**
	 * Post a message to the VS Code extension host
	 */
	postMessage(message: unknown): void;

	/**
	 * Get the current state stored for this webview
	 */
	getState<T = unknown>(): T | undefined;

	/**
	 * Set the state for this webview
	 * This state persists even when the webview becomes hidden
	 */
	setState<T>(newState: T): T;
}

/**
 * Acquire the VS Code API instance
 * Can only be invoked once per webview session
 */
declare function acquireVsCodeApi(): VsCodeApi;

/**
 * Message types for communication between webview and extension
 */
interface WebviewMessage {
	type: string;
	payload?: unknown;
}

/**
 * Theme kind from VS Code
 */
declare enum ThemeKind {
	Light = 1,
	Dark = 2,
	HighContrast = 3,
	HighContrastLight = 4,
}

/**
 * Global window extensions for VS Code webview
 */
declare global {
	interface Window {
		acquireVsCodeApi: typeof acquireVsCodeApi;
	}
}

export { VsCodeApi, WebviewMessage, ThemeKind };
