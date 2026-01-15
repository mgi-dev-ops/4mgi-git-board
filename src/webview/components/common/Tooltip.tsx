import type React from 'react';
import {
	cloneElement,
	isValidElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
	content: React.ReactNode;
	position?: TooltipPosition;
	delay?: number;
	disabled?: boolean;
	children: React.ReactElement;
	className?: string;
}

interface TooltipCoords {
	top: number;
	left: number;
}

export function Tooltip({
	content,
	position = 'top',
	delay = 300,
	disabled = false,
	children,
	className = '',
}: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [coords, setCoords] = useState<TooltipCoords>({ top: 0, left: 0 });
	const triggerRef = useRef<HTMLElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const calculatePosition = useCallback(() => {
		if (!triggerRef.current || !tooltipRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();
		const spacing = 8;

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = triggerRect.top - tooltipRect.height - spacing;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'bottom':
				top = triggerRect.bottom + spacing;
				left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
				break;
			case 'left':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.left - tooltipRect.width - spacing;
				break;
			case 'right':
				top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
				left = triggerRect.right + spacing;
				break;
		}

		// Keep tooltip in viewport
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		if (left < 8) left = 8;
		if (left + tooltipRect.width > viewportWidth - 8) {
			left = viewportWidth - tooltipRect.width - 8;
		}
		if (top < 8) top = 8;
		if (top + tooltipRect.height > viewportHeight - 8) {
			top = viewportHeight - tooltipRect.height - 8;
		}

		setCoords({ top, left });
	}, [position]);

	const showTooltip = useCallback(() => {
		if (disabled) return;
		timeoutRef.current = setTimeout(() => {
			setIsVisible(true);
		}, delay);
	}, [delay, disabled]);

	const hideTooltip = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsVisible(false);
	}, []);

	useEffect(() => {
		if (isVisible) {
			// Calculate position after tooltip is rendered
			requestAnimationFrame(calculatePosition);
		}
	}, [isVisible, calculatePosition]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Clone the child element to add event handlers
	const childWithRef = isValidElement(children)
		? cloneElement(children, {
				ref: (node: HTMLElement) => {
					triggerRef.current = node;
					// Forward ref if child has one
					const childRef = (
						children as React.ReactElement & { ref?: React.Ref<HTMLElement> }
					).ref;
					if (typeof childRef === 'function') {
						childRef(node);
					} else if (childRef && typeof childRef === 'object') {
						(childRef as React.MutableRefObject<HTMLElement | null>).current =
							node;
					}
				},
				onMouseEnter: (e: React.MouseEvent) => {
					showTooltip();
					children.props.onMouseEnter?.(e);
				},
				onMouseLeave: (e: React.MouseEvent) => {
					hideTooltip();
					children.props.onMouseLeave?.(e);
				},
				onFocus: (e: React.FocusEvent) => {
					showTooltip();
					children.props.onFocus?.(e);
				},
				onBlur: (e: React.FocusEvent) => {
					hideTooltip();
					children.props.onBlur?.(e);
				},
			} as React.Attributes)
		: children;

	return (
		<>
			{childWithRef}
			{isVisible &&
				!disabled &&
				createPortal(
					<div
						ref={tooltipRef}
						className={`${styles.tooltip} ${styles[position]} ${className}`}
						style={{
							top: coords.top,
							left: coords.left,
						}}
						role="tooltip"
					>
						{content}
						<span className={styles.arrow} />
					</div>,
					document.body,
				)}
		</>
	);
}

export default Tooltip;
