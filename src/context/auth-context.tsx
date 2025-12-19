'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
  bio?: string;
  isVendor: boolean;
  isAdmin?: boolean;
  vendorStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  tradeLicense?: string;
  tinNumber?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  requestVendorVerification: (tradeL: string, tin: string) => Promise<boolean>;
  approveVendorVerification: (vendorId: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and fetch user
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ id: data.id, email: data.email });
        setProfile(data.profile);
      } else {
        // Invalid token, clear it
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        return false;
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      
      // Update state
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.user.profile);

      toast.success("Logged in successfully!");
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error("An error occurred during login");
      return false;
    }
  };

  const register = async (email: string, password: string, userData?: Partial<UserProfile>): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName: userData?.displayName || email,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        return false;
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      
      // Update state
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.user.profile);

      toast.success("Registration successful!");
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An error occurred during registration");
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear server cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear token
      localStorage.removeItem('auth_token');
      
      // Clear state
      setUser(null);
      setProfile(null);
      
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("An error occurred during logout");
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Update failed');
        return false;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error("An error occurred while updating profile");
      return false;
    }
  };

  const requestVendorVerification = async (tradeLicense: string, tin: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isVendor: true,
          vendorStatus: 'pending',
          tradeLicense,
          tinNumber: tin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Request failed');
        return false;
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        isVendor: true,
        vendorStatus: 'pending',
        tradeLicense,
        tinNumber: tin,
      } : null);

      toast.success("Vendor verification request submitted!");
      return true;
    } catch (error) {
      console.error('Vendor verification error:', error);
      toast.error("An error occurred while requesting vendor verification");
      return false;
    }
  };

  const approveVendorVerification = async (vendorId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/profile/${vendorId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Approval failed');
        return false;
      }

      toast.success("Vendor verification approved!");
      return true;
    } catch (error) {
      console.error('Vendor approval error:', error);
      toast.error("An error occurred while approving vendor verification");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      login,
      register,
      logout,
      updateProfile,
      requestVendorVerification,
      approveVendorVerification,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}