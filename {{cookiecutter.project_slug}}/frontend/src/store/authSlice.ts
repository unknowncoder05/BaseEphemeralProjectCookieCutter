import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginRequest, SignUpRequest, RequestCodeRequest, ValidateAccountRequest } from '../types/auth';
import apiService from '../services/api';
import websocketService from '../services/websocket';

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.login(data);
      const { access, refresh } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || error.response?.data?.non_field_errors?.[0]
        || error.message
        || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (data: SignUpRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.signUp(data);
      const { access, refresh } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.email?.[0]
        || error.response?.data?.password?.[0]
        || error.response?.data?.message
        || error.response?.data?.detail
        || error.response?.data?.non_field_errors?.[0]
        || error.message
        || 'Sign up failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const requestCode = createAsyncThunk(
  'auth/requestCode',
  async (data: RequestCodeRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.requestCode(data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message
        || error.response?.data?.phone_number?.[0]
        || error.response?.data?.detail
        || error.message
        || 'Failed to request code';
      return rejectWithValue(errorMessage);
    }
  }
);

export const validateAccount = createAsyncThunk(
  'auth/validateAccount',
  async (data: ValidateAccountRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.validateAccount(data);
      const { access, refresh } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Account validation failed');
    }
  }
);

export const requestValidateToken = createAsyncThunk(
  'auth/requestValidateToken',
  async (data: RequestCodeRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.requestValidateToken(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request validation token');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.signOut();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Sign out failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;

      // Disconnect WebSocket on auth clear
      websocketService.disconnect();
      websocketService.setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        // Connect WebSocket with auth token
        const token = action.payload.access;
        if (token) {
          websocketService.setAuthToken(token);
          websocketService.connect();
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sign up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = {
          access: action.payload.access,
          refresh: action.payload.refresh,
        };
        state.isAuthenticated = true;
        state.error = null;

        // Connect WebSocket with auth token
        const token = action.payload.access;
        if (token) {
          websocketService.setAuthToken(token);
          websocketService.connect();
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Request code
      .addCase(requestCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestCode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Validate account
      .addCase(validateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        // Connect WebSocket with auth token
        const token = action.payload.access;
        if (token) {
          websocketService.setAuthToken(token);
          websocketService.connect();
        }
      })
      .addCase(validateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Request validate token
      .addCase(requestValidateToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestValidateToken.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestValidateToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        // Connect WebSocket if user is already authenticated (on app load)
        const token = localStorage.getItem('access_token');
        if (token) {
          websocketService.setAuthToken(token);
          websocketService.connect();
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;

        // Disconnect WebSocket on sign out
        websocketService.disconnect();
        websocketService.setAuthToken(null);
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
