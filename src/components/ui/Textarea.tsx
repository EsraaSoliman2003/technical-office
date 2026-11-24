import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = ComponentProps<"textarea"> & {
  label?: string;
  error?: string;
  /** Current length, shown as "n / max" when `maxChars` is set. */
  length?: number;
  /** Limit shown in the counter (validation stays in the form, so the text is never cut). */
  maxChars?: number;
  containerClassName?: string;
};

/** Multi-line text field in the style of `Input`, with an optional character counter. */
export function Textarea({
  label,
  error,
  length,
  maxChars,
  id,
  className,
  containerClassName,
  required,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;
  const counterId = `${textareaId}-counter`;
  const showCounter = maxChars !== undefined;
  const over = showCounter && (length ?? 0) > maxChars;
  const describedBy = [error ? messageId : null, showCounter ? counterId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-semibold text-foreground">
          {label}
          {required && (
            <span className="ms-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        id={textareaId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          "min-h-24 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border",
          className
        )}
        {...props}
      />
      {(error || showCounter) && (
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <p id={messageId} className="text-xs text-danger">
              {error}
            </p>
          ) : (
            <span />
          )}
          {showCounter && (
            <p
              id={counterId}
              className={cn("shrink-0 text-xs tabular-nums", over ? "text-danger" : "text-muted-foreground")}
            >
              <span dir="ltr">
                {length ?? 0} / {maxChars}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Textarea;
