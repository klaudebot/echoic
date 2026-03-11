/**
 * Auth helper functions for Supabase authentication.
 * Used by sign-in, sign-up, and password reset flows.
 */

import { getSupabaseBrowser } from "./client";

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithOAuth(provider: "google" | "apple") {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

export async function getSession() {
  const supabase = getSupabaseBrowser();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const supabase = getSupabaseBrowser();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Get the current user's profile from the profiles table.
 */
export async function getProfile() {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, error: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile, error };
}

/**
 * Get the current user's primary organization.
 */
export async function getUserOrganization() {
  const supabase = getSupabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { organization: null, membership: null, error: null };

  const { data: membership, error: memError } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (memError) return { organization: null, membership: null, error: memError };

  return {
    organization: (membership as Record<string, unknown>)?.organizations as Database["public"]["Tables"]["organizations"]["Row"] | null,
    membership,
    error: null,
  };
}

// Re-export type for convenience
import type { Database } from "./types";
