// Client-side meeting store using localStorage (no Supabase DB yet)

const STORAGE_KEY = "reverbic_meetings";

export interface Meeting {
  id: string;
  title: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  duration: number | null;
  language: string;
  tags: string[];
  notes: string;
  createdAt: string;
  status: "uploading" | "processing" | "completed" | "failed" | "silent";
  errorMessage?: string;
  // Processing results
  audioAnalysis: {
    isSilent: boolean;
    silencePercent: number;
    peakDb: number;
    recommendation: string;
  } | null;
  transcript: {
    text: string;
    language: string;
    duration: number;
    segments: { start: number; end: number; text: string }[];
  } | null;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string; completed?: boolean }[];
  decisions: { text: string; madeBy: string | null }[];
}

function readAll(): Meeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Meeting[];
  } catch {
    return [];
  }
}

function writeAll(meetings: Meeting[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

/** Get all meetings sorted by createdAt descending */
export function getMeetings(): Meeting[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Get a single meeting by id, or null if not found */
export function getMeeting(id: string): Meeting | null {
  return readAll().find((m) => m.id === id) ?? null;
}

/** Save a new meeting (appends to the list) */
export function saveMeeting(meeting: Meeting): void {
  const all = readAll();
  // Replace if exists, otherwise append
  const idx = all.findIndex((m) => m.id === meeting.id);
  if (idx >= 0) {
    all[idx] = meeting;
  } else {
    all.push(meeting);
  }
  writeAll(all);
}

/** Partially update a meeting by id */
export function updateMeeting(id: string, updates: Partial<Meeting>): void {
  const all = readAll();
  const idx = all.findIndex((m) => m.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    writeAll(all);
  }
}

/** Delete a meeting by id */
export function deleteMeeting(id: string): void {
  const all = readAll().filter((m) => m.id !== id);
  writeAll(all);
}
