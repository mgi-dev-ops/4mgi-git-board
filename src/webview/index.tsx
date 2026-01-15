import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { vscode } from './vscodeApi';
import './styles/global.css';

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
 * Setup message listener for theme changes only
 * Main message handling is done by useMessageHandler hook in React components
 */
function setupThemeMessageListener(): void {
	window.addEventListener('message', (event) => {
		const message = event.data;

		// Only handle theme-changed here, other messages are handled by useMessageHandler
		if (message.type === 'theme-changed') {
			handleThemeChange();
		}
	});
}

/**
 * Initialize the webview application
 */
function initialize(): void {
	// Setup theme handling
	handleThemeChange();

	// Setup theme message listener (main messages handled by useMessageHandler in React)
	setupThemeMessageListener();

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
	vscode?.postMessage({ type: 'webview-ready' });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize);
} else {
	initialize();
}
