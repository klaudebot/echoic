"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface OrgPlan {
  plan: "free" | "starter" | "pro" | "team" | "enterprise";
  planStatus: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
  transcriptionHoursUsed: number;
  transcriptionHoursLimit: number;
  membersLimit: number;
  meetingsPerMonthLimit: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  organizationId: string | null;
  orgPlan?: OrgPlan | null;
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
    let orgPlan: OrgPlan | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabase as any)
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", authUser.id)
        .limit(1)
        .single();
      orgId = membership?.organization_id ?? null;

      // Fetch org plan data
      if (orgId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: org } = await (supabase as any)
          .from("organizations")
          .select("plan, plan_status, transcription_hours_used, transcription_hours_limit, members_limit, meetings_per_month_limit")
          .eq("id", orgId)
          .single();
        if (org) {
          orgPlan = {
            plan: org.plan ?? "free",
            planStatus: org.plan_status ?? "active",
            transcriptionHoursUsed: org.transcription_hours_used ?? 0,
            transcriptionHoursLimit: org.transcription_hours_limit ?? 3,
            membersLimit: org.members_limit ?? 1,
            meetingsPerMonthLimit: org.meetings_per_month_limit ?? 10,
          };
        }
      }
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
      orgPlan,
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;

      if (authUser) {
        // Immediately set user from auth data so AuthGuard unblocks.
        // Don't await the org query — it runs in the background.
        setSupabaseUser(authUser);
        setUserState((prev) => ({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          email: authUser.email || "",
          avatarUrl: authUser.user_metadata?.avatar_url,
          organizationId: prev?.id === authUser.id ? prev.organizationId : null,
        }));
        setLoading(false);

        // Load full profile (org membership) in the background
        loadProfile(authUser);
      } else {
        setSupabaseUser(null);
        setUserState(null);
        setLoading(false);
      }
    });

    // Safety timeout — if onAuthStateChange never fires
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
