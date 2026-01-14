import React from "react";
import styles from "./Spinner.module.css";

export type SpinnerSize = "small" | "medium" | "large";

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({
  size = "medium",
  className = "",
  label,
}: SpinnerProps) {
  return (
    <div
      className={`${styles.spinnerContainer} ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`${styles.spinner} ${styles[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle
          className={styles.arc}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="30 70"
        />
      </svg>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}

// Skeleton Loader
export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  animation = "pulse",
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${styles[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Skeleton Group - for multiple skeletons
export interface SkeletonGroupProps {
  count?: number;
  gap?: string | number;
  direction?: "row" | "column";
  children?: React.ReactNode;
  className?: string;
}

export function SkeletonGroup({
  count = 1,
  gap = 8,
  direction = "column",
  children,
  className = "",
}: SkeletonGroupProps) {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: direction,
    gap: typeof gap === "number" ? `${gap}px` : gap,
  };

  if (children) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="text" />
      ))}
    </div>
  );
}

// Loading Overlay
export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  label,
  className = "",
}: LoadingOverlayProps) {
  return (
    <div className={`${styles.overlayContainer} ${className}`}>
      {children}
      {isLoading && (
        <div className={styles.overlay}>
          <Spinner size="large" label={label} />
        </div>
      )}
    </div>
  );
}

export default Spinner;
