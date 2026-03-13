import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Verify the current request is from an authenticated user.
 * Returns the user or a 401 response.
 */
export async function requireAuth() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, error: null };
}

/**
 * Verify an S3 key belongs to the authenticated user's organization.
 * S3 keys follow: {orgId}/{userId}/{recordingId}.{ext}
 */
export async function verifyS3KeyOwnership(
  s3Key: string,
  userId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!membership) return false;

  // S3 key starts with orgId/ or legacy default-account/
  return (
    s3Key.startsWith(`${membership.organization_id}/`) ||
    s3Key.startsWith("default-account/")
  );
}
