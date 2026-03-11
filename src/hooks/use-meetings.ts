"use client";

import { useState, useEffect, useCallback } from "react";
import { getMeetings, getMeeting, type Meeting } from "@/lib/meeting-store";
import { useUser } from "@/components/UserContext";

/** Fetch all meetings for the current user's organization */
export function useMeetings() {
  const { user } = useUser();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.organizationId) {
      setMeetings([]);
      setLoading(false);
      return;
    }
    const data = await getMeetings(user.organizationId);
    setMeetings(data);
    setLoading(false);
  }, [user?.organizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh on window focus
  useEffect(() => {
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { meetings, loading, refresh };
}

/** Fetch a single meeting by ID with full details, auto-polls when processing */
export function useMeeting(id: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getMeeting(id);
    setMeeting(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-poll every 2s while processing
  useEffect(() => {
    if (!meeting || meeting.status !== "processing") return;
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [meeting?.status, refresh]);

  return { meeting, loading, refresh, setMeeting };
}
