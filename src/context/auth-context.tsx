import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: "user" | "vendor" | "admin";
  isVerified?: boolean; // Add verification status for vendors
  tradeLicense?: string;
  tinNumber?: string;
};

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  verifyVendor: (tradeLicense: string, tinNumber: string) => void; // Add function to verify vendors
  requestVendorVerification: (tradeLicense: string, tinNumber: string) => void; // Add function to request verification
  approveVendorVerification: (vendorId: string) => void; // Admin approves vendor by ID
  updateProfile: (data: Partial<User>) => void; // Add function to update profile
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
        isVerified,
        tradeLicense: foundUser.tradeLicense,
        tinNumber: foundUser.tinNumber
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
  
  const verifyVendor = (tradeLicense: string, tinNumber: string) => {
    if (user && user.role === "vendor") {
      const updatedUser = { ...user, isVerified: true, tradeLicense, tinNumber };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      localStorage.setItem(`vendor_verified_${user.id}`, "true");
    }
  };
  
  const requestVendorVerification = (tradeLicense: string, tinNumber: string) => {
    if (user && user.role === "vendor") {
      const updatedUser = { ...user, tradeLicense, tinNumber };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      // In a real app, this would send a request to admin for verification
    }
  };
  
  // Admin-only: approve a vendor by their vendor user ID
  const approveVendorVerification = (vendorId: string) => {
    // Persist verification flag for this vendor
    localStorage.setItem(`vendor_verified_${vendorId}`, "true");
    // If the currently logged-in user is this vendor, mark verified in session too
    if (user && user.id === vendorId) {
      const updatedUser = { ...user, isVerified: true };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    }
  };
  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      
      // Update in users list as well
      const usersRaw = localStorage.getItem("users");
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, ...data } : u
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }
  };

  const value = useMemo(() => ({ user, login, register, logout, verifyVendor, requestVendorVerification, approveVendorVerification, updateProfile }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
