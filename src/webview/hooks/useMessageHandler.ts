/**
 * useMessageHandler Hook
 * Handles incoming messages from extension and dispatches to stores
 */

import { useCallback, useEffect, useRef } from 'react';
import type {
	ErrorResponse,
	EventMessage,
	ExtensionMessage,
	ResponseMessage,
} from '../../core/messages/types';

// =============================================================================
// Types
// =============================================================================

export type MessageDispatcher = {
	// Repository
	onRepoInfo?: (
		payload: Extract<ResponseMessage, { type: 'repo/info' }>['payload'],
	) => void;
	onRepoStatus?: (
		payload: Extract<ResponseMessage, { type: 'repo/status' }>['payload'],
	) => void;

	// Git
	onGitLog?: (
		payload: Extract<ResponseMessage, { type: 'git/log' }>['payload'],
	) => void;
	onGitBranches?: (
		payload: Extract<ResponseMessage, { type: 'git/branches' }>['payload'],
	) => void;
	onGitStashes?: (
		payload: Extract<ResponseMessage, { type: 'git/stashes' }>['payload'],
	) => void;
	onGitSuccess?: (
		payload: Extract<ResponseMessage, { type: 'git/success' }>['payload'],
	) => void;

	// Events
	onGitChanged?: () => void;
	onGitConflict?: (
		payload: Extract<EventMessage, { type: 'git/conflict' }>['payload'],
	) => void;

	// Azure
	onAzurePRs?: (
		payload: Extract<ResponseMessage, { type: 'azure/prs' }>['payload'],
	) => void;
	onAzureWorkItems?: (
		payload: Extract<ResponseMessage, { type: 'azure/workItems' }>['payload'],
	) => void;
	onAzurePipelineStatus?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/pipelineStatus' }
		>['payload'],
	) => void;
	onAzurePolicyConfigurations?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/policyConfigurations' }
		>['payload'],
	) => void;
	onAzurePolicyEvaluations?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/policyEvaluations' }
		>['payload'],
	) => void;
	onAzureBuildDetails?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/buildDetails' }
		>['payload'],
	) => void;
	onAzureTestResults?: (
		payload: Extract<ResponseMessage, { type: 'azure/testResults' }>['payload'],
	) => void;
	onAzureCodeCoverage?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/codeCoverage' }
		>['payload'],
	) => void;
	onAzureRebuildTriggered?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/rebuildTriggered' }
		>['payload'],
	) => void;
	onAzurePRCreated?: (
		payload: Extract<ResponseMessage, { type: 'azure/prCreated' }>['payload'],
	) => void;
	onAzureWorkItemLinked?: (
		payload: Extract<
			ResponseMessage,
			{ type: 'azure/workItemLinked' }
		>['payload'],
	) => void;

	// GitHub
	onGitHubPRs?: (
		payload: Extract<ResponseMessage, { type: 'github/prs' }>['payload'],
	) => void;

	// Error
	onError?: (payload: ErrorResponse['payload']) => void;
};

export interface UseMessageHandlerOptions {
	/** Dispatcher callbacks for different message types */
	dispatchers: MessageDispatcher;

	/** Called for any message before dispatching */
	onMessage?: (message: ExtensionMessage) => void;

	/** Enable debug logging */
	debug?: boolean;
}

// =============================================================================
// useMessageHandler Hook
// =============================================================================

export function useMessageHandler(options: UseMessageHandlerOptions): void {
	const { dispatchers, onMessage, debug = false } = options;

	// Use ref to always have latest dispatchers without re-subscribing
	const dispatchersRef = useRef(dispatchers);
	dispatchersRef.current = dispatchers;

	const handleMessage = useCallback(
		(event: MessageEvent<ExtensionMessage>) => {
			const message = event.data;

			if (debug) {
				console.log('[useMessageHandler] Received:', message);
			}

			// Call general handler first
			onMessage?.(message);

			const d = dispatchersRef.current;

			// Dispatch based on message type
			switch (message.type) {
				// Repository
				case 'repo/info':
					d.onRepoInfo?.(message.payload);
					break;
				case 'repo/status':
					d.onRepoStatus?.(message.payload);
					break;

				// Git responses
				case 'git/log':
					d.onGitLog?.(message.payload);
					break;
				case 'git/branches':
					d.onGitBranches?.(message.payload);
					break;
				case 'git/stashes':
					d.onGitStashes?.(message.payload);
					break;
				case 'git/success':
					d.onGitSuccess?.(message.payload);
					break;

				// Git events
				case 'git/changed':
					d.onGitChanged?.();
					break;
				case 'git/conflict':
					d.onGitConflict?.(message.payload);
					break;

				// Azure
				case 'azure/prs':
					d.onAzurePRs?.(message.payload);
					break;
				case 'azure/workItems':
					d.onAzureWorkItems?.(message.payload);
					break;
				case 'azure/pipelineStatus':
					d.onAzurePipelineStatus?.(message.payload);
					break;
				case 'azure/policyConfigurations':
					d.onAzurePolicyConfigurations?.(message.payload);
					break;
				case 'azure/policyEvaluations':
					d.onAzurePolicyEvaluations?.(message.payload);
					break;
				case 'azure/buildDetails':
					d.onAzureBuildDetails?.(message.payload);
					break;
				case 'azure/testResults':
					d.onAzureTestResults?.(message.payload);
					break;
				case 'azure/codeCoverage':
					d.onAzureCodeCoverage?.(message.payload);
					break;
				case 'azure/rebuildTriggered':
					d.onAzureRebuildTriggered?.(message.payload);
					break;
				case 'azure/prCreated':
					d.onAzurePRCreated?.(message.payload);
					break;
				case 'azure/workItemLinked':
					d.onAzureWorkItemLinked?.(message.payload);
					break;

				// GitHub
				case 'github/prs':
					d.onGitHubPRs?.(message.payload);
					break;

				// Error
				case 'error':
					d.onError?.(message.payload);
					break;

				default:
					if (debug) {
						console.warn(
							'[useMessageHandler] Unknown message type:',
							(message as { type: string }).type,
						);
					}
			}
		},
		[debug, onMessage],
	);

	useEffect(() => {
		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [handleMessage]);
}

// =============================================================================
// Utility: Create combined dispatcher from multiple sources
// =============================================================================

export function combineDispatchers(
	...dispatchers: MessageDispatcher[]
): MessageDispatcher {
	const combined: MessageDispatcher = {};

	const dispatcherKeys: (keyof MessageDispatcher)[] = [
		'onRepoInfo',
		'onRepoStatus',
		'onGitLog',
		'onGitBranches',
		'onGitStashes',
		'onGitSuccess',
		'onGitChanged',
		'onGitConflict',
		'onAzurePRs',
		'onAzureWorkItems',
		'onAzurePipelineStatus',
		'onAzurePolicyConfigurations',
		'onAzurePolicyEvaluations',
		'onAzureBuildDetails',
		'onAzureTestResults',
		'onAzureCodeCoverage',
		'onAzureRebuildTriggered',
		'onAzurePRCreated',
		'onAzureWorkItemLinked',
		'onGitHubPRs',
		'onError',
	];

	for (const key of dispatcherKeys) {
		const handlers = dispatchers
			.map((d) => d[key])
			.filter((h): h is NonNullable<typeof h> => h !== undefined);

		if (handlers.length > 0) {
			(combined as Record<string, (...args: unknown[]) => void>)[key] = (
				...args: unknown[]
			) => {
				handlers.forEach((handler) => {
					(handler as (...a: unknown[]) => void)(...args);
				});
			};
		}
	}

	return combined;
}

// =============================================================================
// Higher-order dispatcher creators
// =============================================================================

/**
 * Create a dispatcher that sets loading state
 */
export function withLoading<T>(
	setLoading: (loading: boolean) => void,
	handler: (payload: T) => void,
): (payload: T) => void {
	return (payload: T) => {
		setLoading(false);
		handler(payload);
	};
}

/**
 * Create error dispatcher that shows notification
 */
export function createErrorNotifier(
	showNotification: (message: string, type: 'error') => void,
): (payload: ErrorResponse['payload']) => void {
	return (payload) => {
		showNotification(payload.message, 'error');
	};
}
