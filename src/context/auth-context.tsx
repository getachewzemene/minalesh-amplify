'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  avatar_url?: string;
  bio?: string;
  is_vendor: boolean;
  vendor_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  trade_license?: string;
  tin_number?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile with a slight delay to avoid auth state conflicts
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

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
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: userData?.display_name || email,
            first_name: userData?.first_name,
            last_name: userData?.last_name,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      toast.success("Registration successful! Please check your email to verify your account.");
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("An error occurred during registration");
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      setUser(null);
      setSession(null);
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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
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
      const { error } = await supabase
        .from('profiles')
        .update({
          is_vendor: true,
          vendor_status: 'pending',
          trade_license: tradeLicense,
          tin_number: tin,
        })
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
        return false;
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        is_vendor: true,
        vendor_status: 'pending',
        trade_license: tradeLicense,
        tin_number: tin,
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
      const { error } = await supabase
        .from('profiles')
        .update({
          vendor_status: 'approved',
        })
        .eq('id', vendorId);

      if (error) {
        toast.error(error.message);
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
      session,
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