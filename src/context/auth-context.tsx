import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "vendor" | "admin";
};

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  const login = async (email: string, _password: string) => {
    // Mock login: infer role from email for demo purposes
    const role: User["role"] = email.includes("admin")
      ? "admin"
      : email.includes("vendor")
      ? "vendor"
      : "user";
    setUser({ id: crypto.randomUUID(), email, role });
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
