import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/lib/axios";
import { LoginResponse, RegisterResponse } from "@/utils/dtos";
import { getApiFailure, parseApiFailure, type ApiFailure } from "@/utils/apiFailure";

// ===========================
// State
// ===========================

interface AuthState {
  loading: boolean;
  token: string | null;
}

const initialState: AuthState = {
  loading: false,
  token: null,
};

// ===========================
// Register
// ===========================

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  // platform: "Website"
}

export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterPayload,
  { rejectValue: ApiFailure }
>("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("auth/register", data);
    if (res.data?.success === false) {
      return rejectWithValue(parseApiFailure(res.data));
    }
    return res.data;
  } catch (error) {
    return rejectWithValue(getApiFailure(error));
  }
});

// ===========================
// Login
// ===========================

interface LoginPayload {
  login: string;
  password: string;
}

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: ApiFailure }
>("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("auth/login", data);
    if (res.data?.success === false) {
      return rejectWithValue(parseApiFailure(res.data));
    }
    return res.data;
  } catch (error) {
    return rejectWithValue(getApiFailure(error));
  }
});

// ===========================
// Logout
// ===========================

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: ApiFailure }
>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post("auth/logout");
      if (res.data?.success === false) {
        return rejectWithValue(parseApiFailure(res.data));
      }
    } catch (error) {
      return rejectWithValue(getApiFailure(error));
    }
  }
);

// ===========================
// Slice
// ===========================

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    resetAuthState: () => initialState,

    initializeAuth: (
      state,
      action: PayloadAction<{
        token: string | null;
      }>
    ) => {
      state.token = action.payload.token;
    },
  },

  extraReducers: (builder) => {
    builder

      // ===========================
      // REGISTER
      // ===========================

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
      })

      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })

      // ===========================
      // LOGIN
      // ===========================

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.data.token;
      })

      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
      })

      // ===========================
      // LOGOUT
      // ===========================

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
      })

      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.token = null;
      });
  },
});

export const {
  resetAuthState,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;