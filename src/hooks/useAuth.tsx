import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LOCAL_USER_ID } from "@/lib/local-store";

/**
 * Authentication is temporarily disabled. A fixed local rider identity keeps
 * every screen working while the backend/login flow is off.
 */
export interface LocalUser {
  id: string;
  email: string | null;
}

interface AuthState {
  user: LocalUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const LOCAL_USER: LocalUser = { id: LOCAL_USER_ID, email: null };

const AuthContext = createContext<AuthState>({
  user: LOCAL_USER,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthState>(
    () => ({ user: LOCAL_USER, loading: false, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
