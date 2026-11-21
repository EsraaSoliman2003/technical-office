import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type InputProps = ComponentProps<"input"> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

export function Input({ label, error, hint, id, className, containerClassName, required, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
          {required && (
            <span className="ms-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border",
          className
        )}
        {...props}
      />
      {message && (
        <p id={messageId} className={cn("text-xs", error ? "text-danger" : "text-muted-foreground")}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Input;
