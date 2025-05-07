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

  // Effect to check for existing token and fetch user data on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null); // Clear error on init
      const storedToken = authService.utils.getAuthToken();

      if (storedToken) {
        setToken(storedToken); // Set token state immediately
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setToken(null); // Clear token state if invalid
            authService.utils.removeAuthToken(); // Remove invalid token from storage
          }
        } catch (err) {
          console.error("Initialization error fetching user:", err);
          // Clear token if fetching user fails (likely invalid token)
          authService.utils.removeAuthToken();
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
      // Backend JWT is stored within the specific authService call (loginWithGoogle, etc.)
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        authService.utils.setAuthToken(response.token); // Store token in local storage
        setLoading(false);
        // Success: Reload the window or use router navigation
        window.location.reload();
      } else {
        // This case indicates an issue with the backend response structure
        throw new Error("Invalid login response from server (missing user or token).");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An authentication error occurred.";
      console.error("Auth operation failed:", err);
      setError(errorMessage);
      setUser(null); // Clear user/token state on failure
      setToken(null);
      authService.utils.removeAuthToken(); // Ensure token is removed from storage
      setLoading(false);
      throw err; // Re-throw for component-level error handling if needed
    }
  }, []);


  // Handler for Google registration/linking
  const handleGoogleRegister = useCallback(async (googleData: GoogleRegisterData): Promise<RegisterResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.registerWithGoogle(googleData);
      console.log("Google registration/linking successful:", response.message);
      // Registration doesn't log in, so no state change here.
      setLoading(false);
      if (response.user) {
        setUser(response.user);
      }
      if (response.token) {
        setToken(response.token);
        authService.utils.removeAuthToken(); // Ensure token is removed from storage
        authService.utils.setAuthToken(response.token); // Store token in local storage
      }
      return response; // Return response for component-level handling
    } catch (err: any) {
      const errorMessage = err?.message || "Google registration failed.";
      console.error("Google registration failed:", err);
      setError(errorMessage);
      setLoading(false);
      throw err; // Re-throw for component-level handling
    }
  }, []); // No dependencies needed here

  // Handler for Facebook login
  const handleFacebookLogin = useCallback(async (accessToken: string) => {
    // handleApiLogin will handle state updates, error handling, and reload
    await handleApiLogin(authService.loginWithFacebook(accessToken));
  }, [handleApiLogin]);

  // Handler for Email/Password login
  const handleEmailLogin = useCallback(async (email: string, password: string) => {
    // handleApiLogin will handle state updates, error handling, and reload
    await handleApiLogin(authService.loginWithEmailPassword(email, password));
  }, [handleApiLogin]);

  // Handler for user registration
  const handleRegister = useCallback(async (userData: { email: string; password: string; name: string }) => {
     setLoading(true);
     setError(null);
     try {
       const response = await authService.register(userData);
       console.log("Registration successful:", response.message);
       // Registration doesn't log in, so no state change here.
       setLoading(false);
       // Let the component handle success (e.g., show message, switch to login)
     } catch (err: any) {
       const errorMessage = err?.message || "Registration failed.";
       console.error("Registration failed:", err);
       setError(errorMessage);
       setLoading(false);
       throw err; // Re-throw for component-level handling
     }
  }, []);

  // Handler for logging out
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout(); // Calls backend logout
      setUser(null); // Clear user state
      setToken(null); // Clear token state
      authService.utils.removeAuthToken(); // Remove token from local storage
      // Token is removed from local storage within authService.logout
    } catch (err: any) {
      const errorMessage = err?.message || "Logout failed.";
      console.error("Logout failed:", err);
      setError(errorMessage);
      // Clear state even if backend fails, as session is likely broken
      setUser(null);
      setToken(null);
      authService.utils.removeAuthToken(); // Ensure token is removed from storage
    } finally {
      setLoading(false);
      window.location.reload(); // Reload after logout attempt
    }
  }, []);

  // Function to retrieve the current token from state
  const getToken = useCallback((): string | null => {
    return authService.utils.getAuthToken(); // Get token from local storage
  }, []);

  // Function to get user role/permissions using the stored token
  const getRole = useCallback(async (): Promise<RoleResponse | null> => {
    if (!token) {
        // Don't set error here, just return null if not authenticated
        // setError("Cannot get role: User not authenticated.");
        return null;
    }
    try {
      // Pass the backend JWT token to the admin service method
      const roleInfo = await adminService.getMyRole(token);
      return roleInfo;
    } catch (error: any) {
      console.error("Get user role error:", error);
      setError("Failed to get user role information.");
      // If role fetching fails due to auth error, log out
      if ((error as any)?.response?.status === 401 || (error as any)?.response?.status === 403) {
        await logout(); // Logout if token is invalid for fetching roles
      }
      return null;
    }
  }, [token, logout]); // Added logout dependency

  // Provide the context value to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        handleGoogleRegister, // Added
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