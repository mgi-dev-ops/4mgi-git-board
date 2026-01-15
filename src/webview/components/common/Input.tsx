import type React from 'react';
import {
	forwardRef,
	type InputHTMLAttributes,
	type TextareaHTMLAttributes,
	useId,
	useState,
} from 'react';
import styles from './Input.module.css';

export type InputVariant = 'text' | 'search';

export interface BaseInputProps {
	label?: string;
	error?: string;
	helperText?: string;
}

export interface TextInputProps
	extends BaseInputProps,
		Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
	variant?: 'text';
	icon?: React.ReactNode;
	iconPosition?: 'left' | 'right';
	onClear?: () => void;
}

export interface SearchInputProps
	extends BaseInputProps,
		Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
	variant: 'search';
	onClear?: () => void;
}

export interface TextareaProps
	extends BaseInputProps,
		TextareaHTMLAttributes<HTMLTextAreaElement> {
	variant: 'textarea';
	rows?: number;
	resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export type InputProps = TextInputProps | SearchInputProps | TextareaProps;

const SearchIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M6.5 12C3.46243 12 1 9.53757 1 6.5C1 3.46243 3.46243 1 6.5 1C9.53757 1 12 3.46243 12 6.5C12 7.74832 11.5841 8.89778 10.8863 9.82497L14.5303 13.4697C14.8232 13.7626 14.8232 14.2374 14.5303 14.5303C14.2374 14.8232 13.7626 14.8232 13.4697 14.5303L9.82497 10.8863C8.89778 11.5841 7.74832 12 6.5 12ZM6.5 10.5C8.70914 10.5 10.5 8.70914 10.5 6.5C10.5 4.29086 8.70914 2.5 6.5 2.5C4.29086 2.5 2.5 4.29086 2.5 6.5C2.5 8.70914 4.29086 10.5 6.5 10.5Z"
			fill="currentColor"
		/>
	</svg>
);

const ClearIcon = () => (
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

export const Input = forwardRef<
	HTMLInputElement | HTMLTextAreaElement,
	InputProps
>((props, ref) => {
	const [isFocused, setIsFocused] = useState(false);
	const inputId = useId();

	if (props.variant === 'textarea') {
		const {
			variant,
			label,
			error,
			helperText,
			className = '',
			rows = 4,
			resize = 'vertical',
			...textareaProps
		} = props;

		const wrapperClasses = [
			styles.wrapper,
			error ? styles.hasError : '',
			isFocused ? styles.focused : '',
			props.disabled ? styles.disabled : '',
		]
			.filter(Boolean)
			.join(' ');

		return (
			<div className={wrapperClasses}>
				{label && (
					<label htmlFor={inputId} className={styles.label}>
						{label}
					</label>
				)}
				<textarea
					id={inputId}
					ref={ref as React.Ref<HTMLTextAreaElement>}
					className={`${styles.textarea} ${className}`}
					rows={rows}
					style={{ resize }}
					onFocus={(e) => {
						setIsFocused(true);
						textareaProps.onFocus?.(e);
					}}
					onBlur={(e) => {
						setIsFocused(false);
						textareaProps.onBlur?.(e);
					}}
					{...textareaProps}
				/>
				{(error || helperText) && (
					<span className={error ? styles.errorText : styles.helperText}>
						{error || helperText}
					</span>
				)}
			</div>
		);
	}

	const {
		variant = 'text',
		label,
		error,
		helperText,
		className = '',
		icon,
		iconPosition = 'left',
		onClear,
		value,
		...inputProps
	} = props as TextInputProps | SearchInputProps;

	const isSearch = variant === 'search';
	const hasValue = value !== undefined && value !== '';
	const showClearButton = onClear && hasValue;

	const wrapperClasses = [
		styles.wrapper,
		error ? styles.hasError : '',
		isFocused ? styles.focused : '',
		props.disabled ? styles.disabled : '',
	]
		.filter(Boolean)
		.join(' ');

	const inputContainerClasses = [
		styles.inputContainer,
		isSearch ? styles.searchInput : '',
		(icon && iconPosition === 'left') || isSearch ? styles.hasLeftIcon : '',
		(icon && iconPosition === 'right') || showClearButton
			? styles.hasRightIcon
			: '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={wrapperClasses}>
			{label && (
				<label htmlFor={inputId} className={styles.label}>
					{label}
				</label>
			)}
			<div className={inputContainerClasses}>
				{isSearch && (
					<span className={styles.leftIcon}>
						<SearchIcon />
					</span>
				)}
				{!isSearch && icon && iconPosition === 'left' && (
					<span className={styles.leftIcon}>{icon}</span>
				)}
				<input
					id={inputId}
					ref={ref as React.Ref<HTMLInputElement>}
					type={isSearch ? 'search' : 'text'}
					className={`${styles.input} ${className}`}
					value={value}
					onFocus={(e) => {
						setIsFocused(true);
						inputProps.onFocus?.(e);
					}}
					onBlur={(e) => {
						setIsFocused(false);
						inputProps.onBlur?.(e);
					}}
					{...inputProps}
				/>
				{showClearButton && (
					<button
						type="button"
						className={styles.clearButton}
						onClick={onClear}
						tabIndex={-1}
						aria-label="Clear input"
					>
						<ClearIcon />
					</button>
				)}
				{!isSearch && !showClearButton && icon && iconPosition === 'right' && (
					<span className={styles.rightIcon}>{icon}</span>
				)}
			</div>
			{(error || helperText) && (
				<span className={error ? styles.errorText : styles.helperText}>
					{error || helperText}
				</span>
			)}
		</div>
	);
});

Input.displayName = 'Input';

export default Input;
