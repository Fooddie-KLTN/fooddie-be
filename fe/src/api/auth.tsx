/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiRequest } from "./base-api";

// --- Local Storage Utilities ---
export const AUTH_TOKEN_KEY = 'authToken';

/**
 * Stores the JWT token in local storage.
 * @param {string} token - The JWT token to store.
 */
const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Also set a cookie for middleware access
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    } catch (error) {
      console.error("Error saving auth token to local storage:", error);
    }
  }
};

/**
 * Retrieves the JWT token from local storage.
 * @returns {string | null} The stored JWT token or null if not found or not in a browser environment.
 */
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
};

/**
 * Removes the JWT token from local storage.
 */
const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Also remove from cookies
    document.cookie = 'auth_token=; path=/; max-age=0';
  }
};
// --- End Local Storage Utilities ---

/**
 * Represents the structure of the Role object from the backend.
 */
interface BackendRole {
  id: number;
  name: string;
}

/**
 * Represents the user data structure returned from the backend API.
 * Aligns with the structure in `auth.service.ts` responses.
 */
export interface BackendUser {
  id: string; // Matches User entity
  username: string; // Added from User entity
  email: string; // Matches User entity
  name: string; // Matches User entity
  role: BackendRole; // Matches User entity (ensure BackendRole matches Role)
  address?: string; // Added from User entity (optional)
  phone?: string; // Added from User entity (optional)
  avatar?: string; // Added from User entity (optional)
  isActive: boolean; // Added from User entity
  birthday?: string | Date; // Added from User entity (use string if backend sends ISO string)
  learningtime: number; // Added from User entity
  coursenumber: number; // Added from User entity
  createdAt: string | Date; // Added from User entity (use string if backend sends ISO string)
  lastLoginAt?: string | Date; // Added from User entity (optional, use string if backend sends ISO string)
  // permissions: string[]; // Remove this if permissions are derived from role on backend
}

/**
 * Represents the successful login response structure from the backend.
 * Includes the user object and the backend-issued JWT token.
 */
export interface LoginResponse {
  user: BackendUser;
  token: string; // Backend JWT token
  message: string;
  isNewUser?: boolean; // Optional flag from Google/Facebook login
}

/**
 * Represents the successful registration response structure from the backend.
 */
export interface RegisterResponse {
    user: BackendUser; // User details upon successful registration
    message: string;
}

/**
 * Represents the logout response structure from the backend.
 */
export interface LogoutResponse {
    message: string;
    success: boolean;
}

/**
 * Data required for registering/linking a user via Google.
 * Matches the backend's GoogleRegisterDto.
 */
export interface GoogleRegisterData {
  googleId: string;
  email: string;
  name: string;
  accessToken: string;
}

/**
 * Authentication service interacting with the NestJS backend API.
 */
export const authService = {


  /**
   * Registers or links a user using Google credentials.
   * Sends necessary user info extracted from Google tokens to the backend.
   * @param {GoogleRegisterData} googleData - Data extracted from Google tokens.
   * @returns {Promise<RegisterResponse>} Response containing user data and message.
   * @throws {Error} If registration/linking fails on the backend.
   */
  async registerWithGoogle(googleData: GoogleRegisterData): Promise<LoginResponse> {
    try {
      const response = await apiRequest<LoginResponse>('/auth/register/google', 'POST', { data: googleData });
      return response;
    } catch (error) {
      console.error("Google registration API error:", error);
      throw error; // Re-throw for handling in the context/component
    }
  },

  /**
   * Logs in a user using a Facebook Access Token.
   * Sends the token to the backend for verification and session creation.
   * @param {string} accessToken - The Access Token obtained from Facebook Login.
   * @returns {Promise<LoginResponse>} Response containing user data and backend JWT.
   * @throws {Error} If login fails on the backend.
   */
  async loginWithFacebook(accessToken: string): Promise<LoginResponse> {
    try {
      const response = await apiRequest<LoginResponse>('/auth/login/facebook', 'POST', { data: { accessToken } });
      if (response.token) {
        setAuthToken(response.token); // Store the backend-issued JWT
      } else {
        console.warn("Backend did not return a JWT token on Facebook login.");
        throw new Error("Login successful, but no session token received from server.");
      }
      return response;
    } catch (error) {
      console.error("Facebook login API error:", error);
      removeAuthToken(); // Ensure token is cleared on failure
      throw error; // Re-throw for handling in the context/component
    }
  },

  /**
   * Logs in a user using email and password.
   * @param {string} email - User's email address.
   * @param {string} password - User's password.
   * @returns {Promise<LoginResponse>} Response containing user data and backend JWT.
   * @throws {Error} If login fails (invalid credentials, server error).
   */
  async loginWithEmailPassword(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiRequest<LoginResponse>('/auth/login/email', 'POST', { data: { email, password } });
      if (response.token) {
        setAuthToken(response.token); // Store the backend JWT
      } else {
         console.warn("Backend did not return a JWT token on email login.");
         throw new Error("Login successful, but no session token received from server.");
      }
      return response;
    } catch (error) {
      console.error("Email login API error:", error);
      removeAuthToken();
      throw error;
    }
  },

  /**
   * Logs out the currently authenticated user.
   * Sends the stored backend JWT to the logout endpoint.
   * @returns {Promise<LogoutResponse>} Backend confirmation of logout.
   * @throws {Error} If logout fails or no token is found.
   */
  async logout(): Promise<LogoutResponse> {
    const token = getAuthToken(); // Get the backend JWT
    if (!token) {
      console.warn("Logout called but no auth token found in local storage.");
      return { message: "No active session found.", success: true };
    }
    try {
      const response = await apiRequest<LogoutResponse>('/auth/logout', 'POST', { token: token });
      removeAuthToken(); // Clear token on successful backend logout
      return response;
    } catch (error) {
      console.error("Logout API error:", error);
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
          removeAuthToken();
      }
      throw error;
    }
  },

  /**
   * Registers a new user with email, password, and name.
   * @param {object} userData - User registration details.
   * @param {string} userData.email - User's email.
   * @param {string} userData.password - User's chosen password.
   * @param {string} userData.name - User's name.
   * @returns {Promise<RegisterResponse>} Backend confirmation and user data.
   * @throws {Error} If registration fails (e.g., email exists, validation error).
   */
  async register(userData: { email: string; password: string; name: string }): Promise<RegisterResponse> {
    try {
      return await apiRequest<RegisterResponse>('/auth/register', 'POST', { data: userData });
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },

   /**
   * Fetches the current user's profile data using the stored JWT.
   * Requires a backend endpoint (e.g., /users/me or /auth/profile) protected by the JWT AuthGuard.
   * @returns {Promise<BackendUser | null>} User data if token is valid, null otherwise.
   */
  async getCurrentUser(): Promise<BackendUser | null> {
    const token = getAuthToken();
    if (!token) {
      return null; // No token, no user
    }

    try {
      const userProfile = await apiRequest<BackendUser>('/users/me', 'GET', { token: token });
      return userProfile;
    } catch (error) {
      console.error("Failed to get current user:", error);
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        removeAuthToken();
      }
      return null; // Return null if fetching user fails
    }
  },

  /**
   * Sends a password reset request for the given email.
   * @param {string} email - The user's email address.
   * @returns {Promise<any>} The response from the backend.
   * @throws {Error} If the request fails.
   */
  async forgetPassword(email: string): Promise<any> {
      try {
          return await apiRequest<any>('/auth/forgot-password', 'POST', { data: { email } });
      } catch (error) {
          console.error('Forget password API error:', error);
          throw error; // Re-throw for handling in the component
      }
  },


  // Expose utility functions for direct use if needed (e.g., in context initialization)
  utils: {
    setAuthToken,
    getAuthToken,
    removeAuthToken,
  }
};