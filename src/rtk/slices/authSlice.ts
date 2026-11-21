import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, clearSessionIfToken, loadSession, type Session } from "@/lib/session";
import type { UserRole } from "@/types/auth";
import { api } from "../api";
import type { AppDispatch, RootState } from "../store";

/**
 * - `loading`: the session has not been read from storage yet (first render / static HTML).
 * - `authenticated` / `unauthenticated`: known.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  token: string | null;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  expiresAt: string | null;
  /**
   * True when the user chose to log out (here or in another tab). Then /login opens without
   * `returnTo`. Otherwise (no session, expired token, 401) the login returns to the current page.
   */
  loggedOutByUser: boolean;
}

const signedOut: AuthState = {
  status: "unauthenticated",
  token: null,
  userId: null,
  fullName: null,
  email: null,
  role: null,
  expiresAt: null,
  loggedOutByUser: false,
};

const initialState: AuthState = { ...signedOut, status: "loading" };

function fromSession(session: Session): AuthState {
  return {
    status: "authenticated",
    token: session.accessToken,
    userId: session.userId,
    fullName: session.fullName,
    email: session.email,
    role: session.role,
    expiresAt: session.expiresAt,
    loggedOutByUser: false,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called once on app load with the stored session (or null). */
    sessionRestored: (_state, action: PayloadAction<Session | null>) =>
      action.payload ? fromSession(action.payload) : signedOut,

    /** Called after a successful login (in this tab or another one). */
    sessionStarted: (_state, action: PayloadAction<Session>) => fromSession(action.payload),

    /** Fresh user info from GET /auth/me. */
    profileUpdated: (state, action: PayloadAction<{ fullName: string; email: string; role: UserRole }>) => {
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },

    loggedOut: (_state, action: PayloadAction<{ byUser: boolean }>) => ({
      ...signedOut,
      loggedOutByUser: action.payload.byUser,
    }),
  },
});

export const { sessionRestored, sessionStarted, profileUpdated, loggedOut } = authSlice.actions;

/** Switch this tab to `session` (logged in elsewhere), dropping cached data of the previous user. */
const adoptSession = (session: Session) => (dispatch: AppDispatch, getState: () => RootState) => {
  if (getState().auth.token === session.accessToken) return;
  dispatch(api.util.resetApiState());
  dispatch(sessionStarted(session));
};

/** Signed-out state for this tab only (storage is left alone). */
const endSessionInThisTab = (byUser: boolean) => (dispatch: AppDispatch) => {
  dispatch(loggedOut({ byUser }));
  dispatch(api.util.resetApiState());
};

/** The user chose to log out: drop the token on the client (the API has no logout endpoint). */
export const logout = () => (dispatch: AppDispatch) => {
  clearSession();
  dispatch(endSessionInThisTab(true));
};

/**
 * The API rejected `rejectedToken` (401), or it expired. Storage is cleared only if it still
 * holds that token; if another tab has stored a newer valid session meanwhile, switch to it.
 * Otherwise sign out here, keeping `returnTo` (not a user logout).
 */
export const endRejectedSession =
  (rejectedToken: string | null) => (dispatch: AppDispatch) => {
    clearSessionIfToken(rejectedToken);
    const stored = loadSession({ clearInvalid: false });
    if (stored && stored.accessToken !== rejectedToken) {
      dispatch(adoptSession(stored));
      return;
    }
    dispatch(endSessionInThisTab(false));
  };

/** Another tab logged in (session) or out (null): mirror it here without writing to storage. */
export const syncSessionFromOtherTab =
  (session: Session | null) => (dispatch: AppDispatch, getState: () => RootState) => {
    if (session) {
      dispatch(adoptSession(session));
      return;
    }
    if (getState().auth.status === "authenticated") dispatch(endSessionInThisTab(true));
  };

export default authSlice.reducer;
