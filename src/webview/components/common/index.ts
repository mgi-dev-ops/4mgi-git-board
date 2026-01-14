/**
 * Common UI Components for 4MGI Git Board
 *
 * This module exports reusable UI components that follow VS Code design language.
 */

// Button
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

// Input
export { Input } from "./Input";
export type {
  InputProps,
  TextInputProps,
  SearchInputProps,
  TextareaProps,
  BaseInputProps,
} from "./Input";

// Dropdown
export { Dropdown } from "./Dropdown";
export type {
  DropdownProps,
  DropdownOption,
  SingleDropdownProps,
  MultiDropdownProps,
} from "./Dropdown";

// Modal
export { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
export type { ModalProps } from "./Modal";

// ContextMenu
export {
  ContextMenu,
  ContextMenuProvider,
  useContextMenu,
  useContextMenuContext,
} from "./ContextMenu";
export type {
  ContextMenuProps,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuItemOrSeparator,
  ContextMenuPosition,
} from "./ContextMenu";

// Tooltip
export { Tooltip } from "./Tooltip";
export type { TooltipProps, TooltipPosition } from "./Tooltip";

// Badge
export { Badge, StatusBadge, CommitTypeBadge } from "./Badge";
export type {
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  StatusBadgeProps,
  CommitTypeBadgeProps,
} from "./Badge";

// Spinner
export { Spinner, Skeleton, SkeletonGroup, LoadingOverlay } from "./Spinner";
export type {
  SpinnerProps,
  SpinnerSize,
  SkeletonProps,
  SkeletonVariant,
  SkeletonGroupProps,
  LoadingOverlayProps,
} from "./Spinner";

// Icon
export { Icon } from "./Icon";
export type { IconProps, IconName, IconSize } from "./Icon";
