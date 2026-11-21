import { twMerge } from "tailwind-merge";

/** Joins class names and resolves conflicting Tailwind classes (last one wins). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
