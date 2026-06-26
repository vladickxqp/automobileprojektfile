import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { DEMO } from "../api/config";
import { clearToken, loadToken, saveToken } from "./store";

const DEMO_USER: AuthUser = { id: "demo-user", email: "demo@cardna.app" };

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Demo mode: start signed in so the preview lands straight in the garage. Sign-out still
    // returns to the (fully styled) sign-in screen.
    if (DEMO) {
      setUser(DEMO_USER);
      setReady(true);
      return;
    }
    void loadToken().then((token) => {
      // No /me endpoint yet (added in a later phase): a stored token means "signed in".
      if (token) setUser({ id: "", email: "" });
      setReady(true);
    });
  }, []);

  const signUp = async (email: string, password: string) => {
    const res = await api.register(email, password);
    await saveToken(res.token);
    setUser(res.user);
  };

  const signIn = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await saveToken(res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
