import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface BaseDropdownProps {
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  error?: string;
  label?: string;
}

export interface SingleDropdownProps extends BaseDropdownProps {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
}

export interface MultiDropdownProps extends BaseDropdownProps {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
}

export type DropdownProps = SingleDropdownProps | MultiDropdownProps;

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.14645 5.64645C4.34171 5.45118 4.65829 5.45118 4.85355 5.64645L8 8.79289L11.1464 5.64645C11.3417 5.45118 11.6583 5.45118 11.8536 5.64645C12.0488 5.84171 12.0488 6.15829 11.8536 6.35355L8.35355 9.85355C8.15829 10.0488 7.84171 10.0488 7.64645 9.85355L4.14645 6.35355C3.95118 6.15829 3.95118 5.84171 4.14645 5.64645Z"
      fill="currentColor"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.7803 4.46967C14.0732 4.76256 14.0732 5.23744 13.7803 5.53033L6.53033 12.7803C6.23744 13.0732 5.76256 13.0732 5.46967 12.7803L2.21967 9.53033C1.92678 9.23744 1.92678 8.76256 2.21967 8.46967C2.51256 8.17678 2.98744 8.17678 3.28033 8.46967L6 11.1893L12.7197 4.46967C13.0126 4.17678 13.4874 4.17678 13.7803 4.46967Z"
      fill="currentColor"
    />
  </svg>
);

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

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (props, ref) => {
    const {
      options,
      placeholder = "Select...",
      disabled = false,
      searchable = false,
      searchPlaceholder = "Search...",
      className = "",
      error,
      label,
      multiple = false,
    } = props;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    const getSelectedLabels = useCallback(() => {
      if (multiple) {
        const values = (props as MultiDropdownProps).value || [];
        return options
          .filter((opt) => values.includes(opt.value))
          .map((opt) => opt.label);
      }
      const value = (props as SingleDropdownProps).value;
      const selected = options.find((opt) => opt.value === value);
      return selected ? [selected.label] : [];
    }, [multiple, options, props]);

    const displayText = () => {
      const labels = getSelectedLabels();
      if (labels.length === 0) return placeholder;
      if (multiple && labels.length > 2) {
        return `${labels.length} selected`;
      }
      return labels.join(", ");
    };

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      setSearchQuery("");
      setHighlightedIndex(-1);
    };

    const handleSelect = (option: DropdownOption) => {
      if (option.disabled) return;

      if (multiple) {
        const currentValues = (props as MultiDropdownProps).value || [];
        const onChange = (props as MultiDropdownProps).onChange;
        const newValues = currentValues.includes(option.value)
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value];
        onChange?.(newValues);
      } else {
        const onChange = (props as SingleDropdownProps).onChange;
        onChange?.(option.value);
        setIsOpen(false);
      }
    };

    const isSelected = (optionValue: string) => {
      if (multiple) {
        const values = (props as MultiDropdownProps).value || [];
        return values.includes(optionValue);
      }
      return (props as SingleDropdownProps).value === optionValue;
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          if (!isOpen) {
            e.preventDefault();
            setIsOpen(true);
          } else if (highlightedIndex >= 0) {
            e.preventDefault();
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case "Tab":
          if (isOpen) {
            setIsOpen(false);
          }
          break;
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[
          searchable ? highlightedIndex + 1 : highlightedIndex
        ] as HTMLElement;
        item?.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex, searchable]);

    const wrapperClasses = [
      styles.wrapper,
      error ? styles.hasError : "",
      disabled ? styles.disabled : "",
    ]
      .filter(Boolean)
      .join(" ");

    const triggerClasses = [
      styles.trigger,
      isOpen ? styles.open : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        {label && <label className={styles.label}>{label}</label>}
        <div
          ref={(node) => {
            dropdownRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={styles.container}
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            className={triggerClasses}
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={styles.triggerText}>{displayText()}</span>
            <span className={`${styles.chevron} ${isOpen ? styles.rotated : ""}`}>
              <ChevronDownIcon />
            </span>
          </button>

          {isOpen && (
            <div className={styles.dropdown}>
              {searchable && (
                <div className={styles.searchContainer}>
                  <span className={styles.searchIcon}>
                    <SearchIcon />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <ul ref={listRef} className={styles.optionsList} role="listbox">
                {filteredOptions.length === 0 ? (
                  <li className={styles.noResults}>No results found</li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      className={`${styles.option} ${
                        option.disabled ? styles.optionDisabled : ""
                      } ${isSelected(option.value) ? styles.optionSelected : ""} ${
                        highlightedIndex === index ? styles.optionHighlighted : ""
                      }`}
                      onClick={() => handleSelect(option)}
                      role="option"
                      aria-selected={isSelected(option.value)}
                      aria-disabled={option.disabled}
                    >
                      {multiple && (
                        <span className={styles.checkbox}>
                          {isSelected(option.value) && <CheckIcon />}
                        </span>
                      )}
                      {option.icon && (
                        <span className={styles.optionIcon}>{option.icon}</span>
                      )}
                      <span className={styles.optionLabel}>{option.label}</span>
                      {!multiple && isSelected(option.value) && (
                        <span className={styles.checkmark}>
                          <CheckIcon />
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export default Dropdown;
