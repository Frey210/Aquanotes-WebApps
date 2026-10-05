import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, sessionToken } from "../api/client";
import type { SessionUser } from "../types";

interface AuthValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionToken.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener("aquanotes:unauthorized", onUnauthorized);
    if (!sessionToken.get()) {
      setLoading(false);
      return () => window.removeEventListener("aquanotes:unauthorized", onUnauthorized);
    }
    apiFetch<SessionUser>("/users/session")
      .then(setUser)
      .catch(clearSession)
      .finally(() => setLoading(false));
    return () => window.removeEventListener("aquanotes:unauthorized", onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiFetch<{ access_token: string }>("/users/login-web", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    sessionToken.set(token.access_token);
    try {
      const session = await apiFetch<SessionUser>("/users/session");
      setUser(session);
      return session;
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/users/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
