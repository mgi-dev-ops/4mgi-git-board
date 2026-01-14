/**
 * Message Protocol Integration Tests
 * Tests for Extension ↔ Webview message protocol
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  MessageProtocol,
  createResponse,
  createErrorResponse,
  ErrorCodes,
  type HandlerContext,
} from '../protocol';

// Mock vscode types
interface MockWebview {
  postMessage: ReturnType<typeof vi.fn>;
  onDidReceiveMessage: ReturnType<typeof vi.fn>;
}

interface MockExtensionContext {
  subscriptions: unknown[];
  extensionPath: string;
  extensionUri: { fsPath: string };
  globalState: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  workspaceState: { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  secrets: { get: ReturnType<typeof vi.fn>; store: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  asAbsolutePath: (relativePath: string) => string;
}

describe('MessageProtocol', () => {
  let protocol: MessageProtocol;
  let mockWebview: MockWebview;
  let mockContext: HandlerContext;

  beforeEach(() => {
    const extensionContext: MockExtensionContext = {
      subscriptions: [],
      extensionPath: '/test/extension',
      extensionUri: { fsPath: '/test/extension' },
      globalState: { get: vi.fn(), update: vi.fn() },
      workspaceState: { get: vi.fn(), update: vi.fn() },
      secrets: { get: vi.fn(), store: vi.fn(), delete: vi.fn() },
      asAbsolutePath: (p: string) => `/test/extension/${p}`,
    };

    mockContext = {
      extensionContext: extensionContext as unknown as HandlerContext['extensionContext'],
      workspaceRoot: '/test/workspace',
    };

    mockWebview = {
      postMessage: vi.fn(),
      onDidReceiveMessage: vi.fn(),
    };

    protocol = new MessageProtocol(mockContext);
    protocol.setWebview(mockWebview as unknown as Parameters<typeof protocol.setWebview>[0]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create MessageProtocol instance', () => {
      expect(protocol).toBeInstanceOf(MessageProtocol);
    });
  });

  describe('setWebview / clearWebview', () => {
    it('should attach webview', () => {
      const newProtocol = new MessageProtocol(mockContext);
      newProtocol.setWebview(mockWebview as unknown as Parameters<typeof protocol.setWebview>[0]);

      newProtocol.send({ type: 'test' as any });
      expect(mockWebview.postMessage).toHaveBeenCalled();
    });

    it('should detach webview', () => {
      protocol.clearWebview();

      // Should not throw, just warn
      protocol.send({ type: 'test' as any });
      expect(mockWebview.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('on / off', () => {
    it('should register handler', async () => {
      const handler = vi.fn().mockResolvedValue({ type: 'test.response', payload: {} });

      protocol.on('git.getLog' as any, handler);
      await protocol.handleMessage({ type: 'git.getLog' } as any);

      expect(handler).toHaveBeenCalledWith(
        { type: 'git.getLog' },
        mockContext
      );
    });

    it('should unregister handler', async () => {
      const handler = vi.fn().mockResolvedValue({ type: 'test.response', payload: {} });

      protocol.on('git.getLog' as any, handler);
      protocol.off('git.getLog' as any);
      await protocol.handleMessage({ type: 'git.getLog' } as any);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should call registered handler with message and context', async () => {
      const handler = vi.fn().mockResolvedValue({
        type: 'git/log',
        payload: { commits: [] },
      });

      protocol.on('git.getLog' as any, handler);
      await protocol.handleMessage({ type: 'git.getLog', limit: 100 } as any);

      expect(handler).toHaveBeenCalledWith(
        { type: 'git.getLog', limit: 100 },
        mockContext
      );
    });

    it('should send response after handler executes', async () => {
      const response = { type: 'git/log', payload: { commits: [] } };
      const handler = vi.fn().mockResolvedValue(response);

      protocol.on('git.getLog' as any, handler);
      await protocol.handleMessage({ type: 'git.getLog' } as any);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(response);
    });

    it('should send error when no handler found', async () => {
      await protocol.handleMessage({ type: 'unknown.type' } as any);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          code: 'HANDLER_NOT_FOUND',
          message: expect.stringContaining('unknown.type'),
          requestType: 'unknown.type',
        },
      });
    });

    it('should send error when handler throws', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler failed'));

      protocol.on('git.getLog' as any, handler);
      await protocol.handleMessage({ type: 'git.getLog' } as any);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          code: 'HANDLER_ERROR',
          message: 'Handler failed',
          requestType: 'git.getLog',
        },
      });
    });
  });

  describe('send', () => {
    it('should post message to webview', () => {
      const message = { type: 'git/changed' as const };
      protocol.send(message);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(message);
    });

    it('should not throw when no webview attached', () => {
      protocol.clearWebview();

      expect(() => {
        protocol.send({ type: 'test' as any });
      }).not.toThrow();
    });
  });

  describe('sendEvent', () => {
    it('should send event message', () => {
      protocol.sendEvent({ type: 'git/changed' });

      expect(mockWebview.postMessage).toHaveBeenCalledWith({ type: 'git/changed' });
    });
  });

  describe('sendError', () => {
    it('should send error with code and message', () => {
      protocol.sendError('TEST_ERROR', 'Test error message');

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          requestType: undefined,
        },
      });
    });

    it('should include requestType when provided', () => {
      protocol.sendError('GIT_ERROR', 'Git failed', 'git.commit');

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          code: 'GIT_ERROR',
          message: 'Git failed',
          requestType: 'git.commit',
        },
      });
    });
  });

  describe('registerHandler', () => {
    it('should register a simple handler', async () => {
      const handler = vi.fn().mockResolvedValue({ data: 'test' });

      protocol.registerHandler('custom.action', handler);
      await protocol.handleMessage({ type: 'custom.action', value: 123 } as any);

      expect(handler).toHaveBeenCalledWith({ type: 'custom.action', value: 123 });
    });

    it('should send response with .response suffix', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'success' });

      protocol.registerHandler('custom.action', handler);
      await protocol.handleMessage({ type: 'custom.action' } as any);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: 'custom.action.response',
        payload: { result: 'success' },
      });
    });
  });
});

describe('createResponse', () => {
  it('should create response with correct type mapping', () => {
    const response = createResponse('repo/getInfo', {
      path: '/test',
      name: 'test',
      isGitRepository: true,
      isShallowClone: false,
      isBare: false,
      hasSubmodules: false,
      hasWorktrees: false,
      remotes: [],
    });

    expect(response.type).toBe('repo/info');
    expect(response.payload.path).toBe('/test');
  });

  it('should throw for unknown request type', () => {
    expect(() => {
      createResponse('unknown/type' as any, {});
    }).toThrow('Unknown request type');
  });
});

describe('createErrorResponse', () => {
  it('should create error response', () => {
    const error = createErrorResponse('TEST_ERROR', 'Test message', 'test.request');

    expect(error).toEqual({
      type: 'error',
      payload: {
        code: 'TEST_ERROR',
        message: 'Test message',
        requestType: 'test.request',
      },
    });
  });

  it('should handle undefined requestType', () => {
    const error = createErrorResponse('ERROR', 'Message');

    expect(error.payload.requestType).toBeUndefined();
  });
});

describe('ErrorCodes', () => {
  it('should have general error codes', () => {
    expect(ErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    expect(ErrorCodes.HANDLER_NOT_FOUND).toBe('HANDLER_NOT_FOUND');
    expect(ErrorCodes.HANDLER_ERROR).toBe('HANDLER_ERROR');
  });

  it('should have git error codes', () => {
    expect(ErrorCodes.GIT_ERROR).toBe('GIT_ERROR');
    expect(ErrorCodes.BRANCH_EXISTS).toBe('BRANCH_EXISTS');
    expect(ErrorCodes.MERGE_CONFLICT).toBe('MERGE_CONFLICT');
  });

  it('should have azure error codes', () => {
    expect(ErrorCodes.AZURE_AUTH_FAILED).toBe('AZURE_AUTH_FAILED');
    expect(ErrorCodes.AZURE_API_ERROR).toBe('AZURE_API_ERROR');
    expect(ErrorCodes.PR_NOT_FOUND).toBe('PR_NOT_FOUND');
  });

  it('should have github error codes', () => {
    expect(ErrorCodes.GITHUB_AUTH_FAILED).toBe('GITHUB_AUTH_FAILED');
    expect(ErrorCodes.GITHUB_API_ERROR).toBe('GITHUB_API_ERROR');
  });
});

describe('Message Flow Integration', () => {
  let protocol: MessageProtocol;
  let mockWebview: MockWebview;
  let mockContext: HandlerContext;

  beforeEach(() => {
    const extensionContext: MockExtensionContext = {
      subscriptions: [],
      extensionPath: '/test/extension',
      extensionUri: { fsPath: '/test/extension' },
      globalState: { get: vi.fn(), update: vi.fn() },
      workspaceState: { get: vi.fn(), update: vi.fn() },
      secrets: { get: vi.fn(), store: vi.fn(), delete: vi.fn() },
      asAbsolutePath: (p: string) => `/test/extension/${p}`,
    };

    mockContext = {
      extensionContext: extensionContext as unknown as HandlerContext['extensionContext'],
      workspaceRoot: '/test/workspace',
    };

    mockWebview = {
      postMessage: vi.fn(),
      onDidReceiveMessage: vi.fn(),
    };

    protocol = new MessageProtocol(mockContext);
    protocol.setWebview(mockWebview as unknown as Parameters<typeof protocol.setWebview>[0]);
  });

  it('should handle complete request-response cycle', async () => {
    // Register handler
    protocol.registerHandler('git.getCommits', async (msg) => ({
      commits: [{ hash: 'abc123', message: 'Test' }],
      hasMore: false,
    }));

    // Simulate webview sending request
    await protocol.handleMessage({ type: 'git.getCommits', limit: 10 } as any);

    // Verify response sent back
    expect(mockWebview.postMessage).toHaveBeenCalledWith({
      type: 'git.getCommits.response',
      payload: {
        commits: [{ hash: 'abc123', message: 'Test' }],
        hasMore: false,
      },
    });
  });

  it('should handle async operations with errors', async () => {
    protocol.registerHandler('git.checkout', async () => {
      throw new Error('Branch not found');
    });

    await protocol.handleMessage({ type: 'git.checkout', ref: 'nonexistent' } as any);

    expect(mockWebview.postMessage).toHaveBeenCalledWith({
      type: 'error',
      payload: {
        code: 'HANDLER_ERROR',
        message: 'Branch not found',
        requestType: 'git.checkout',
      },
    });
  });

  it('should handle multiple concurrent requests', async () => {
    protocol.registerHandler('git.getCommits', async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { commits: [] };
    });

    protocol.registerHandler('git.getBranches', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return { branches: [] };
    });

    // Send multiple requests
    const p1 = protocol.handleMessage({ type: 'git.getCommits' } as any);
    const p2 = protocol.handleMessage({ type: 'git.getBranches' } as any);

    await Promise.all([p1, p2]);

    // Both responses should be sent
    expect(mockWebview.postMessage).toHaveBeenCalledTimes(2);
  });
});
