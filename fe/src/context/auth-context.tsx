/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { authService, BackendUser, LoginResponse, GoogleRegisterData, RegisterResponse } from "@/api/auth"; // Import necessary items
import { adminService } from "@/api/admin"; // Keep if adminService is still used for roles
// Define the RoleResponse type if needed for getRole function
// Ensure this matches the actual response structure from adminService.getMyRole
interface RoleResponse {
  role: string; // Or BackendRole if it returns the full role object
  permissions: string[];
}

// Define the shape of the authentication context
interface AuthContextType {
  user: BackendUser | null; // User data from the backend
  token: string | null; // Backend-issued JWT
  loading: boolean; // Indicates if auth state is being determined
  error: string | null; // Stores authentication-related errors
  handleGoogleRegister: (googleData: GoogleRegisterData) => Promise<RegisterResponse>; // New handler for registration
  handleFacebookLogin: (accessToken: string) => Promise<void>; // Function to handle Facebook Login
  handleEmailLogin: (email: string, password: string) => Promise<void>; // Function to handle email/password login
  handleRegister: (userData: { email: string; password: string; name: string }) => Promise<void>; // Function to handle registration
  getToken: () => string | null; // Function to get the current JWT
  getRole: () => Promise<RoleResponse | null>; // Function to get user role/permissions
  logout: () => Promise<void>; // Function to log the user out
}

// Create the authentication context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true, // Start in loading state until initialization check is done
  error: null,
  handleGoogleRegister: async () => { throw new Error("AuthProvider not initialized"); }, // Add default
  handleFacebookLogin: async () => { throw new Error("AuthProvider not initialized"); },
  handleEmailLogin: async () => { throw new Error("AuthProvider not initialized"); },
  handleRegister: async () => { throw new Error("AuthProvider not initialized"); },
  getToken: () => { throw new Error("AuthProvider not initialized"); },
  getRole: async () => { throw new Error("AuthProvider not initialized"); },
  logout: async () => { throw new Error("AuthProvider not initialized"); },
});

// Define props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and actions to the application.
 * Manages user data, JWT token, loading status, and errors.
 * Handles login (Google, Facebook, Email), registration, and logout by interacting with authService.
 * Initializes auth state from local storage on load.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // True until initial token check completes
  const [error, setError] = useState<string | null>(null);

  const setAuthCookie = (tokenValue: string) => {
    const isSecure = window.location.protocol === "https:";
    // Set cookie to expire in 7 days, adjust as needed
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth_token=${tokenValue}; path=/; expires=${expires}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  };

  const removeAuthCookie = () => {
    const isSecure = window.location.protocol === "https:";
    document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  };

  // Effect to check for existing token and fetch user data on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null); // Clear error on init
      const storedToken = authService.utils.getAuthToken(); // This might be from localStorage

      // Also check cookie if localStorage token is not found, or prioritize cookie
      const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];

      const activeToken = storedToken || cookieToken;

      if (activeToken) {
        setToken(activeToken); // Set token state immediately
        if (!storedToken && cookieToken) { // If only cookie token exists, sync to localStorage
            authService.utils.setAuthToken(cookieToken);
        }
        try {
          const currentUser = await authService.getCurrentUser(); // Pass token for verification
          if (currentUser) {
            setUser(currentUser);
          } else {
            setToken(null); // Clear token state if invalid
            authService.utils.removeAuthToken(); // Remove invalid token from storage
            removeAuthCookie(); // Remove invalid token from cookie
          }
        } catch (err) {
          console.error("Initialization error fetching user:", err);
          authService.utils.removeAuthToken();
          removeAuthCookie();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // Initialization finished
    };

    initializeAuth();
  }, []); // Run only once on mount

  // Generic handler for API calls that update auth state (login)
  const handleApiLogin = useCallback(async (apiCall: Promise<LoginResponse>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall;
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        authService.utils.setAuthToken(response.token); // Store token in local storage
        setAuthCookie(response.token); // Store token in cookie
        setLoading(false);
        window.location.reload();
      } else {
        throw new Error("Invalid login response from server (missing user or token).");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An authentication error occurred.";
      console.error("Auth operation failed:", err);
      setError(errorMessage);
      setUser(null);
      setToken(null);
      authService.utils.removeAuthToken();
      removeAuthCookie(); // Clear cookie on failure
      setLoading(false);
      throw err;
    }
  }, []);

  // Handler for Google registration/linking
  const handleGoogleRegister = useCallback(async (googleData: GoogleRegisterData): Promise<RegisterResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.registerWithGoogle(googleData);
      console.log("Google registration/linking successful:", response.message);
      setLoading(false);
      if (response.user) {
        setUser(response.user);
      }
      if (response.token) {
        setToken(response.token);
        authService.utils.setAuthToken(response.token); // Store token in local storage
        setAuthCookie(response.token); // Store token in cookie
      }
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Google registration failed.";
      console.error("Google registration failed:", err);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  // Handler for Facebook login
  const handleFacebookLogin = useCallback(async (accessToken: string) => {
    await handleApiLogin(authService.loginWithFacebook(accessToken));
  }, [handleApiLogin]);

  // Handler for Email/Password login
  const handleEmailLogin = useCallback(async (email: string, password: string) => {
    await handleApiLogin(authService.loginWithEmailPassword(email, password));
  }, [handleApiLogin]);

  // Handler for user registration
  const handleRegister = useCallback(async (userData: { email: string; password: string; name: string }) => {
     setLoading(true);
     setError(null);
     try {
       const response = await authService.register(userData);
       console.log("Registration successful:", response.message);
       setLoading(false);
     } catch (err: any) {
       const errorMessage = err?.message || "Registration failed.";
       console.error("Registration failed:", err);
       setError(errorMessage);
       setLoading(false);
       throw err;
     }
  }, []);

  // Handler for logging out
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
      authService.utils.removeAuthToken();
      removeAuthCookie(); // Clear cookie on logout
    } catch (err: any) {
      const errorMessage = err?.message || "Logout failed.";
      console.error("Logout failed:", err);
      setError(errorMessage);
      setUser(null);
      setToken(null);
      authService.utils.removeAuthToken();
      removeAuthCookie(); // Ensure cookie is cleared even if backend logout fails
    } finally {
      setLoading(false);
      window.location.reload();
    }
  }, []);

  // Function to retrieve the current token from state
  const getToken = useCallback((): string | null => {
    if (token) return token;
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    if (cookieToken) return cookieToken;
    return authService.utils.getAuthToken();
  }, [token]);

  // Function to get user role/permissions using the stored token
  const getRole = useCallback(async (): Promise<RoleResponse | null> => {
    const currentToken = getToken();
    if (!currentToken) {
        return null;
    }
    try {
      const roleInfo = await adminService.getMyRole(currentToken);
      return roleInfo;
    } catch (error: any) {
      console.error("Get user role error:", error);
      setError("Failed to get user role information.");
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        await logout();
      }
      return null;
    }
  }, [getToken, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        handleGoogleRegister,
        handleFacebookLogin,
        handleEmailLogin,
        handleRegister,
        getToken,
        getRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to easily access the authentication context.
 * @returns {AuthContextType} The authentication context values.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};