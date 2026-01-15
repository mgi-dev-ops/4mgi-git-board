import type React from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './ContextMenu.module.css';

export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
	shortcut?: string;
	disabled?: boolean;
	danger?: boolean;
	onClick?: () => void;
}

export interface ContextMenuSeparator {
	type: 'separator';
}

export type ContextMenuItemOrSeparator = ContextMenuItem | ContextMenuSeparator;

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuProps {
	items: ContextMenuItemOrSeparator[];
	position: ContextMenuPosition;
	isOpen: boolean;
	onClose: () => void;
	className?: string;
}

function isSeparator(
	item: ContextMenuItemOrSeparator,
): item is ContextMenuSeparator {
	return (item as ContextMenuSeparator).type === 'separator';
}

export function ContextMenu({
	items,
	position,
	isOpen,
	onClose,
	className = '',
}: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [adjustedPosition, setAdjustedPosition] =
		useState<ContextMenuPosition>(position);

	// Filter items to get only clickable ones for keyboard navigation
	const clickableItems = items.filter(
		(item): item is ContextMenuItem => !isSeparator(item) && !item.disabled,
	);

	const handleItemClick = (item: ContextMenuItem) => {
		if (item.disabled) return;
		item.onClick?.();
		onClose();
	};

	const handleKeyDown = useCallback(
		(e: globalThis.KeyboardEvent) => {
			if (!isOpen) return;

			switch (e.key) {
				case 'Escape':
					e.preventDefault();
					onClose();
					break;
				case 'ArrowDown':
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < clickableItems.length - 1 ? prev + 1 : 0,
					);
					break;
				case 'ArrowUp':
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : clickableItems.length - 1,
					);
					break;
				case 'Enter':
				case ' ':
					e.preventDefault();
					if (highlightedIndex >= 0) {
						handleItemClick(clickableItems[highlightedIndex]);
					}
					break;
				case 'Tab':
					e.preventDefault();
					onClose();
					break;
			}
		},
		[isOpen, highlightedIndex, clickableItems, onClose, handleItemClick],
	);

	// Position adjustment to keep menu in viewport
	useEffect(() => {
		if (isOpen && menuRef.current) {
			const menu = menuRef.current;
			const rect = menu.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let x = position.x;
			let y = position.y;

			// Adjust horizontal position
			if (x + rect.width > viewportWidth) {
				x = viewportWidth - rect.width - 8;
			}
			if (x < 8) {
				x = 8;
			}

			// Adjust vertical position
			if (y + rect.height > viewportHeight) {
				y = viewportHeight - rect.height - 8;
			}
			if (y < 8) {
				y = 8;
			}

			setAdjustedPosition({ x, y });
		}
	}, [isOpen, position]);

	// Handle click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, handleKeyDown, onClose]);

	// Reset highlighted index when menu opens
	useEffect(() => {
		if (isOpen) {
			setHighlightedIndex(-1);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const menuContent = (
		<div
			ref={menuRef}
			className={`${styles.menu} ${className}`}
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y,
			}}
			role="menu"
			aria-orientation="vertical"
		>
			{items.map((item, index) => {
				if (isSeparator(item)) {
					return (
						<div key={`separator-${index}`} className={styles.separator} />
					);
				}

				const clickableIndex = clickableItems.indexOf(item);
				const isHighlighted = clickableIndex === highlightedIndex;

				return (
					<button
						type="button"
						key={item.id}
						className={`${styles.menuItem} ${
							item.disabled ? styles.disabled : ''
						} ${item.danger ? styles.danger : ''} ${
							isHighlighted ? styles.highlighted : ''
						}`}
						onClick={() => handleItemClick(item)}
						disabled={item.disabled}
						role="menuitem"
						tabIndex={-1}
					>
						{item.icon && <span className={styles.icon}>{item.icon}</span>}
						<span className={styles.label}>{item.label}</span>
						{item.shortcut && (
							<span className={styles.shortcut}>{item.shortcut}</span>
						)}
					</button>
				);
			})}
		</div>
	);

	return createPortal(menuContent, document.body);
}

// Context Menu Hook for easy usage
interface ContextMenuState {
	isOpen: boolean;
	position: ContextMenuPosition;
}

interface ContextMenuContextValue {
	state: ContextMenuState;
	show: (e: React.MouseEvent) => void;
	hide: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function useContextMenu() {
	const [state, setState] = useState<ContextMenuState>({
		isOpen: false,
		position: { x: 0, y: 0 },
	});

	const show = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setState({
			isOpen: true,
			position: { x: e.clientX, y: e.clientY },
		});
	}, []);

	const hide = useCallback(() => {
		setState((prev) => ({ ...prev, isOpen: false }));
	}, []);

	return { state, show, hide };
}

export function ContextMenuProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const contextMenu = useContextMenu();

	return (
		<ContextMenuContext.Provider value={contextMenu}>
			{children}
		</ContextMenuContext.Provider>
	);
}

export function useContextMenuContext() {
	const context = useContext(ContextMenuContext);
	if (!context) {
		throw new Error(
			'useContextMenuContext must be used within ContextMenuProvider',
		);
	}
	return context;
}

export default ContextMenu;
