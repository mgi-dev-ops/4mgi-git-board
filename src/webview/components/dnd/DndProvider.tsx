/**
 * DndProvider - Drag and Drop Context Provider
 * Setup @dnd-kit/core DndContext with sensors configuration
 */

import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	DragOverlay as DndKitDragOverlay,
	type DragEndEvent,
	type DragMoveEvent,
	type DragOverEvent,
	type DragStartEvent,
	KeyboardSensor,
	MouseSensor,
	pointerWithin,
	rectIntersection,
	TouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type React from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import { useDragOperation } from '../../hooks/useDragOperation';
import styles from './DndProvider.module.css';
import { DragOverlay } from './DragOverlay';
import type {
	DndContextValue,
	DragSource,
	DragState,
	DropTarget,
} from './types';

// ============================================================================
// Context
// ============================================================================

const DndStateContext = createContext<DndContextValue | null>(null);

export function useDndContext(): DndContextValue {
	const context = useContext(DndStateContext);
	if (!context) {
		throw new Error('useDndContext must be used within a DndProvider');
	}
	return context;
}

// ============================================================================
// Custom Collision Detection
// Combines multiple strategies for better drop detection
// ============================================================================

const customCollisionDetection: CollisionDetection = (args) => {
	// First try pointer within - for precise drops
	const pointerCollisions = pointerWithin(args);
	if (pointerCollisions.length > 0) {
		return pointerCollisions;
	}

	// Fall back to rect intersection for larger targets
	const rectCollisions = rectIntersection(args);
	if (rectCollisions.length > 0) {
		return rectCollisions;
	}

	// Finally use closest center as fallback
	return closestCenter(args);
};

// ============================================================================
// Props
// ============================================================================

export interface DndProviderProps {
	children: React.ReactNode;
	onOperationExecute?: (
		source: DragSource,
		target: DropTarget,
	) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export const DndProvider: React.FC<DndProviderProps> = ({
	children,
	onOperationExecute,
}) => {
	// Drag state
	const [dragState, setDragState] = useState<DragState>({
		isDragging: false,
		source: null,
		target: null,
		operation: null,
		isValidDrop: false,
	});

	// Operation detection hook
	const { determineOperation } = useDragOperation();

	// ============================================================================
	// Sensors Configuration
	// ============================================================================

	const mouseSensor = useSensor(MouseSensor, {
		// Require mouse to move 10px before activating drag
		activationConstraint: {
			distance: 10,
		},
	});

	const touchSensor = useSensor(TouchSensor, {
		// Require 250ms touch hold before activating drag
		activationConstraint: {
			delay: 250,
			tolerance: 5,
		},
	});

	const keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates,
	});

	const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

	// ============================================================================
	// Drag Handlers
	// ============================================================================

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		const source = active.data.current as DragSource | undefined;

		if (!source) {
			return;
		}

		setDragState({
			isDragging: true,
			source,
			target: null,
			operation: null,
			isValidDrop: false,
		});
	}, []);

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			const { over, active } = event;

			if (!over || !active.data.current) {
				setDragState((prev) => ({
					...prev,
					target: null,
					operation: null,
					isValidDrop: false,
				}));
				return;
			}

			const source = active.data.current as DragSource;
			const target = over.data.current as DropTarget | undefined;

			if (!target) {
				return;
			}

			const operation = determineOperation(source, target);

			setDragState((prev) => ({
				...prev,
				target,
				operation,
				isValidDrop: operation?.isValid ?? false,
			}));
		},
		[determineOperation],
	);

	const handleDragMove = useCallback((_event: DragMoveEvent) => {
		// Can be used for real-time position tracking if needed
	}, []);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { over, active } = event;

			try {
				if (over && active.data.current && dragState.isValidDrop) {
					const source = active.data.current as DragSource;
					const target = over.data.current as DropTarget;

					if (onOperationExecute && target) {
						await onOperationExecute(source, target);
					}
				}
			} finally {
				// Reset drag state
				setDragState({
					isDragging: false,
					source: null,
					target: null,
					operation: null,
					isValidDrop: false,
				});
			}
		},
		[dragState.isValidDrop, onOperationExecute],
	);

	const handleDragCancel = useCallback(() => {
		setDragState({
			isDragging: false,
			source: null,
			target: null,
			operation: null,
			isValidDrop: false,
		});
	}, []);

	// ============================================================================
	// Context Value
	// ============================================================================

	const setDragSource = useCallback((source: DragSource | null) => {
		setDragState((prev) => ({
			...prev,
			source,
		}));
	}, []);

	const setDropTarget = useCallback(
		(target: DropTarget | null) => {
			setDragState((prev) => {
				const operation =
					prev.source && target
						? determineOperation(prev.source, target)
						: null;

				return {
					...prev,
					target,
					operation,
					isValidDrop: operation?.isValid ?? false,
				};
			});
		},
		[determineOperation],
	);

	const startDrag = useCallback((source: DragSource) => {
		setDragState({
			isDragging: true,
			source,
			target: null,
			operation: null,
			isValidDrop: false,
		});
	}, []);

	const endDrag = useCallback(() => {
		setDragState({
			isDragging: false,
			source: null,
			target: null,
			operation: null,
			isValidDrop: false,
		});
	}, []);

	const executeDrop = useCallback(async () => {
		if (
			dragState.isValidDrop &&
			dragState.source &&
			dragState.target &&
			onOperationExecute
		) {
			await onOperationExecute(dragState.source, dragState.target);
		}
		endDrag();
	}, [dragState, onOperationExecute, endDrag]);

	const contextValue = useMemo<DndContextValue>(
		() => ({
			dragState,
			setDragSource,
			setDropTarget,
			startDrag,
			endDrag,
			executeDrop,
		}),
		[dragState, setDragSource, setDropTarget, startDrag, endDrag, executeDrop],
	);

	// ============================================================================
	// Render
	// ============================================================================

	return (
		<DndStateContext.Provider value={contextValue}>
			<DndContext
				sensors={sensors}
				collisionDetection={customCollisionDetection}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragMove={handleDragMove}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}
			>
				<div
					className={`
            ${styles.dndContainer}
            ${dragState.isDragging ? styles.isDragging : ''}
            ${dragState.isValidDrop ? styles.validDrop : ''}
            ${dragState.isDragging && !dragState.isValidDrop && dragState.target ? styles.invalidDrop : ''}
          `.trim()}
				>
					{children}
				</div>

				{/* Portal for drag overlay */}
				<DndKitDragOverlay dropAnimation={null}>
					{dragState.isDragging && dragState.source && (
						<DragOverlay
							source={dragState.source}
							operation={dragState.operation}
							isValidDrop={dragState.isValidDrop}
						/>
					)}
				</DndKitDragOverlay>
			</DndContext>
		</DndStateContext.Provider>
	);
};

export default DndProvider;
