/**
 * Notification store backed by Supabase.
 * All functions are async — use the hook in @/hooks/use-notifications for React components.
 */

import { getSupabaseBrowser } from "@/lib/supabase/client";

export type NotificationType = "success" | "info" | "warning" | "error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meetingId?: string;
  read: boolean;
  createdAt: string;
}

// Map our simple types to DB notification types
function mapTypeToDb(type: NotificationType): string {
  switch (type) {
    case "success": return "transcript_ready";
    case "info": return "upload_complete";
    case "warning": return "silent_recording";
    case "error": return "processing_failed";
    default: return "upload_complete";
  }
}

function mapTypeFromDb(dbType: string): NotificationType {
  switch (dbType) {
    case "transcript_ready":
    case "action_item_completed":
    case "plan_upgraded":
      return "success";
    case "processing_failed":
      return "error";
    case "silent_recording":
    case "usage_warning":
    case "plan_expiring":
      return "warning";
    default:
      return "info";
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    type: mapTypeFromDb(row.type),
    title: row.title,
    message: row.message || "",
    meetingId: row.meeting_id || undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Get all notifications for a user, newest first */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map(rowToNotification);
}

/** Count unread notifications */
export async function getUnreadCount(userId: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)
    .eq("archived", false);

  if (error) return 0;
  return count ?? 0;
}

/** Add a new notification */
export async function addNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  meetingId?: string
): Promise<AppNotification | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: mapTypeToDb(type),
      title,
      message,
      meeting_id: meetingId || null,
    })
    .select()
    .single();

  if (error || !data) return null;

  // Dispatch custom event for real-time UI updates within the same tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reverbic-notification"));
  }

  return rowToNotification(data);
}

/** Mark a single notification as read */
export async function markAsRead(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reverbic-notification"));
  }
}

/** Mark all notifications as read for a user */
export async function markAllAsRead(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reverbic-notification"));
  }
}

/** Archive all notifications for a user */
export async function clearAllNotifications(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  await supabase
    .from("notifications")
    .update({ archived: true })
    .eq("user_id", userId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reverbic-notification"));
  }
}

// ─── Convenience helpers ───

export async function notifyUploadComplete(userId: string, meetingTitle: string, meetingId: string): Promise<void> {
  await addNotification(userId, "info", "Upload Complete", `"${meetingTitle}" uploaded successfully. Processing has started.`, meetingId);
}

export async function notifyTranscriptComplete(userId: string, meetingTitle: string, meetingId: string): Promise<void> {
  await addNotification(userId, "success", "Transcript Ready", `"${meetingTitle}" has been transcribed and summarized.`, meetingId);
}

export async function notifyProcessingFailed(userId: string, meetingTitle: string, meetingId: string, error?: string): Promise<void> {
  await addNotification(userId, "error", "Processing Failed", `"${meetingTitle}" failed to process${error ? `: ${error}` : "."}`, meetingId);
}

export async function notifySilentRecording(userId: string, meetingTitle: string, meetingId: string): Promise<void> {
  await addNotification(userId, "warning", "Silent Recording", `"${meetingTitle}" appears to be mostly silence. Check your microphone.`, meetingId);
}
