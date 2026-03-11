"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppLink, useBasePrefix } from "@/components/DemoContext";
import {
  Mic,
  Square,
  Pause,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";

export default function RecordPage() {
  const prefix = useBasePrefix();
  const isDemo = prefix === "/demo";

  const [status, setStatus] = useState<"idle" | "requesting" | "recording" | "paused" | "uploading" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  // Refs for MediaRecorder and Web Audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  // Demo simulated bars
  const [demoBars, setDemoBars] = useState<number[]>(Array(40).fill(4));

  // Draw real waveform on canvas
  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const barWidth = Math.floor(width / barCount) - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        // Average a chunk of frequencies for each bar
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;
        const barHeight = Math.max(3, (avg / 255) * height * 0.85);

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        ctx.fillStyle = "rgb(124, 58, 237)"; // brand-violet
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Real timer
  useEffect(() => {
    if (status === "recording") {
      startTimeRef.current = Date.now() - pausedElapsedRef.current * 1000;
      timerRef.current = setInterval(() => {
        const now = Date.now();
        setElapsed(Math.floor((now - startTimeRef.current) / 1000));
      }, 200);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (status === "paused") {
        pausedElapsedRef.current = elapsed;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Demo mode: simulate waveform bars
  useEffect(() => {
    if (!isDemo) return;
    if (status === "recording") {
      const interval = setInterval(() => {
        setDemoBars(Array(40).fill(0).map(() => Math.random() * 28 + 4));
      }, 100);
      return () => clearInterval(interval);
    } else if (status === "paused") {
      setDemoBars((prev) => prev.map((b) => b * 0.3));
    } else {
      setDemoBars(Array(40).fill(4));
    }
  }, [status, isDemo]);

  const startRecording = useCallback(async () => {
    setError(null);

    // Demo mode: skip real microphone
    if (isDemo) {
      setStatus("recording");
      setElapsed(0);
      pausedElapsedRef.current = 0;
      return;
    }

    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      // Set up Web Audio API for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second

      setStatus("recording");
      setElapsed(0);
      pausedElapsedRef.current = 0;

      // Start waveform drawing
      drawWaveform();
    } catch (err) {
      setStatus("idle");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone access and try again.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Failed to start recording. Please check your microphone settings.");
      }
    }
  }, [isDemo, drawWaveform]);

  const pauseRecording = useCallback(() => {
    if (isDemo) {
      setStatus("paused");
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    stopWaveform();
    setStatus("paused");
  }, [isDemo, stopWaveform]);

  const resumeRecording = useCallback(() => {
    if (isDemo) {
      setStatus("recording");
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    drawWaveform();
    setStatus("recording");
  }, [isDemo, drawWaveform]);

  const stopRecording = useCallback(async () => {
    stopWaveform();

    // Demo mode: simulate upload
    if (isDemo) {
      setStatus("uploading");
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus("done");
            setRecordingId("demo-recording-id");
            return 100;
          }
          return prev + 5;
        });
      }, 80);
      return;
    }

    // Stop MediaRecorder and collect the blob
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setStatus("done");
      return;
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(b);
      };
      recorder.stop();
    });

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Upload
    setStatus("uploading");
    setUploadProgress(0);

    try {
      const res = await fetch("/api/recordings/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `recording-${Date.now()}.webm`,
          contentType: "audio/webm",
          accountId: "default-account",
          userId: "default-user",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, recordingId: rid } = await res.json();

      // Upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", "audio/webm");
        xhr.send(blob);
      });

      setRecordingId(rid);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("done");
    }
  }, [isDemo, stopWaveform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWaveform();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-brand-rose/5 border border-brand-rose/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-rose">Recording Error</p>
            <p className="text-sm text-brand-rose/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

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
            {status === "requesting" && (
              <span className="text-sm text-muted-foreground">Requesting microphone access...</span>
            )}
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
            {status === "uploading" && (
              <span className="text-sm text-brand-violet font-medium">Uploading recording...</span>
            )}
            {status === "idle" && (
              <span className="text-sm text-muted-foreground">Ready to record</span>
            )}
          </div>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center h-16 mb-6 px-4">
          {isDemo ? (
            /* Demo: render simulated bars */
            <div className="flex items-end justify-center gap-[2px] h-full w-full">
              {demoBars.map((h, i) => (
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
          ) : (
            /* Real: render canvas for Web Audio waveform */
            <canvas
              ref={canvasRef}
              width={400}
              height={64}
              className="w-full h-full max-w-[400px]"
            />
          )}
        </div>

        {/* Upload progress bar */}
        {status === "uploading" && (
          <div className="mb-6 px-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-violet transition-all duration-100"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] mt-1 text-muted-foreground text-center">
              <Upload className="w-3 h-3 inline mr-1" />
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {(status === "idle" || status === "requesting") && (
            <button
              onClick={startRecording}
              disabled={status === "requesting"}
              className="w-16 h-16 rounded-full bg-brand-rose flex items-center justify-center text-white hover:bg-brand-rose/90 transition-colors shadow-lg shadow-brand-rose/20 disabled:opacity-50"
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

      {/* Note-taking area — always visible during recording/paused */}
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
          {recordingId && (
            <p className="text-xs text-muted-foreground mb-2 font-mono">
              Recording ID: {recordingId}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-5">
            Your recording is being transcribed. This usually takes 2-5 minutes.
          </p>
          {notes && (
            <div className="bg-card border border-border rounded-lg p-3 mb-5 text-left max-w-sm mx-auto">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes saved:</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
            </div>
          )}
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
                setError(null);
                setUploadProgress(0);
                setRecordingId(null);
                pausedElapsedRef.current = 0;
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
