import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'graph' | 'list';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SortOrder = 'date-desc' | 'date-asc' | 'author' | 'topo';

export interface DateRange {
  start: string | null; // ISO date string
  end: string | null;   // ISO date string
}

export interface FilterState {
  searchQuery: string;
  author: string | null;
  dateRange: DateRange;
  branches: string[];      // Filter by specific branches
  showMergeCommits: boolean;
  filePathPattern: string | null;
}

export interface PanPosition {
  x: number;
  y: number;
}

export interface ViewportState {
  zoom: number;
  pan: PanPosition;
  minZoom: number;
  maxZoom: number;
}

export interface PanelState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  detailPanelOpen: boolean;
  detailPanelHeight: number;
  commitListWidth: number;
}

export interface GraphSettings {
  showBranchLabels: boolean;
  showTags: boolean;
  showRemoteBranches: boolean;
  compactMode: boolean;
  colorScheme: 'default' | 'colorblind' | 'monochrome';
}

// ============================================================================
// State Interface
// ============================================================================

interface UIState {
  // Selection
  selectedCommitHash: string | null;
  selectedBranch: string | null;
  selectedStashIndex: number | null;
  multiSelectedCommits: string[];

  // View mode
  viewMode: ViewMode;
  theme: ThemeMode;
  sortOrder: SortOrder;

  // Viewport
  viewport: ViewportState;

  // Panels
  panels: PanelState;

  // Filters
  filters: FilterState;

  // Graph settings
  graphSettings: GraphSettings;

  // Modal/Dialog state
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Context menu
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTarget: { type: string; data: unknown } | null;

  // Notifications
  notifications: UINotification[];
}

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  dismissible: boolean;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface UIActions {
  // Selection
  selectCommit: (hash: string | null) => void;
  selectBranch: (branch: string | null) => void;
  selectStash: (index: number | null) => void;
  toggleCommitSelection: (hash: string) => void;
  clearMultiSelection: () => void;
  selectCommitRange: (startHash: string, endHash: string, allHashes: string[]) => void;

  // View mode
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setSortOrder: (order: SortOrder) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPan: (pan: PanPosition) => void;
  panBy: (delta: PanPosition) => void;
  resetViewport: () => void;

  // Panels
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleDetailPanel: () => void;
  setDetailPanelOpen: (open: boolean) => void;
  setDetailPanelHeight: (height: number) => void;
  setCommitListWidth: (width: number) => void;

  // Filters
  setSearchQuery: (query: string) => void;
  setAuthorFilter: (author: string | null) => void;
  setDateRange: (range: DateRange) => void;
  setBranchFilter: (branches: string[]) => void;
  toggleShowMergeCommits: () => void;
  setFilePathPattern: (pattern: string | null) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;

  // Graph settings
  setGraphSettings: (settings: Partial<GraphSettings>) => void;
  toggleBranchLabels: () => void;
  toggleTags: () => void;
  toggleRemoteBranches: () => void;
  toggleCompactMode: () => void;

  // Modal/Dialog
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Context menu
  showContextMenu: (position: { x: number; y: number }, target: { type: string; data: unknown }) => void;
  hideContextMenu: () => void;

  // Notifications
  addNotification: (notification: Omit<UINotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Reset
  resetStore: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialFilters: FilterState = {
  searchQuery: '',
  author: null,
  dateRange: { start: null, end: null },
  branches: [],
  showMergeCommits: true,
  filePathPattern: null,
};

const initialViewport: ViewportState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  minZoom: 0.25,
  maxZoom: 3,
};

const initialPanels: PanelState = {
  sidebarOpen: true,
  sidebarWidth: 250,
  detailPanelOpen: false,
  detailPanelHeight: 300,
  commitListWidth: 400,
};

const initialGraphSettings: GraphSettings = {
  showBranchLabels: true,
  showTags: true,
  showRemoteBranches: true,
  compactMode: false,
  colorScheme: 'default',
};

const initialState: UIState = {
  selectedCommitHash: null,
  selectedBranch: null,
  selectedStashIndex: null,
  multiSelectedCommits: [],
  viewMode: 'graph',
  theme: 'system',
  sortOrder: 'date-desc',
  viewport: initialViewport,
  panels: initialPanels,
  filters: initialFilters,
  graphSettings: initialGraphSettings,
  activeModal: null,
  modalData: null,
  contextMenuPosition: null,
  contextMenuTarget: null,
  notifications: [],
};

// ============================================================================
// Persisted State Keys (subset for localStorage)
// ============================================================================

type PersistedUIState = Pick<UIState,
  'viewMode' | 'theme' | 'sortOrder' | 'panels' | 'graphSettings'
>;

// ============================================================================
// Store
// ============================================================================

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Selection
        selectCommit: (hash) => set((state) => {
          state.selectedCommitHash = hash;
          if (hash) {
            state.detailPanelOpen = true;
          }
        }),

        selectBranch: (branch) => set((state) => {
          state.selectedBranch = branch;
        }),

        selectStash: (index) => set((state) => {
          state.selectedStashIndex = index;
        }),

        toggleCommitSelection: (hash) => set((state) => {
          const idx = state.multiSelectedCommits.indexOf(hash);
          if (idx === -1) {
            state.multiSelectedCommits.push(hash);
          } else {
            state.multiSelectedCommits.splice(idx, 1);
          }
        }),

        clearMultiSelection: () => set((state) => {
          state.multiSelectedCommits = [];
        }),

        selectCommitRange: (startHash, endHash, allHashes) => set((state) => {
          const startIdx = allHashes.indexOf(startHash);
          const endIdx = allHashes.indexOf(endHash);
          if (startIdx === -1 || endIdx === -1) return;
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          state.multiSelectedCommits = allHashes.slice(from, to + 1);
        }),

        // View mode
        setViewMode: (mode) => set((state) => {
          state.viewMode = mode;
        }),

        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),

        setSortOrder: (order) => set((state) => {
          state.sortOrder = order;
        }),

        // Viewport
        setZoom: (zoom) => set((state) => {
          const { minZoom, maxZoom } = state.viewport;
          state.viewport.zoom = Math.min(maxZoom, Math.max(minZoom, zoom));
        }),

        zoomIn: () => set((state) => {
          const { zoom, maxZoom } = state.viewport;
          state.viewport.zoom = Math.min(maxZoom, zoom * 1.2);
        }),

        zoomOut: () => set((state) => {
          const { zoom, minZoom } = state.viewport;
          state.viewport.zoom = Math.max(minZoom, zoom / 1.2);
        }),

        resetZoom: () => set((state) => {
          state.viewport.zoom = 1;
        }),

        setPan: (pan) => set((state) => {
          state.viewport.pan = pan;
        }),

        panBy: (delta) => set((state) => {
          state.viewport.pan.x += delta.x;
          state.viewport.pan.y += delta.y;
        }),

        resetViewport: () => set((state) => {
          state.viewport = { ...initialViewport };
        }),

        // Panels
        toggleSidebar: () => set((state) => {
          state.panels.sidebarOpen = !state.panels.sidebarOpen;
        }),

        setSidebarOpen: (open) => set((state) => {
          state.panels.sidebarOpen = open;
        }),

        setSidebarWidth: (width) => set((state) => {
          state.panels.sidebarWidth = Math.max(150, Math.min(500, width));
        }),

        toggleDetailPanel: () => set((state) => {
          state.panels.detailPanelOpen = !state.panels.detailPanelOpen;
        }),

        setDetailPanelOpen: (open) => set((state) => {
          state.panels.detailPanelOpen = open;
        }),

        setDetailPanelHeight: (height) => set((state) => {
          state.panels.detailPanelHeight = Math.max(100, Math.min(600, height));
        }),

        setCommitListWidth: (width) => set((state) => {
          state.panels.commitListWidth = Math.max(200, Math.min(800, width));
        }),

        // Filters
        setSearchQuery: (query) => set((state) => {
          state.filters.searchQuery = query;
        }),

        setAuthorFilter: (author) => set((state) => {
          state.filters.author = author;
        }),

        setDateRange: (range) => set((state) => {
          state.filters.dateRange = range;
        }),

        setBranchFilter: (branches) => set((state) => {
          state.filters.branches = branches;
        }),

        toggleShowMergeCommits: () => set((state) => {
          state.filters.showMergeCommits = !state.filters.showMergeCommits;
        }),

        setFilePathPattern: (pattern) => set((state) => {
          state.filters.filePathPattern = pattern;
        }),

        clearFilters: () => set((state) => {
          state.filters = { ...initialFilters };
        }),

        hasActiveFilters: () => {
          const { filters } = get();
          return (
            filters.searchQuery !== '' ||
            filters.author !== null ||
            filters.dateRange.start !== null ||
            filters.dateRange.end !== null ||
            filters.branches.length > 0 ||
            !filters.showMergeCommits ||
            filters.filePathPattern !== null
          );
        },

        // Graph settings
        setGraphSettings: (settings) => set((state) => {
          Object.assign(state.graphSettings, settings);
        }),

        toggleBranchLabels: () => set((state) => {
          state.graphSettings.showBranchLabels = !state.graphSettings.showBranchLabels;
        }),

        toggleTags: () => set((state) => {
          state.graphSettings.showTags = !state.graphSettings.showTags;
        }),

        toggleRemoteBranches: () => set((state) => {
          state.graphSettings.showRemoteBranches = !state.graphSettings.showRemoteBranches;
        }),

        toggleCompactMode: () => set((state) => {
          state.graphSettings.compactMode = !state.graphSettings.compactMode;
        }),

        // Modal/Dialog
        openModal: (modalId, data) => set((state) => {
          state.activeModal = modalId;
          state.modalData = data ?? null;
        }),

        closeModal: () => set((state) => {
          state.activeModal = null;
          state.modalData = null;
        }),

        // Context menu
        showContextMenu: (position, target) => set((state) => {
          state.contextMenuPosition = position;
          state.contextMenuTarget = target;
        }),

        hideContextMenu: () => set((state) => {
          state.contextMenuPosition = null;
          state.contextMenuTarget = null;
        }),

        // Notifications
        addNotification: (notification) => set((state) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          state.notifications.push({
            ...notification,
            id,
            dismissible: notification.dismissible ?? true,
          });
        }),

        removeNotification: (id) => set((state) => {
          const idx = state.notifications.findIndex(n => n.id === id);
          if (idx !== -1) {
            state.notifications.splice(idx, 1);
          }
        }),

        clearNotifications: () => set((state) => {
          state.notifications = [];
        }),

        // Reset
        resetStore: () => set(() => initialState),
      })),
      {
        name: '4mgi-git-board-ui',
        partialize: (state): PersistedUIState => ({
          viewMode: state.viewMode,
          theme: state.theme,
          sortOrder: state.sortOrder,
          panels: state.panels,
          graphSettings: state.graphSettings,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectViewMode = (state: UIState) => state.viewMode;
export const selectTheme = (state: UIState) => state.theme;
export const selectZoom = (state: UIState) => state.viewport.zoom;
export const selectPan = (state: UIState) => state.viewport.pan;
export const selectFilters = (state: UIState) => state.filters;
export const selectPanels = (state: UIState) => state.panels;
export const selectGraphSettings = (state: UIState) => state.graphSettings;
export const selectIsSidebarOpen = (state: UIState) => state.panels.sidebarOpen;
export const selectIsDetailPanelOpen = (state: UIState) => state.panels.detailPanelOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectNotifications = (state: UIState) => state.notifications;
