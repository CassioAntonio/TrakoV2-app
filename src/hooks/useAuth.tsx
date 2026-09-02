import { createContext, useContext, type ReactNode } from "react";
import { LOCAL_USER_ID } from "@/lib/local-store";

/**
 * Authentication is temporarily disabled. The app runs with a single local
 * rider identity so every screen keeps working without a login flow.
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

const localUser: LocalUser = { id: LOCAL_USER_ID, email: null };

const AuthContext = createContext<AuthState>({
  user: localUser,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: localUser, loading: false, signOut: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
