import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/types/auth";

/**
 * Client-only session storage. The token lives in localStorage, which works the
 * same in the browser and inside the future Tauri desktop shell.
 */
export interface Session {
  accessToken: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "technical-office.session";

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Token expiry in ms since epoch: the JWT `exp` claim, falling back to `expiresAt`.
 * Returns null when the token cannot be decoded (treated as invalid).
 */
export function getTokenExpiry(token: string, expiresAt?: string): number | null {
  let exp: number | undefined;
  try {
    exp = jwtDecode<{ exp?: number }>(token).exp;
  } catch {
    return null;
  }
  if (typeof exp === "number") return exp * 1000;

  const fallback = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isNaN(fallback) ? null : fallback;
}

export function isSessionValid(session: Session): boolean {
  const expiry = getTokenExpiry(session.accessToken, session.expiresAt);
  return expiry !== null && expiry > Date.now();
}

export function saveSession(session: Session): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the session then lives in memory only.
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Reads the stored session. Returns null when missing, malformed or expired; in that case the
 * entry is also removed unless `clearInvalid: false` (read-only, e.g. when reacting to another tab).
 */
export function loadSession({ clearInvalid = true }: { clearInvalid?: boolean } = {}): Session | null {
  if (!isBrowser()) return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Session;
    if (session && typeof session.accessToken === "string" && isSessionValid(session)) {
      return session;
    }
  } catch {
    // malformed JSON
  }
  if (clearInvalid) clearSession();
  return null;
}

/** The token currently in storage, without validating or modifying anything. */
function readStoredToken(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const token = (JSON.parse(raw) as Partial<Session>)?.accessToken;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

/**
 * Removes the stored session only if it still holds `token`. Another tab may already have
 * stored a newer session after the request with `token` was sent; that one must survive.
 */
export function clearSessionIfToken(token: string | null): void {
  if (token && readStoredToken() === token) clearSession();
}

export function getToken(): string | null {
  return loadSession()?.accessToken ?? null;
}

/**
 * Calls back with the current session whenever another tab logs in or out
 * (the `storage` event only fires in the other tabs).
 */
export function subscribeToSessionChanges(callback: (session: Session | null) => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    // Read-only: reacting to another tab never writes to storage.
    if (event.key === STORAGE_KEY || event.key === null) callback(loadSession({ clearInvalid: false }));
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
