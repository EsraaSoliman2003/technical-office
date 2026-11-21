const pad = (value: number) => String(value).padStart(2, "0");

/** ISO string without a timezone designator is treated as UTC (the API sends UTC). */
function parseUtc(iso: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`);
}

/**
 * Local date/time as `yyyy/MM/dd HH:mm` with Latin digits (like the old system).
 * Empty or invalid values return "—".
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = parseUtc(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}
