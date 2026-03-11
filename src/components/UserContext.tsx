"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  organizationId: string | null;
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

  const loadProfile = useCallback(async (authUser: User) => {
    const supabase = getSupabaseBrowser();

    // Fetch user's organization membership
    let orgId: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabase as any)
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", authUser.id)
        .limit(1)
        .single();
      orgId = membership?.organization_id ?? null;
    } catch {
      // No org membership yet — user was just created or trigger failed
    }

    setSupabaseUser(authUser);
    setUserState({
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email || "",
      avatarUrl: authUser.user_metadata?.avatar_url,
      organizationId: orgId,
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      try {
        if (authUser) {
          await loadProfile(authUser);
        }
      } catch (e) {
        console.error("[UserContext] loadProfile failed:", e);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      try {
        if (authUser) {
          await loadProfile(authUser);
        } else {
          setSupabaseUser(null);
          setUserState(null);
        }
      } catch (e) {
        console.error("[UserContext] onAuthStateChange failed:", e);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

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
