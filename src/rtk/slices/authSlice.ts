import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, type Session } from "@/lib/session";
import type { UserRole } from "@/utils/dtos";
import { api } from "../api";
import type { AppDispatch } from "../store";

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
}

const signedOut: AuthState = {
  status: "unauthenticated",
  token: null,
  userId: null,
  fullName: null,
  email: null,
  role: null,
  expiresAt: null,
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
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Called once on app load with the stored session (or null). */
    sessionRestored: (_state, action: PayloadAction<Session | null>) =>
      action.payload ? fromSession(action.payload) : signedOut,

    /** Called after a successful login. */
    sessionStarted: (_state, action: PayloadAction<Session>) => fromSession(action.payload),

    /** Fresh user info from GET /auth/me. */
    profileUpdated: (state, action: PayloadAction<{ fullName: string; email: string; role: UserRole }>) => {
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },

    loggedOut: () => signedOut,
  },
});

export const { sessionRestored, sessionStarted, profileUpdated, loggedOut } = authSlice.actions;

/** Logout = drop the token on the client (the API has no logout endpoint). */
export const logout = () => (dispatch: AppDispatch) => {
  clearSession();
  dispatch(loggedOut());
  dispatch(api.util.resetApiState());
};

export default authSlice.reducer;
