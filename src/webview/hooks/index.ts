/**
 * Webview Hooks Exports
 */

export {
  useVSCodeApi,
  postMessageToExtension,
  getWebviewState,
  setWebviewState,
  createResponseResolver,
} from './useVSCodeApi';

export type { UseVSCodeApiReturn } from './useVSCodeApi';

export {
  useMessageHandler,
  combineDispatchers,
  withLoading,
  createErrorNotifier,
} from './useMessageHandler';

export type { MessageDispatcher, UseMessageHandlerOptions } from './useMessageHandler';

export {
  useTheme,
  useThemeContext,
  ThemeProvider,
  getCSSVariable,
  setCSSVariable,
  getBranchColors,
  getGraphLineColors,
  getPipelineColors,
  getStatusColors,
} from './useTheme';

export type { VSCodeTheme, ThemeContextValue, ThemeProviderProps } from './useTheme';

export {
  useGraphInteraction,
  useContextMenu,
  useTooltipDelay,
} from './useGraphInteraction';

export type {
  GraphInteractionOptions,
  TooltipPosition,
  UseGraphInteractionReturn,
  ContextMenuState,
} from './useGraphInteraction';

export {
  useKeyboardShortcuts,
  createDefaultShortcuts,
  formatShortcut,
} from './useKeyboardShortcuts';

export type {
  ShortcutDefinition,
  ShortcutCategory,
  ShortcutContext,
  ShortcutHandlers,
  ShortcutRegistry,
  ModifierKey,
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
} from './useKeyboardShortcuts';

export { useDragOperation } from './useDragOperation';

export type { DragOperationHook } from './useDragOperation';
