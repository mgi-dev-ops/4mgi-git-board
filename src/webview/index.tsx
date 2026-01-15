import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Type for VS Code API (defined in vscode.d.ts)
type VsCodeApi = {
	postMessage(message: unknown): void;
	getState<T = unknown>(): T | undefined;
	setState<T>(newState: T): T;
};

/**
 * Acquire VS Code API instance
 * Can only be called once per webview session
 */
const vscode: VsCodeApi = acquireVsCodeApi();

/**
 * Get the current VS Code theme kind
 * Returns 'vscode-light', 'vscode-dark', or 'vscode-high-contrast'
 */
function getThemeKind(): string {
	return document.body.getAttribute('data-vscode-theme-kind') || 'vscode-dark';
}

/**
 * Handle theme changes from VS Code
 * Updates CSS classes on body element
 */
function handleThemeChange(): void {
	const themeKind = getThemeKind();
	document.body.classList.remove(
		'vscode-light',
		'vscode-dark',
		'vscode-high-contrast',
		'vscode-high-contrast-light',
	);
	document.body.classList.add(themeKind);
}

/**
 * Setup message listener for communication with extension
 */
function setupMessageListener(): void {
	window.addEventListener('message', (event) => {
		const message = event.data;

		switch (message.type) {
			case 'theme-changed':
				handleThemeChange();
				break;
			// Add more message handlers here
			default:
				console.log('Unknown message type:', message.type);
		}
	});
}

/**
 * Initialize the webview application
 */
function initialize(): void {
	// Setup theme handling
	handleThemeChange();

	// Setup message listener
	setupMessageListener();

	// Observe theme changes via MutationObserver
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === 'attributes' &&
				mutation.attributeName === 'data-vscode-theme-kind'
			) {
				handleThemeChange();
			}
		});
	});

	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ['data-vscode-theme-kind'],
	});

	// Mount React application
	const container = document.getElementById('root');

	if (!container) {
		console.error('Root element not found');
		return;
	}

	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);

	// Notify extension that webview is ready
	vscode.postMessage({ type: 'webview-ready' });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize);
} else {
	initialize();
}

// Export vscode API for use in other modules
export { vscode };
