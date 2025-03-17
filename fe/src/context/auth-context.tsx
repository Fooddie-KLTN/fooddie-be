"use client";
import {
  onAuthStateChanged,
  User,
  UserCredential,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebaseconfig";
import { authService } from "@/api/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  handleAuth: (userCredential: UserCredential) => Promise<void>;
  getToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  handleAuth: async () => {},
  getToken: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser); // Debug log
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      return token;
    } catch (err) {
      console.error("Failed to get token:", err);
      setError("Failed to retrieve authentication token");
      await logout(); // Optionally log out if token retrieval fails
      return null;
    }
  };

  const handleAuth = async (userCredential: UserCredential) => {
    try {
      const authenticatedUser = userCredential.user;
      const token = await getToken();
      if (token) {
        await authService.login(token); 
      }
      setUser(authenticatedUser);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Authentication failed");
      console.error("Authentication error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      const token = await getToken();
      if (token) {
        await authService.logout(token); 
      }

      setUser(null);
      setError(null);
    } catch (err) {
      setError("Logout failed");
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, handleAuth, getToken, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);