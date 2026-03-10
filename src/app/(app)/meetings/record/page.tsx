"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppLink } from "@/components/DemoContext";
import {
  Mic,
  Square,
  Pause,
  Play,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function RecordPage() {
  const [status, setStatus] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated waveform bars
  const [bars, setBars] = useState<number[]>(Array(40).fill(4));

  useEffect(() => {
    if (status === "recording") {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
        // Randomize waveform
        setBars(Array(40).fill(0).map(() => Math.random() * 28 + 4));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (status === "paused") {
        setBars((prev) => prev.map((b) => b * 0.3));
      }
      if (status === "idle" || status === "done") {
        setBars(Array(40).fill(4));
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const startRecording = useCallback(() => {
    setStatus("recording");
    setElapsed(0);
  }, []);

  const pauseRecording = useCallback(() => {
    setStatus("paused");
  }, []);

  const resumeRecording = useCallback(() => {
    setStatus("recording");
  }, []);

  const stopRecording = useCallback(() => {
    setStatus("done");
  }, []);

  const formatElapsed = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AppLink href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>

      <div>
        <h1 className="font-heading text-3xl text-foreground">Record Meeting</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record audio directly from your browser
        </p>
      </div>

      {/* Recording interface */}
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`text-4xl font-mono font-semibold tracking-wider ${
            status === "recording"
              ? "text-brand-rose"
              : status === "paused"
                ? "text-brand-amber"
                : "text-foreground"
          }`}>
            {formatElapsed(elapsed)}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {status === "recording" && (
              <>
                <span className="w-2 h-2 rounded-full bg-brand-rose animate-pulse" />
                <span className="text-sm text-brand-rose font-medium">Recording</span>
              </>
            )}
            {status === "paused" && (
              <>
                <span className="w-2 h-2 rounded-full bg-brand-amber" />
                <span className="text-sm text-brand-amber font-medium">Paused</span>
              </>
            )}
            {status === "idle" && (
              <span className="text-sm text-muted-foreground">Ready to record</span>
            )}
          </div>
        </div>

        {/* Waveform */}
        <div className="flex items-end justify-center gap-[2px] h-16 mb-6 px-4">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`w-[4px] rounded-full transition-all duration-150 ${
                status === "recording"
                  ? "bg-brand-violet"
                  : status === "paused"
                    ? "bg-brand-amber/40"
                    : "bg-muted"
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {status === "idle" && (
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-brand-rose flex items-center justify-center text-white hover:bg-brand-rose/90 transition-colors shadow-lg shadow-brand-rose/20"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}
          {status === "recording" && (
            <>
              <button
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
              >
                <Pause className="w-5 h-5" />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-brand-rose flex items-center justify-center text-white hover:bg-brand-rose/90 transition-colors shadow-lg shadow-brand-rose/20"
              >
                <Square className="w-6 h-6" />
              </button>
            </>
          )}
          {status === "paused" && (
            <>
              <button
                onClick={resumeRecording}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors"
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-brand-rose flex items-center justify-center text-white hover:bg-brand-rose/90 transition-colors shadow-lg shadow-brand-rose/20"
              >
                <Square className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note-taking area */}
      {(status === "recording" || status === "paused") && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading text-lg text-foreground mb-3">Meeting Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take notes during the recording..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30 resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Notes will be saved alongside the transcript</p>
        </div>
      )}

      {/* Done state */}
      {status === "done" && (
        <div className="bg-brand-emerald/5 border border-brand-emerald/20 rounded-xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-emerald/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-brand-emerald" />
          </div>
          <h3 className="font-heading text-xl text-foreground mb-1">Recording Saved</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Duration: {formatElapsed(elapsed)}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Your recording is being transcribed. This usually takes 2-5 minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <AppLink
              href="/meetings"
              className="px-4 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors"
            >
              View Meetings
            </AppLink>
            <button
              onClick={() => {
                setStatus("idle");
                setElapsed(0);
                setNotes("");
              }}
              className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Record Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
