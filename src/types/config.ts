/**
 * Extension configuration type definitions
 * Based on 06-API-REFERENCE.md
 */

/**
 * Graph orientation options
 */
export type GraphOrientation = 'vertical' | 'horizontal';

/**
 * Default provider options
 */
export type DefaultProvider = 'azure' | 'github';

/**
 * Extension configuration interface
 * Maps to VS Code settings schema
 */
export interface ExtensionConfig {
	/**
	 * Enable automatic fetching from remotes
	 * @default true
	 */
	'gitBoard.autoFetch': boolean;

	/**
	 * Interval between auto-fetch operations in seconds
	 * @default 300
	 */
	'gitBoard.fetchInterval': number;

	/**
	 * Maximum number of commits to display
	 * @default 100
	 */
	'gitBoard.commitLimit': number;

	/**
	 * Show remote branches in the graph
	 * @default true
	 */
	'gitBoard.showRemoteBranches': boolean;

	/**
	 * Orientation of the git graph
	 * @default 'vertical'
	 */
	'gitBoard.graphOrientation': GraphOrientation;

	/**
	 * Show confirmation dialog for destructive operations
	 * @default true
	 */
	'gitBoard.confirmDestructive': boolean;

	/**
	 * Default provider for PR and work item integration
	 * @default 'azure'
	 */
	'gitBoard.defaultProvider': DefaultProvider;

	/**
	 * Azure DevOps organization name
	 */
	'gitBoard.azure.organization': string;

	/**
	 * Azure DevOps project name
	 */
	'gitBoard.azure.project': string;
}

/**
 * Type for getting a single config value
 */
export type ConfigKey = keyof ExtensionConfig;

/**
 * Type for partial config updates
 */
export type PartialConfig = Partial<ExtensionConfig>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
	'gitBoard.autoFetch': true,
	'gitBoard.fetchInterval': 300,
	'gitBoard.commitLimit': 100,
	'gitBoard.showRemoteBranches': true,
	'gitBoard.graphOrientation': 'vertical',
	'gitBoard.confirmDestructive': true,
	'gitBoard.defaultProvider': 'azure',
	'gitBoard.azure.organization': '',
	'gitBoard.azure.project': '',
};
