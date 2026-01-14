/**
 * useVSCodeApi Hook
 * Provides type-safe access to VS Code Webview API
 */

import { useCallback, useRef } from 'react';
import type {
  RequestMessage,
  ExtensionMessage,
  RequestResponseMap,
} from '../../core/messages/types';

// =============================================================================
// VS Code API Types
// =============================================================================

interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

// =============================================================================
// Singleton VS Code API
// =============================================================================

let vscodeApi: VSCodeApi | null = null;

function getVSCodeApi(): VSCodeApi {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

// =============================================================================
// useVSCodeApi Hook
// =============================================================================

export interface UseVSCodeApiReturn {
  /** Post a message to the extension */
  postMessage: <T extends RequestMessage>(message: T) => void;

  /** Post a message and wait for response */
  postMessageAsync: <T extends RequestMessage['type']>(
    message: Extract<RequestMessage, { type: T }>
  ) => Promise<RequestResponseMap[T]>;

  /** Get persisted state */
  getState: <T>() => T | undefined;

  /** Set persisted state */
  setState: <T>(state: T) => void;

  /** Check if running in VS Code webview */
  isVSCode: boolean;
}

export function useVSCodeApi(): UseVSCodeApiReturn {
  const pendingRequests = useRef<
    Map<
      string,
      {
        resolve: (value: ExtensionMessage) => void;
        reject: (error: Error) => void;
        timeout: ReturnType<typeof setTimeout>;
      }
    >
  >(new Map());

  const isVSCode = typeof acquireVsCodeApi !== 'undefined';

  const postMessage = useCallback(<T extends RequestMessage>(message: T): void => {
    if (!isVSCode) {
      console.warn('[useVSCodeApi] Not running in VS Code webview');
      return;
    }

    const api = getVSCodeApi();
    api.postMessage(message);
  }, [isVSCode]);

  const postMessageAsync = useCallback(
    <T extends RequestMessage['type']>(
      message: Extract<RequestMessage, { type: T }>,
      timeoutMs = 30000
    ): Promise<RequestResponseMap[T]> => {
      return new Promise((resolve, reject) => {
        if (!isVSCode) {
          reject(new Error('Not running in VS Code webview'));
          return;
        }

        const requestId = `${message.type}-${Date.now()}-${Math.random()}`;

        const timeout = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error(`Request timeout: ${message.type}`));
        }, timeoutMs);

        pendingRequests.current.set(requestId, {
          resolve: resolve as (value: ExtensionMessage) => void,
          reject,
          timeout,
        });

        const api = getVSCodeApi();
        api.postMessage({ ...message, _requestId: requestId });
      });
    },
    [isVSCode]
  );

  const getState = useCallback(<T>(): T | undefined => {
    if (!isVSCode) {
      return undefined;
    }

    const api = getVSCodeApi();
    return api.getState() as T | undefined;
  }, [isVSCode]);

  const setState = useCallback(<T>(state: T): void => {
    if (!isVSCode) {
      return;
    }

    const api = getVSCodeApi();
    api.setState(state);
  }, [isVSCode]);

  return {
    postMessage,
    postMessageAsync,
    getState,
    setState,
    isVSCode,
  };
}

// =============================================================================
// Message Response Resolver
// =============================================================================

/**
 * Create a response resolver for pending async requests
 * Use this in useMessageHandler to resolve pending promises
 */
export function createResponseResolver() {
  const pendingRequests = new Map<
    string,
    {
      resolve: (value: ExtensionMessage) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  return {
    addPending: (
      requestId: string,
      resolve: (value: ExtensionMessage) => void,
      reject: (error: Error) => void,
      timeoutMs: number
    ) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error(`Request timeout`));
      }, timeoutMs);

      pendingRequests.set(requestId, { resolve, reject, timeout });
    },

    resolve: (requestId: string, response: ExtensionMessage): boolean => {
      const pending = pendingRequests.get(requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(requestId);
        pending.resolve(response);
        return true;
      }
      return false;
    },

    reject: (requestId: string, error: Error): boolean => {
      const pending = pendingRequests.get(requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(requestId);
        pending.reject(error);
        return true;
      }
      return false;
    },

    clear: () => {
      pendingRequests.forEach(({ timeout, reject }) => {
        clearTimeout(timeout);
        reject(new Error('Resolver cleared'));
      });
      pendingRequests.clear();
    },
  };
}

// =============================================================================
// Non-hook utilities (for use outside React components)
// =============================================================================

/**
 * Direct access to VS Code API (use sparingly, prefer hook)
 */
export function postMessageToExtension<T extends RequestMessage>(message: T): void {
  if (typeof acquireVsCodeApi === 'undefined') {
    console.warn('[postMessageToExtension] Not running in VS Code webview');
    return;
  }

  const api = getVSCodeApi();
  api.postMessage(message);
}

/**
 * Get VS Code webview state
 */
export function getWebviewState<T>(): T | undefined {
  if (typeof acquireVsCodeApi === 'undefined') {
    return undefined;
  }

  const api = getVSCodeApi();
  return api.getState() as T | undefined;
}

/**
 * Set VS Code webview state
 */
export function setWebviewState<T>(state: T): void {
  if (typeof acquireVsCodeApi === 'undefined') {
    return;
  }

  const api = getVSCodeApi();
  api.setState(state);
}
