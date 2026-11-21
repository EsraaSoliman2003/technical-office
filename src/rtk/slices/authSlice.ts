import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, type Session } from "@/lib/session";
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

/**
 * Logout = drop the token on the client (the API has no logout endpoint).
 * `byUser: false` for an expired/rejected token, so the next login returns to the current page.
 */
export const logout =
  ({ byUser }: { byUser: boolean }) =>
  (dispatch: AppDispatch) => {
    clearSession();
    dispatch(loggedOut({ byUser }));
    dispatch(api.util.resetApiState());
  };

/** Another tab logged in (session) or out (null): mirror it here. Guards then redirect. */
export const syncSessionFromOtherTab =
  (session: Session | null) => (dispatch: AppDispatch, getState: () => RootState) => {
    const { status, token } = getState().auth;
    if (!session) {
      if (status === "authenticated") dispatch(logout({ byUser: true }));
      return;
    }
    if (session.accessToken === token) return;
    dispatch(api.util.resetApiState()); // possibly a different user: drop cached data
    dispatch(sessionStarted(session));
  };

export default authSlice.reducer;
