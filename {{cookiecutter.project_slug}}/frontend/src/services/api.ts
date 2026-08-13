/**
 * API Service - Centralized API client for the application.
 *
 * This module provides:
 * - Axios instance with interceptors for auth and error handling
 * - Authentication endpoints (login, signup, etc.)
 * - Items CRUD endpoints (example module)
 * - Generic HTTP methods for extending the API
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  SignUpRequest,
  RequestCodeRequest,
  ValidateAccountRequest,
  User,
  AuthTokens,
  // PM_GITHUB_START
  GitHubAuthUrlResponse,
  GitHubCallbackRequest,
  GitHubCallbackResponse,
  GitHubStatusResponse
  // PM_GITHUB_END
} from '../types/auth';
import {
  Item,
  ItemListItem,
  CreateItemRequest,
  UpdateItemRequest,
} from '../types/items';
import backendManager from './BackendManager';
import env from '../config/environment';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: env.apiBaseUrl,
      withCredentials: true, // Important for cookie-based authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to ensure backend is ready and use dynamic URL
    this.api.interceptors.request.use(
      async (config) => {
        // Ensure backend is running (only affects on-demand backends)
        await backendManager.ensureBackendReady();

        // Update base URL dynamically (in case backend IP changed)
        config.baseURL = backendManager.getApiBaseUrl();

        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh and server errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors (backend might be cold-starting)
        if (!error.response && env.backend.useOnDemandBackend) {
          // Network error with on-demand backend - might be cold start
          if (!originalRequest._backendRetry) {
            originalRequest._backendRetry = true;
            console.log('Network error, attempting to wake backend...');

            // Reset backend state and try to start it
            backendManager.reset();
            await backendManager.ensureBackendReady();

            // Retry the request
            return this.api(originalRequest);
          }
        }

        // Handle 500 server errors
        if (error.response?.status >= 500) {
          // If using on-demand backend, try one retry after resetting
          if (env.backend.useOnDemandBackend && !originalRequest._serverErrorRetry) {
            originalRequest._serverErrorRetry = true;
            console.log('Server error, attempting to restart backend...');

            backendManager.reset();
            await backendManager.ensureBackendReady();

            return this.api(originalRequest);
          }

          // After retry or if not on-demand, show error page
          if (!window.location.pathname.includes('/server-down')) {
            window.location.href = '/server-down';
          }
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken();
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================================================================
  // GENERIC HTTP METHODS
  // ==================================================================

  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  // ==================================================================
  // AUTHENTICATION ENDPOINTS
  // ==================================================================

  async login(data: LoginRequest): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/login/', data);
  }

  async signUp(data: SignUpRequest): Promise<AxiosResponse<{ user: User } & AuthTokens>> {
    return this.api.post('/auth/sign-up/', data);
  }

  async requestCode(data: RequestCodeRequest): Promise<AxiosResponse<{ provider: string }>> {
    return this.api.post('/auth/request-code/', data);
  }

  async validateAccount(data: ValidateAccountRequest): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/validate-account/', data);
  }

  async requestValidateToken(data: RequestCodeRequest): Promise<AxiosResponse<{ provider: string }>> {
    return this.api.post('/auth/request-validate-token/', data);
  }

  async refreshToken(): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/token-refresh/');
  }

  async signOut(): Promise<AxiosResponse<void>> {
    return this.api.post('/auth/sign-out/');
  }

  // ==================================================================
  // USER ENDPOINTS
  // ==================================================================

  async getCurrentUser(): Promise<AxiosResponse<User>> {
    return this.api.get('/users/me/');
  }

  // ==================================================================
  // GITHUB OAUTH ENDPOINTS
  // ==================================================================
  // PM_GITHUB_START
  async getGitHubAuthUrl(): Promise<AxiosResponse<GitHubAuthUrlResponse>> {
    return this.api.get('/github/auth-url/');
  }

  async gitHubCallback(data: GitHubCallbackRequest): Promise<AxiosResponse<GitHubCallbackResponse>> {
    return this.api.post('/github/callback/', data);
  }

  async disconnectGitHub(): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return this.api.post('/github/disconnect/');
  }

  async getGitHubStatus(): Promise<AxiosResponse<GitHubStatusResponse>> {
    return this.api.get('/github/status/');
  }
  // PM_GITHUB_END

  // ==================================================================
  // ITEMS ENDPOINTS (Example CRUD module)
  // ==================================================================

  async getItems(): Promise<AxiosResponse<ItemListItem[]>> {
    return this.api.get('/items/');
  }

  async getItem(id: number): Promise<AxiosResponse<Item>> {
    return this.api.get(`/items/${id}/`);
  }

  async createItem(data: CreateItemRequest): Promise<AxiosResponse<Item>> {
    return this.api.post('/items/', data);
  }

  async updateItem(id: number, data: UpdateItemRequest): Promise<AxiosResponse<Item>> {
    return this.api.patch(`/items/${id}/`, data);
  }

  async deleteItem(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/items/${id}/`);
  }

  async archiveItem(id: number): Promise<AxiosResponse<Item>> {
    return this.api.post(`/items/${id}/archive/`);
  }

  async activateItem(id: number): Promise<AxiosResponse<Item>> {
    return this.api.post(`/items/${id}/activate/`);
  }
}

const apiService = new ApiService();
export default apiService;
export const api = apiService;
