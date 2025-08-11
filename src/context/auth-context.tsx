import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: "user" | "vendor" | "admin";
  isVerified?: boolean; // Add verification status for vendors
};

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  verifyVendor: () => void; // Add function to verify vendors
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

  const login = async (email: string, password: string) => {
    // Get users from localStorage
    const usersRaw = localStorage.getItem("users");
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    // Find user
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      // Infer role from email for demo purposes
      const role: User["role"] = email.includes("admin")
        ? "admin"
        : email.includes("vendor")
        ? "vendor"
        : "user";
      
      // Check if vendor is verified
      const isVerified = role === "vendor" ? (localStorage.getItem(`vendor_verified_${foundUser.id}`) === "true") : undefined;
      
      const loggedInUser = { 
        id: foundUser.id, 
        email: foundUser.email, 
        name: foundUser.name,
        phone: foundUser.phone,
        role,
        isVerified
      };
      
      setUser(loggedInUser);
      return true;
    }
    
    return false;
  };

  const register = async (email: string, password: string, name?: string, phone?: string) => {
    // Get existing users
    const usersRaw = localStorage.getItem("users");
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    // Check if user already exists
    if (users.some((u: any) => u.email === email)) {
      return false;
    }
    
    // Create new user
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password, // In a real app, this would be hashed
      name: name || email.split("@")[0],
      phone: phone || ""
    };
    
    // Save user
    const updatedUsers = [...users, newUser];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    
    // Infer role from email for demo purposes
    const role: User["role"] = email.includes("admin")
      ? "admin"
      : email.includes("vendor")
      ? "vendor"
      : "user";
    
    const registeredUser = { 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name,
      phone: newUser.phone,
      role 
    };
    
    setUser(registeredUser);
    return true;
  };

  const logout = () => setUser(null);
  
  const verifyVendor = () => {
    if (user && user.role === "vendor") {
      const updatedUser = { ...user, isVerified: true };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      localStorage.setItem(`vendor_verified_${user.id}`, "true");
    }
  };

  const value = useMemo(() => ({ user, login, register, logout, verifyVendor }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
