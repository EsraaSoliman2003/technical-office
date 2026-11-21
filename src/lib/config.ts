/**
 * Runtime configuration.
 *
 * The API URL is read once from `/config.json` (served next to index.html, e.g. in the
 * Tauri desktop build: `{ "apiUrl": "http://192.168.1.10:5133" }`). When the file is
 * missing or invalid, the build-time `NEXT_PUBLIC_API_URL` is used (e.g. on Vercel).
 */

const FALLBACK_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5133";

let apiUrlPromise: Promise<string> | null = null;

function normalize(url: string) {
  return url.trim().replace(/\/+$/, "");
}

async function fetchApiUrl(): Promise<string> {
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (response.ok) {
      const config: unknown = await response.json();
      if (config && typeof config === "object" && "apiUrl" in config) {
        const { apiUrl } = config as { apiUrl: unknown };
        if (typeof apiUrl === "string" && apiUrl.trim()) return normalize(apiUrl);
      }
    }
  } catch {
    // No config.json (or not JSON): use the build-time fallback.
  }
  return normalize(FALLBACK_API_URL);
}

/** API origin (without `/api`). Loaded once; every caller awaits the same promise. */
export function loadApiUrl(): Promise<string> {
  apiUrlPromise ??= fetchApiUrl();
  return apiUrlPromise;
}
