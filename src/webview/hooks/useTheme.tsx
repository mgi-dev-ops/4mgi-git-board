/**
 * VS Code Theme Integration Hook
 * Detects and responds to VS Code theme changes
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';

/**
 * Theme types supported by VS Code
 */
export type VSCodeTheme =
	| 'light'
	| 'dark'
	| 'high-contrast'
	| 'high-contrast-light';

/**
 * Theme context value
 */
export interface ThemeContextValue {
	/** Current VS Code theme */
	theme: VSCodeTheme;
	/** Whether the current theme is dark */
	isDark: boolean;
	/** Whether the current theme is high contrast */
	isHighContrast: boolean;
	/** Whether the current theme is light (includes high-contrast-light) */
	isLight: boolean;
}

/**
 * Default theme context value
 */
const defaultThemeContext: ThemeContextValue = {
	theme: 'dark',
	isDark: true,
	isHighContrast: false,
	isLight: false,
};

/**
 * React context for theme
 */
const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

/**
 * Detects the current VS Code theme from body classes
 */
function detectTheme(): VSCodeTheme {
	const body = document.body;

	// VS Code adds these classes to the body element
	if (body.classList.contains('vscode-high-contrast-light')) {
		return 'high-contrast-light';
	}
	if (body.classList.contains('vscode-high-contrast')) {
		return 'high-contrast';
	}
	if (body.classList.contains('vscode-light')) {
		return 'light';
	}
	if (body.classList.contains('vscode-dark')) {
		return 'dark';
	}

	// Fallback: check computed background color luminance
	const bgColor = getComputedStyle(body).backgroundColor;
	if (bgColor) {
		const luminance = getLuminance(bgColor);
		return luminance > 0.5 ? 'light' : 'dark';
	}

	// Default to dark theme
	return 'dark';
}

/**
 * Calculate luminance from an RGB color string
 */
function getLuminance(color: string): number {
	// Parse rgb(r, g, b) or rgba(r, g, b, a) format
	const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (!match) return 0;

	const r = parseInt(match[1], 10) / 255;
	const g = parseInt(match[2], 10) / 255;
	const b = parseInt(match[3], 10) / 255;

	// Relative luminance formula (ITU-R BT.709)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derive theme properties from theme type
 */
function deriveThemeProperties(
	theme: VSCodeTheme,
): Omit<ThemeContextValue, 'theme'> {
	return {
		isDark: theme === 'dark' || theme === 'high-contrast',
		isHighContrast:
			theme === 'high-contrast' || theme === 'high-contrast-light',
		isLight: theme === 'light' || theme === 'high-contrast-light',
	};
}

/**
 * Hook to detect and respond to VS Code theme changes
 *
 * @returns Theme context value with current theme and derived properties
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isDark, isHighContrast } = useTheme();
 *
 *   return (
 *     <div className={isDark ? 'dark-mode' : 'light-mode'}>
 *       Current theme: {theme}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
	const [theme, setTheme] = useState<VSCodeTheme>(() => detectTheme());

	const updateTheme = useCallback(() => {
		const newTheme = detectTheme();
		setTheme(newTheme);

		// Update data-theme attribute for CSS selectors
		document.documentElement.setAttribute('data-theme', newTheme);
	}, []);

	useEffect(() => {
		// Initial detection and attribute setting
		updateTheme();

		// Watch for class changes on body element (VS Code theme changes)
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === 'attributes' &&
					mutation.attributeName === 'class'
				) {
					updateTheme();
					break;
				}
			}
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
		});

		// Also listen for VS Code theme change message
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			if (
				message?.type === 'themeChanged' ||
				message?.command === 'themeChanged'
			) {
				updateTheme();
			}
		};

		window.addEventListener('message', handleMessage);

		// Listen for media query changes (system theme)
		const darkModeMediaQuery = window.matchMedia(
			'(prefers-color-scheme: dark)',
		);
		const handleMediaChange = () => updateTheme();

		// Use addEventListener for broader browser support
		if (darkModeMediaQuery.addEventListener) {
			darkModeMediaQuery.addEventListener('change', handleMediaChange);
		} else {
			// Fallback for older browsers
			darkModeMediaQuery.addListener(handleMediaChange);
		}

		return () => {
			observer.disconnect();
			window.removeEventListener('message', handleMessage);
			if (darkModeMediaQuery.removeEventListener) {
				darkModeMediaQuery.removeEventListener('change', handleMediaChange);
			} else {
				darkModeMediaQuery.removeListener(handleMediaChange);
			}
		};
	}, [updateTheme]);

	return {
		theme,
		...deriveThemeProperties(theme),
	};
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
	children: ReactNode;
}

/**
 * Theme provider component
 * Provides theme context to all child components
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <MyComponent />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
	const themeValue = useTheme();

	return (
		<ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
	);
}

/**
 * Hook to access theme context
 * Must be used within a ThemeProvider
 *
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function ChildComponent() {
 *   const { theme, isDark } = useThemeContext();
 *   return <div>Theme: {theme}</div>;
 * }
 * ```
 */
export function useThemeContext(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useThemeContext must be used within a ThemeProvider');
	}
	return context;
}

/**
 * Get CSS variable value for the current theme
 *
 * @param variableName - CSS variable name (with or without --)
 * @returns The computed value of the CSS variable
 *
 * @example
 * ```ts
 * const bgColor = getCSSVariable('--bg-primary');
 * const textColor = getCSSVariable('text-primary'); // -- prefix optional
 * ```
 */
export function getCSSVariable(variableName: string): string {
	const name = variableName.startsWith('--')
		? variableName
		: `--${variableName}`;
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

/**
 * Set a CSS variable value
 *
 * @param variableName - CSS variable name (with or without --)
 * @param value - The value to set
 *
 * @example
 * ```ts
 * setCSSVariable('--custom-color', '#ff0000');
 * ```
 */
export function setCSSVariable(variableName: string, value: string): void {
	const name = variableName.startsWith('--')
		? variableName
		: `--${variableName}`;
	document.documentElement.style.setProperty(name, value);
}

/**
 * Get all branch colors as an object
 * Useful for programmatic color assignment
 *
 * @returns Object mapping branch names to their colors
 */
export function getBranchColors(): Record<string, string> {
	return {
		main: getCSSVariable('--branch-main'),
		develop: getCSSVariable('--branch-develop'),
		feature: getCSSVariable('--branch-feature'),
		hotfix: getCSSVariable('--branch-hotfix'),
		release: getCSSVariable('--branch-release'),
	};
}

/**
 * Get graph line colors as an array
 * Useful for assigning colors to multiple branches
 *
 * @returns Array of graph line colors
 */
export function getGraphLineColors(): string[] {
	return [
		getCSSVariable('--graph-line-1'),
		getCSSVariable('--graph-line-2'),
		getCSSVariable('--graph-line-3'),
		getCSSVariable('--graph-line-4'),
		getCSSVariable('--graph-line-5'),
		getCSSVariable('--graph-line-6'),
		getCSSVariable('--graph-line-7'),
		getCSSVariable('--graph-line-8'),
	].filter(Boolean);
}

/**
 * Get pipeline status colors
 *
 * @returns Object mapping pipeline status to colors
 */
export function getPipelineColors(): Record<string, string> {
	return {
		running: getCSSVariable('--pipeline-running'),
		succeeded: getCSSVariable('--pipeline-succeeded'),
		failed: getCSSVariable('--pipeline-failed'),
		canceled: getCSSVariable('--pipeline-canceled'),
		partial: getCSSVariable('--pipeline-partial'),
		queued: getCSSVariable('--pipeline-queued'),
		warning: getCSSVariable('--pipeline-warning'),
	};
}

/**
 * Get file status colors
 *
 * @returns Object mapping file status to colors
 */
export function getStatusColors(): Record<string, string> {
	return {
		added: getCSSVariable('--status-added'),
		modified: getCSSVariable('--status-modified'),
		deleted: getCSSVariable('--status-deleted'),
		conflict: getCSSVariable('--status-conflict'),
		renamed: getCSSVariable('--status-renamed'),
		copied: getCSSVariable('--status-copied'),
		untracked: getCSSVariable('--status-untracked'),
		ignored: getCSSVariable('--status-ignored'),
	};
}

export default useTheme;
