/**
 * Runtime configuration.
 *
 * The API URL is read from `/config.json` (served next to index.html, e.g. in the Tauri desktop
 * build: `{ "apiUrl": "http://192.168.1.10:5133" }`). When the file is missing or invalid, the
 * build-time `NEXT_PUBLIC_API_URL` is used (e.g. on Vercel).
 *
 * Caching:
 * - cached: a valid config, a 404 (no file → fallback) and a 200 that is not valid config
 *   (some hosts answer missing files with an HTML page);
 * - not cached: network errors, the timeout and other HTTP errors. That call uses the fallback
 *   and the next API call tries again.
 */

const FALLBACK_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5133";
const CONFIG_TIMEOUT_MS = 5000;

let cachedApiUrl: string | null = null;
let inFlight: Promise<string> | null = null;

type Outcome = { apiUrl: string; cache: boolean };

function normalize(url: string) {
  return url.trim().replace(/\/+$/, "");
}

const fallback = (cache: boolean): Outcome => ({ apiUrl: normalize(FALLBACK_API_URL), cache });

async function fetchConfig(): Promise<Outcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
  try {
    const response = await fetch("/config.json", { cache: "no-store", signal: controller.signal });
    if (response.status === 404) return fallback(true);
    if (!response.ok) return fallback(false);

    let config: unknown;
    try {
      config = await response.json();
    } catch (error) {
      // Body timed out → retry later; otherwise the file is not JSON → definitive.
      return fallback(!(error instanceof DOMException && error.name === "AbortError"));
    }
    const apiUrl = config && typeof config === "object" ? (config as { apiUrl?: unknown }).apiUrl : undefined;
    if (typeof apiUrl === "string" && apiUrl.trim()) return { apiUrl: normalize(apiUrl), cache: true };
    return fallback(true);
  } catch {
    // Network error or timeout (abort).
    return fallback(false);
  } finally {
    clearTimeout(timer);
  }
}

/** API origin (without `/api`). Concurrent callers share one request; see caching rules above. */
export function loadApiUrl(): Promise<string> {
  if (cachedApiUrl !== null) return Promise.resolve(cachedApiUrl);
  inFlight ??= fetchConfig().then(({ apiUrl, cache }) => {
    if (cache) cachedApiUrl = apiUrl;
    inFlight = null;
    return apiUrl;
  });
  return inFlight;
}
