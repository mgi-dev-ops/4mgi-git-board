/**
 * Azure DevOps Authentication Provider
 * Handles PAT authentication with secure storage via VS Code Secret Storage
 */

import { getPersonalAccessTokenHandler, WebApi } from 'azure-devops-node-api';
import * as vscode from 'vscode';
import { AzureServiceError } from './AzureService.types';

/**
 * Secret storage key for Azure DevOps PAT
 */
const AZURE_PAT_KEY = 'gitBoard.azure.pat';

/**
 * Azure DevOps connection configuration
 */
export interface AzureConnectionConfig {
	organization: string;
	project: string;
	pat: string;
}

/**
 * Authentication state
 */
export interface AuthState {
	isAuthenticated: boolean;
	organization?: string;
	project?: string;
}

/**
 * Azure DevOps Authentication Provider
 * Manages PAT storage, validation, and connection creation
 */
export class AzureAuthProvider implements vscode.Disposable {
	private connection: WebApi | null = null;
	private config: AzureConnectionConfig | null = null;
	private readonly onDidChangeAuthStateEmitter =
		new vscode.EventEmitter<AuthState>();

	/**
	 * Event fired when authentication state changes
	 */
	public readonly onDidChangeAuthState = this.onDidChangeAuthStateEmitter.event;

	constructor(private readonly secretStorage: vscode.SecretStorage) {}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.onDidChangeAuthStateEmitter.dispose();
		this.connection = null;
		this.config = null;
	}

	/**
	 * Get current authentication state
	 */
	getAuthState(): AuthState {
		return {
			isAuthenticated: this.connection !== null,
			organization: this.config?.organization,
			project: this.config?.project,
		};
	}

	/**
	 * Check if currently authenticated
	 */
	isAuthenticated(): boolean {
		return this.connection !== null;
	}

	/**
	 * Get the current WebApi connection
	 * @throws AzureServiceError if not authenticated
	 */
	getConnection(): WebApi {
		if (!this.connection) {
			throw new AzureServiceError(
				'Not authenticated to Azure DevOps. Please authenticate first.',
				'UNAUTHORIZED',
			);
		}
		return this.connection;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): AzureConnectionConfig | null {
		return this.config;
	}

	/**
	 * Authenticate with Azure DevOps using PAT
	 * @param pat Personal Access Token
	 * @param organization Azure DevOps organization name
	 * @param project Azure DevOps project name
	 * @returns true if authentication successful
	 */
	async authenticate(
		pat: string,
		organization: string,
		project: string,
	): Promise<boolean> {
		try {
			// Validate inputs
			if (!pat || !organization || !project) {
				throw new AzureServiceError(
					'PAT, organization, and project are required',
					'BAD_REQUEST',
				);
			}

			// Create connection
			const orgUrl = `https://dev.azure.com/${organization}`;
			const authHandler = getPersonalAccessTokenHandler(pat);
			const connection = new WebApi(orgUrl, authHandler);

			// Validate connection by making a simple API call
			await this.validateConnection(connection, project);

			// Store PAT securely
			await this.storePAT(pat, organization, project);

			// Update state
			this.connection = connection;
			this.config = { organization, project, pat };

			// Emit state change
			this.onDidChangeAuthStateEmitter.fire({
				isAuthenticated: true,
				organization,
				project,
			});

			return true;
		} catch (error) {
			// Clear any partial state
			this.connection = null;
			this.config = null;

			if (error instanceof AzureServiceError) {
				throw error;
			}

			const err = error as Error;
			throw new AzureServiceError(
				`Authentication failed: ${err.message}`,
				'UNAUTHORIZED',
				undefined,
				err,
			);
		}
	}

	/**
	 * Try to restore authentication from stored PAT
	 * @returns true if restoration successful
	 */
	async tryRestoreAuth(): Promise<boolean> {
		try {
			const stored = await this.getStoredPAT();
			if (!stored) {
				return false;
			}

			return await this.authenticate(
				stored.pat,
				stored.organization,
				stored.project,
			);
		} catch {
			// Silent fail - user will need to re-authenticate
			return false;
		}
	}

	/**
	 * Sign out and clear stored credentials
	 */
	async signOut(): Promise<void> {
		this.connection = null;
		this.config = null;
		await this.clearStoredPAT();

		this.onDidChangeAuthStateEmitter.fire({
			isAuthenticated: false,
		});
	}

	/**
	 * Show PAT input dialog and authenticate
	 * @returns true if authentication successful
	 */
	async promptForAuthentication(): Promise<boolean> {
		// Get organization from settings or prompt
		const config = vscode.workspace.getConfiguration('gitBoard.azure');
		let organization = config.get<string>('organization') || '';
		let project = config.get<string>('project') || '';

		// Prompt for organization if not set
		if (!organization) {
			const orgInput = await vscode.window.showInputBox({
				prompt: 'Enter your Azure DevOps organization name',
				placeHolder: 'my-organization',
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim() === '') {
						return 'Organization name is required';
					}
					if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
						return 'Invalid organization name format';
					}
					return null;
				},
			});

			if (!orgInput) {
				return false; // User cancelled
			}
			organization = orgInput.trim();
		}

		// Prompt for project if not set
		if (!project) {
			const projectInput = await vscode.window.showInputBox({
				prompt: 'Enter your Azure DevOps project name',
				placeHolder: 'my-project',
				ignoreFocusOut: true,
				validateInput: (value) => {
					if (!value || value.trim() === '') {
						return 'Project name is required';
					}
					return null;
				},
			});

			if (!projectInput) {
				return false; // User cancelled
			}
			project = projectInput.trim();
		}

		// Prompt for PAT
		const pat = await vscode.window.showInputBox({
			prompt: 'Enter your Azure DevOps Personal Access Token (PAT)',
			placeHolder: 'Enter PAT',
			password: true,
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim() === '') {
					return 'PAT is required';
				}
				return null;
			},
		});

		if (!pat) {
			return false; // User cancelled
		}

		try {
			const success = await this.authenticate(
				pat.trim(),
				organization,
				project,
			);
			if (success) {
				vscode.window.showInformationMessage(
					`Successfully connected to Azure DevOps: ${organization}/${project}`,
				);
			}
			return success;
		} catch (error) {
			const err = error as AzureServiceError;
			vscode.window.showErrorMessage(
				`Azure DevOps authentication failed: ${err.message}`,
			);
			return false;
		}
	}

	/**
	 * Validate connection by making a test API call
	 */
	private async validateConnection(
		connection: WebApi,
		project: string,
	): Promise<void> {
		try {
			// Try to get the project to validate connection and permissions
			const coreApi = await connection.getCoreApi();
			const projectInfo = await coreApi.getProject(project);

			if (!projectInfo) {
				throw new AzureServiceError(
					`Project "${project}" not found or you don't have access`,
					'NOT_FOUND',
				);
			}
		} catch (error) {
			if (error instanceof AzureServiceError) {
				throw error;
			}

			const err = error as { statusCode?: number; message?: string };

			if (err.statusCode === 401) {
				throw new AzureServiceError(
					'Invalid or expired PAT',
					'UNAUTHORIZED',
					401,
				);
			}
			if (err.statusCode === 403) {
				throw new AzureServiceError(
					'PAT does not have required permissions',
					'FORBIDDEN',
					403,
				);
			}
			if (err.statusCode === 404) {
				throw new AzureServiceError(
					'Organization or project not found',
					'NOT_FOUND',
					404,
				);
			}

			throw new AzureServiceError(
				`Connection validation failed: ${err.message || 'Unknown error'}`,
				'UNKNOWN',
			);
		}
	}

	/**
	 * Store PAT securely
	 */
	private async storePAT(
		pat: string,
		organization: string,
		project: string,
	): Promise<void> {
		const data = JSON.stringify({ pat, organization, project });
		await this.secretStorage.store(AZURE_PAT_KEY, data);
	}

	/**
	 * Get stored PAT
	 */
	private async getStoredPAT(): Promise<AzureConnectionConfig | null> {
		const data = await this.secretStorage.get(AZURE_PAT_KEY);
		if (!data) {
			return null;
		}

		try {
			const parsed = JSON.parse(data);
			if (parsed.pat && parsed.organization && parsed.project) {
				return parsed as AzureConnectionConfig;
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Clear stored PAT
	 */
	private async clearStoredPAT(): Promise<void> {
		await this.secretStorage.delete(AZURE_PAT_KEY);
	}
}
