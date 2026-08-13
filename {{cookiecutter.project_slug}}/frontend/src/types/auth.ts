import { AuthProvider } from '../utils/constants';

export interface User {
  id: string;
  username: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number: string;
  preferred_provider: string;
  role?: string;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  // PM_GITHUB_START
  github_username?: string;
  github_connected?: boolean;
  // PM_GITHUB_END
}

// PM_GITHUB_START
export interface GitHubAuthUrlResponse {
  auth_url: string;
  state: string;
}

export interface GitHubCallbackRequest {
  code: string;
  state: string;
}

export interface GitHubCallbackResponse {
  success: boolean;
  github_username: string;
  github_id: string;
}

export interface GitHubStatusResponse {
  connected: boolean;
  github_username: string | null;
  github_id: string | null;
}
// PM_GITHUB_END

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

export interface RequestCodeRequest {
  phone_number: string;
  provider?: AuthProvider;
}

export interface ValidateAccountRequest {
  phone_number: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
