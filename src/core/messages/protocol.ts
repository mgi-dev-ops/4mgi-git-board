/**
 * Message Protocol Handler
 * Extension-side message handling
 */

import type * as vscode from 'vscode';
import type {
  RequestMessage,
  ResponseMessage,
  EventMessage,
  ErrorResponse,
  ExtensionMessage,
  RequestResponseMap,
} from './types';

// =============================================================================
// Types
// =============================================================================

type MessageHandler<T extends RequestMessage> = (
  message: T,
  context: HandlerContext
) => Promise<ResponseMessage | ErrorResponse>;

type HandlerMap = {
  [K in RequestMessage['type']]?: MessageHandler<Extract<RequestMessage, { type: K }>>;
};

export interface HandlerContext {
  extensionContext: vscode.ExtensionContext;
  workspaceRoot?: string;
}

// =============================================================================
// MessageProtocol Class
// =============================================================================

export class MessageProtocol {
  private handlers: HandlerMap = {};
  private webview: vscode.Webview | null = null;
  private context: HandlerContext;

  constructor(context: HandlerContext) {
    this.context = context;
  }

  /**
   * Attach webview for message sending
   */
  setWebview(webview: vscode.Webview): void {
    this.webview = webview;
  }

  /**
   * Detach webview
   */
  clearWebview(): void {
    this.webview = null;
  }

  /**
   * Register a handler for a specific message type
   */
  on<T extends RequestMessage['type']>(
    type: T,
    handler: MessageHandler<Extract<RequestMessage, { type: T }>>
  ): void {
    this.handlers[type] = handler as HandlerMap[T];
  }

  /**
   * Remove a handler for a specific message type
   */
  off(type: RequestMessage['type']): void {
    delete this.handlers[type];
  }

  /**
   * Handle incoming message from webview
   */
  async handleMessage(message: RequestMessage): Promise<void> {
    const handler = this.handlers[message.type];

    if (!handler) {
      console.warn(`[MessageProtocol] No handler for message type: ${message.type}`);
      this.sendError('HANDLER_NOT_FOUND', `No handler for ${message.type}`, message.type);
      return;
    }

    try {
      const response = await (handler as MessageHandler<typeof message>)(message, this.context);
      this.send(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MessageProtocol] Error handling ${message.type}:`, error);
      this.sendError('HANDLER_ERROR', errorMessage, message.type);
    }
  }

  /**
   * Send a response message to webview
   */
  send(message: ExtensionMessage): void {
    if (!this.webview) {
      console.warn('[MessageProtocol] No webview attached');
      return;
    }

    this.webview.postMessage(message);
  }

  /**
   * Send an event to webview
   */
  sendEvent(event: EventMessage): void {
    this.send(event);
  }

  /**
   * Send an error response
   */
  sendError(code: string, message: string, requestType?: string): void {
    const error: ErrorResponse = {
      type: 'error',
      payload: { code, message, requestType: requestType ?? undefined },
    };
    this.send(error);
  }

  /**
   * Register a simple handler (alias for on) with any payload type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerHandler(type: string, handler: (payload: any) => Promise<any>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.handlers as any)[type] = async (message: any, _context: HandlerContext) => {
      const result = await handler(message);
      return { type: `${type}.response`, payload: result };
    };
  }

  /**
   * Create message listener for webview
   */
  createMessageListener(): vscode.Disposable | null {
    if (!this.webview) {
      console.warn('[MessageProtocol] No webview attached');
      return null;
    }

    return this.webview.onDidReceiveMessage(
      (message: RequestMessage) => this.handleMessage(message),
      undefined
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a typed response helper
 */
export function createResponse<T extends RequestMessage['type']>(
  type: T,
  payload: RequestResponseMap[T]['payload']
): RequestResponseMap[T] {
  // Map request type to response type
  const responseTypeMap: Record<string, string> = {
    'repo/getInfo': 'repo/info',
    'repo/getStatus': 'repo/status',
    'git/getLog': 'git/log',
    'git/commit': 'git/success',
    'git/amend': 'git/success',
    'git/getBranches': 'git/branches',
    'git/checkout': 'git/success',
    'git/createBranch': 'git/success',
    'git/deleteBranch': 'git/success',
    'git/merge': 'git/success',
    'git/rebase': 'git/success',
    'git/cherryPick': 'git/success',
    'git/stage': 'git/success',
    'git/unstage': 'git/success',
    'git/stashList': 'git/stashes',
    'git/stashCreate': 'git/success',
    'git/stashApply': 'git/success',
    'git/stashDrop': 'git/success',
    'azure/getPRs': 'azure/prs',
    'azure/createPR': 'azure/prCreated',
    'azure/getWorkItems': 'azure/workItems',
    'azure/linkWorkItem': 'azure/workItemLinked',
    'azure/getPipelineStatus': 'azure/pipelineStatus',
    'azure/getPolicyConfigurations': 'azure/policyConfigurations',
    'azure/getPolicyEvaluations': 'azure/policyEvaluations',
    'azure/getBuildDetails': 'azure/buildDetails',
    'azure/getTestResults': 'azure/testResults',
    'azure/getCodeCoverage': 'azure/codeCoverage',
    'azure/triggerRebuild': 'azure/rebuildTriggered',
    'github/getPRs': 'github/prs',
  };

  const responseType = responseTypeMap[type];
  if (!responseType) {
    throw new Error(`Unknown request type: ${type}`);
  }

  return {
    type: responseType,
    payload,
  } as RequestResponseMap[T];
}

/**
 * Create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestType?: string
): ErrorResponse {
  return {
    type: 'error',
    payload: { code, message, requestType: requestType ?? undefined },
  };
}

// =============================================================================
// Error Codes
// =============================================================================

export const ErrorCodes = {
  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  HANDLER_NOT_FOUND: 'HANDLER_NOT_FOUND',
  HANDLER_ERROR: 'HANDLER_ERROR',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',

  // Repository
  REPO_NOT_FOUND: 'REPO_NOT_FOUND',
  REPO_NOT_INITIALIZED: 'REPO_NOT_INITIALIZED',

  // Git Operations
  GIT_ERROR: 'GIT_ERROR',
  BRANCH_EXISTS: 'BRANCH_EXISTS',
  BRANCH_NOT_FOUND: 'BRANCH_NOT_FOUND',
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  MERGE_CONFLICT: 'MERGE_CONFLICT',
  REBASE_CONFLICT: 'REBASE_CONFLICT',
  COMMIT_FAILED: 'COMMIT_FAILED',
  STASH_FAILED: 'STASH_FAILED',

  // Azure
  AZURE_AUTH_FAILED: 'AZURE_AUTH_FAILED',
  AZURE_API_ERROR: 'AZURE_API_ERROR',
  AZURE_NOT_CONFIGURED: 'AZURE_NOT_CONFIGURED',
  PR_NOT_FOUND: 'PR_NOT_FOUND',
  WORK_ITEM_NOT_FOUND: 'WORK_ITEM_NOT_FOUND',
  PIPELINE_NOT_FOUND: 'PIPELINE_NOT_FOUND',

  // GitHub
  GITHUB_AUTH_FAILED: 'GITHUB_AUTH_FAILED',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
