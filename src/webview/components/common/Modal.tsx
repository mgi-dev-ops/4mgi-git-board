import type React from 'react';
import { type KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	size?: 'small' | 'medium' | 'large';
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	className?: string;
}

const CloseIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M8 8.70711L11.1464 11.8536C11.3417 12.0488 11.6583 12.0488 11.8536 11.8536C12.0488 11.6583 12.0488 11.3417 11.8536 11.1464L8.70711 8L11.8536 4.85355C12.0488 4.65829 12.0488 4.34171 11.8536 4.14645C11.6583 3.95118 11.3417 3.95118 11.1464 4.14645L8 7.29289L4.85355 4.14645C4.65829 3.95118 4.34171 3.95118 4.14645 4.14645C3.95118 4.34171 3.95118 4.65829 4.14645 4.85355L7.29289 8L4.14645 11.1464C3.95118 11.3417 3.95118 11.6583 4.14645 11.8536C4.34171 12.0488 4.65829 12.0488 4.85355 11.8536L8 8.70711Z"
			fill="currentColor"
		/>
	</svg>
);

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = 'medium',
	closeOnOverlay = true,
	closeOnEscape = true,
	showCloseButton = true,
	className = '',
}: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const previousActiveElement = useRef<Element | null>(null);

	const handleEscape = useCallback(
		(e: KeyboardEvent) => {
			if (closeOnEscape && e.key === 'Escape') {
				onClose();
			}
		},
		[closeOnEscape, onClose],
	);

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (closeOnOverlay && e.target === e.currentTarget) {
			onClose();
		}
	};

	// Focus trap and restore focus
	useEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement;

			// Focus the modal
			const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (focusableElements && focusableElements.length > 0) {
				focusableElements[0].focus();
			}

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.body.style.overflow = '';
			if (previousActiveElement.current instanceof HTMLElement) {
				previousActiveElement.current.focus();
			}
		};
	}, [isOpen]);

	// Handle keyboard events
	useEffect(() => {
		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
			if (!isOpen) return;

			if (closeOnEscape && e.key === 'Escape') {
				onClose();
				return;
			}

			// Focus trap
			if (e.key === 'Tab' && modalRef.current) {
				const focusableElements =
					modalRef.current.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					);
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (e.shiftKey && document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				} else if (!e.shiftKey && document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, closeOnEscape, onClose]);

	if (!isOpen) return null;

	const modalContent = (
		<div
			className={styles.overlay}
			onClick={handleOverlayClick}
			role="presentation"
		>
			<div
				ref={modalRef}
				className={`${styles.modal} ${styles[size]} ${className}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? 'modal-title' : undefined}
				onKeyDown={handleEscape}
			>
				{(title || showCloseButton) && (
					<div className={styles.header}>
						{title && (
							<h2 id="modal-title" className={styles.title}>
								{title}
							</h2>
						)}
						{showCloseButton && (
							<button
								type="button"
								className={styles.closeButton}
								onClick={onClose}
								aria-label="Close modal"
							>
								<CloseIcon />
							</button>
						)}
					</div>
				)}
				<div className={styles.body}>{children}</div>
				{footer && <div className={styles.footer}>{footer}</div>}
			</div>
		</div>
	);

	// Use portal to render at document body
	return createPortal(modalContent, document.body);
}

// Sub-components for flexibility
export function ModalHeader({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function ModalBody({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`${styles.body} ${className}`}>{children}</div>;
}

export function ModalFooter({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`${styles.footer} ${className}`}>{children}</div>;
}

export default Modal;
