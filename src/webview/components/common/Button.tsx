import React, { forwardRef, ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "icon";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const isIconOnly = variant === "icon" || (!children && icon);

    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      loading ? styles.loading : "",
      isIconOnly ? styles.iconOnly : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner}>
            <svg
              className={styles.spinnerIcon}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="10"
              />
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className={styles.icon}>{icon}</span>
        )}
        {children && <span className={styles.content}>{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className={styles.icon}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
