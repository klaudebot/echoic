"use client";

import { useState, useEffect, useCallback } from "react";
import { getMeetings, getMeeting, type Meeting } from "@/lib/meeting-store";
import { useUser } from "@/components/UserContext";
import { useBasePrefix } from "@/components/DemoContext";
import { getDemoMeetingsForStore } from "@/lib/demo-data";

/** Fetch all meetings for the current user's organization */
export function useMeetings() {
  const { user } = useUser();
  const prefix = useBasePrefix();
  const isDemo = prefix === "/demo";
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setMeetings(getDemoMeetingsForStore());
      setLoading(false);
      return;
    }
    if (!user?.organizationId) {
      setMeetings([]);
      setLoading(false);
      return;
    }
    const data = await getMeetings(user.organizationId);
    setMeetings(data);
    setLoading(false);
  }, [user?.organizationId, isDemo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on window focus (not in demo)
  useEffect(() => {
    if (isDemo) return;
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, isDemo]);

  return { meetings, loading, refresh };
}

/** Fetch a single meeting by ID with full details, auto-polls when processing */
export function useMeeting(id: string) {
  const prefix = useBasePrefix();
  const isDemo = prefix === "/demo";
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isDemo) {
      const all = getDemoMeetingsForStore();
      setMeeting(all.find((m) => m.id === id) ?? null);
      setLoading(false);
      return;
    }
    const data = await getMeeting(id);
    setMeeting(data);
    setLoading(false);
  }, [id, isDemo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-poll every 2s while processing (not in demo)
  useEffect(() => {
    if (isDemo) return;
    if (!meeting || meeting.status !== "processing") return;
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [meeting?.status, refresh, isDemo]);

  return { meeting, loading, refresh, setMeeting };
}
