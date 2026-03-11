"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface UserContextValue {
  user: UserProfile | null;
  supabaseUser: User | null;
  loading: boolean;
  setUser: (profile: UserProfile) => void;
  clearUser: () => void;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  supabaseUser: null,
  loading: true,
  setUser: () => {},
  clearUser: () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setSupabaseUser(authUser);
        setUserState({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatarUrl: authUser.user_metadata?.avatar_url,
        });
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setSupabaseUser(authUser);
      if (authUser) {
        setUserState({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatarUrl: authUser.user_metadata?.avatar_url,
        });
      } else {
        setUserState(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUser = useCallback((profile: UserProfile) => {
    setUserState(profile);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    setSupabaseUser(null);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setUserState(null);
    setSupabaseUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, supabaseUser, loading, setUser, clearUser, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
