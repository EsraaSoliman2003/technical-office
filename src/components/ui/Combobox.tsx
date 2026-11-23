"use client";

import { useId, useMemo, useState, type KeyboardEvent, type Ref } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type ComboboxOption = { value: string; label: string; disabled?: boolean };

type ComboboxProps = {
  options: ComboboxOption[];
  /** Selected value; "" = nothing selected. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  /** Accessible name when there is no visible label. */
  "aria-label"?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Shown in the list while options are loading. */
  loading?: boolean;
  /** Shown when no option matches the typed text. */
  emptyText?: string;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
};

/** Arabic-friendly matching: no diacritics/tatweel, أإآٱ → ا, ى → ي, ة → ه, case-insensitive. */
function normalize(text: string) {
  return text
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

/**
 * Text input with a filtered option list (ARIA combobox). Type to filter, ↑/↓ to move,
 * Enter to choose, Esc to close (without closing the dialog). Leaving the field with text that
 * matches no option restores the selected one; leaving it empty clears the selection.
 */
export function Combobox({
  options,
  value,
  onChange,
  onBlur,
  label,
  "aria-label": ariaLabel,
  placeholder,
  error,
  disabled = false,
  loading = false,
  emptyText = "لا توجد نتائج",
  inputRef,
  className,
}: ComboboxProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const listId = `${id}-list`;
  const messageId = `${id}-message`;

  const [open, setOpen] = useState(false);
  /** Text being typed; null = show the selected option's label. */
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query ? normalize(query) : "";
    return needle ? options.filter((option) => normalize(option.label).includes(needle)) : options;
  }, [options, query]);

  const firstEnabled = (from: number, step: 1 | -1) => {
    for (let index = from; index >= 0 && index < filtered.length; index += step) {
      if (!filtered[index].disabled) return index;
    }
    return -1;
  };

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = filtered.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1));
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setQuery(null);
    close();
  };

  const commitTyped = () => {
    if (query !== null) {
      const typed = normalize(query);
      if (!typed) onChange("");
      else {
        const exact = options.find((option) => !option.disabled && normalize(option.label) === typed);
        if (exact) onChange(exact.value);
      }
      setQuery(null);
    }
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          openList();
          break;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = firstEnabled(activeIndex + step, step);
        if (next !== -1) setActiveIndex(next);
        break;
      }
      case "Enter": {
        if (open && activeIndex >= 0 && filtered[activeIndex]) {
          event.preventDefault(); // choose, don't submit the form
          choose(filtered[activeIndex]);
        }
        break;
      }
      case "Escape": {
        if (open || query !== null) {
          event.preventDefault();
          // Keep the surrounding dialog open (its Esc listener is on the document).
          event.nativeEvent.stopImmediatePropagation();
          setQuery(null);
          close();
        }
        break;
      }
    }
  };

  const activeId = open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;
  const message = error;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-label={label ? undefined : ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          placeholder={placeholder}
          disabled={disabled}
          value={query ?? selected?.label ?? ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onClick={() => (open ? close() : openList())}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            commitTyped();
            onBlur?.();
          }}
          className={cn(
            "h-11 w-full rounded-lg border bg-surface ps-3 pe-9 text-sm text-foreground shadow-sm",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border"
          )}
        />
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />

        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label ?? ariaLabel}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">جاري التحميل…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  // mousedown + preventDefault keeps focus in the input.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    index === activeIndex && "bg-primary-soft text-primary-text",
                    option.value === value && "font-semibold",
                    option.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {message && (
        <p id={messageId} className="text-xs text-danger">
          {message}
        </p>
      )}
    </div>
  );
}

export default Combobox;
