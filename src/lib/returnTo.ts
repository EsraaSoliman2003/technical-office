/**
 * `?returnTo=` handling for the login page. Only internal paths are allowed
 * (no other origins, no protocol-relative `//host`, no backslash tricks, never back to /login).
 */

const LOGIN_PATH = "/login/";

export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const origin = window.location.origin;
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    if (url.pathname === "/login" || url.pathname.startsWith(LOGIN_PATH)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** `/login/?returnTo=<current page>` (plain `/login/` when the current page is home). */
export function loginUrlReturningHere(): string {
  const here = sanitizeReturnTo(`${window.location.pathname}${window.location.search}`);
  return here && here !== "/" ? `${LOGIN_PATH}?returnTo=${encodeURIComponent(here)}` : LOGIN_PATH;
}

/** Where to go after login: the validated `?returnTo=`, else home. */
export function returnToFromLocation(): string {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return sanitizeReturnTo(value) ?? "/";
}

export { LOGIN_PATH };
