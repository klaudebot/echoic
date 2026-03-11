/**
 * Client-side notification store backed by localStorage.
 * Notifications are ephemeral app events — uploads, transcription completions, errors, etc.
 */

const STORAGE_KEY = "reverbic_notifications";
const MAX_NOTIFICATIONS = 50;

export type NotificationType = "success" | "info" | "warning" | "error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meetingId?: string; // link to related meeting
  read: boolean;
  createdAt: string;
}

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

function writeAll(notifications: AppNotification[]): void {
  if (typeof window === "undefined") return;
  // Keep only the most recent N
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  // Dispatch custom event so listeners can react
  window.dispatchEvent(new CustomEvent("reverbic-notification"));
}

/** Get all notifications, newest first */
export function getNotifications(): AppNotification[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Count unread notifications */
export function getUnreadCount(): number {
  return readAll().filter((n) => !n.read).length;
}

/** Add a new notification */
export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  meetingId?: string
): AppNotification {
  const notification: AppNotification = {
    id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    meetingId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.unshift(notification);
  writeAll(all);
  return notification;
}

/** Mark a single notification as read */
export function markAsRead(id: string): void {
  const all = readAll();
  const idx = all.findIndex((n) => n.id === id);
  if (idx >= 0) {
    all[idx].read = true;
    writeAll(all);
  }
}

/** Mark all notifications as read */
export function markAllAsRead(): void {
  const all = readAll();
  for (const n of all) n.read = true;
  writeAll(all);
}

/** Clear all notifications */
export function clearAllNotifications(): void {
  writeAll([]);
}

// ─── Convenience helpers for common events ───

export function notifyUploadComplete(meetingTitle: string, meetingId: string): void {
  addNotification("info", "Upload Complete", `"${meetingTitle}" uploaded successfully. Processing has started.`, meetingId);
}

export function notifyTranscriptComplete(meetingTitle: string, meetingId: string): void {
  addNotification("success", "Transcript Ready", `"${meetingTitle}" has been transcribed and summarized.`, meetingId);
}

export function notifyProcessingFailed(meetingTitle: string, meetingId: string, error?: string): void {
  addNotification("error", "Processing Failed", `"${meetingTitle}" failed to process${error ? `: ${error}` : "."}`, meetingId);
}

export function notifySilentRecording(meetingTitle: string, meetingId: string): void {
  addNotification("warning", "Silent Recording", `"${meetingTitle}" appears to be mostly silence. Check your microphone.`, meetingId);
}
