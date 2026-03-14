import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/auth/signup-with-invite — Create a user with email pre-confirmed.
 * Used when signing up via a team invite link — the user already proved email
 * ownership by clicking the link from their inbox, so we skip confirmation.
 *
 * Body: { email, password, name, inviteToken }
 */
export async function POST(request: Request) {
  const { email, password, name, inviteToken } = await request.json();

  if (!email || !password || !name || !inviteToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Verify the invite token is valid and matches this email
  const { data: invite } = await admin
    .from("team_invites")
    .select("id, email, status, expires_at")
    .eq("token", inviteToken)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
  }

  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "Email does not match the invitation" },
      { status: 400 }
    );
  }

  // Create user with email pre-confirmed
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createError) {
    // Handle duplicate email
    if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 }
      );
    }
    console.error("[signup-with-invite] Create user failed:", createError);
    return NextResponse.json({ error: createError.message || "Failed to create account" }, { status: 500 });
  }

  if (!newUser?.user) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    userId: newUser.user.id,
    email: newUser.user.email,
  });
}
