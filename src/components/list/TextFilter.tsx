"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toLatinDigits } from "@/lib/numbers";

type TextFilterProps = {
  label: string;
  /** Applied value (from the URL); undefined = no filter. */
  value: string | undefined;
  onChange: (value: string | null) => void;
  /** Numbers/codes: shown left-to-right. */
  ltr?: boolean;
};

/** Typed text → applied value: Latin digits, trimmed. */
const normalize = (text: string) => toLatinDigits(text).trim();

/**
 * A free-text filter for the `ListPage` toolbar (e.g. رقم البوليصة, matched exactly by the API).
 * Applied like the search box: after typing stops (400 ms) or on Enter; Esc or "مسح" clears it.
 * Arabic-Indic digits are converted to Latin.
 */
export function TextFilter({ label, value, onChange, ltr = false }: TextFilterProps) {
  const applied = value ?? "";
  const [text, setText] = useState(applied);
  const debounced = useDebouncedValue(text, 400);
  const lastDebounced = useRef(debounced);

  // Follow the URL when it changes from outside (back/forward, "show newest"); our own updates
  // already match the typed text. (State adjusted during render, like the search box.)
  const [prevApplied, setPrevApplied] = useState(applied);
  if (applied !== prevApplied) {
    setPrevApplied(applied);
    if (applied !== normalize(text)) setText(applied);
  }

  const apply = (next: string) => {
    if (next !== applied) onChange(next || null);
  };

  useEffect(() => {
    if (lastDebounced.current === debounced) return;
    lastDebounced.current = debounced;
    const next = normalize(debounced);
    if (next !== applied) onChange(next || null);
  }, [debounced, applied, onChange]);

  const clear = () => {
    setText("");
    apply("");
  };

  return (
    <div className="relative w-full sm:w-44">
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        dir={ltr ? "ltr" : undefined}
        autoComplete="off"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply(normalize(text));
          } else if (event.key === "Escape" && text) {
            event.preventDefault();
            clear();
          }
        }}
        // The clear button sits on the left whatever the text direction.
        className="pl-9 placeholder:text-right [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label={`مسح ${label}`}
          title="مسح"
          className="absolute top-1/2 left-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
