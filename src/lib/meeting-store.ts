// Client-side meeting store using localStorage (no Supabase DB yet)

const STORAGE_KEY = "reverbic_meetings";

export interface TranscriptVersion {
  id: string;
  createdAt: string;
  label: string; // e.g. "Original", "Reprocessed (amplified +18dB)"
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
  // Processing results (current version)
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
  // Version history
  transcriptVersions?: TranscriptVersion[];
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

/** Snapshot current transcript results as a version before reprocessing */
export function snapshotTranscriptVersion(id: string, label: string): void {
  const all = readAll();
  const idx = all.findIndex((m) => m.id === id);
  if (idx < 0) return;
  const m = all[idx];

  // Only snapshot if there's actual transcript data
  if (!m.transcript) return;

  const version: TranscriptVersion = {
    id: `v-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    label,
    audioAnalysis: m.audioAnalysis,
    transcript: m.transcript,
    summary: m.summary,
    keyPoints: m.keyPoints,
    actionItems: m.actionItems,
    decisions: m.decisions,
  };

  const versions = m.transcriptVersions ?? [];
  versions.push(version);
  all[idx] = { ...m, transcriptVersions: versions };
  writeAll(all);
}

/** Restore a previous transcript version by version id */
export function restoreTranscriptVersion(meetingId: string, versionId: string): void {
  const all = readAll();
  const idx = all.findIndex((m) => m.id === meetingId);
  if (idx < 0) return;
  const m = all[idx];
  const version = m.transcriptVersions?.find((v) => v.id === versionId);
  if (!version) return;

  all[idx] = {
    ...m,
    status: "completed",
    audioAnalysis: version.audioAnalysis,
    transcript: version.transcript,
    summary: version.summary,
    keyPoints: version.keyPoints,
    actionItems: version.actionItems,
    decisions: version.decisions,
  };
  writeAll(all);
}
