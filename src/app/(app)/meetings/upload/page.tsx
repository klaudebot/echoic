"use client";

import { useState, useCallback, useRef } from "react";
import { AppLink, useBasePrefix } from "@/components/DemoContext";
import {
  Upload,
  FileAudio,
  FileVideo,
  X,
  Check,
  ArrowLeft,
  Languages,
  Users,
  Tag,
  AlertCircle,
} from "lucide-react";

const supportedFormats = [
  { ext: ".mp3", label: "MP3 Audio" },
  { ext: ".wav", label: "WAV Audio" },
  { ext: ".m4a", label: "M4A Audio" },
  { ext: ".ogg", label: "OGG Audio" },
  { ext: ".mp4", label: "MP4 Video" },
  { ext: ".webm", label: "WebM Video" },
];

const ACCEPTED_TYPES = new Set([
  "audio/webm",
  "video/webm",
  "video/mp4",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "video/ogg",
]);

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const languages = [
  "English", "Spanish", "French", "German", "Portuguese", "Japanese", "Korean", "Chinese (Mandarin)",
];

export default function UploadPage() {
  const prefix = useBasePrefix();
  const isDemo = prefix === "/demo";

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [language, setLanguage] = useState("English");
  const [speakerCount, setSpeakerCount] = useState("auto");
  const [tags, setTags] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / 1_000_000).toFixed(1)} MB). Maximum is 500 MB.`;
    }
    if (!ACCEPTED_TYPES.has(f.type) && !f.name.match(/\.(mp3|wav|m4a|ogg|mp4|webm)$/i)) {
      return "Unsupported file type. Please upload an audio or video file.";
    }
    return null;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setError(null);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(droppedFile);
    }
  }, [validateFile]);

  const handleFileSelect = useCallback(() => {
    setError(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*,.mp3,.wav,.m4a,.ogg,.mp4,.webm";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const selectedFile = target.files?.[0];
      if (selectedFile) {
        const validationError = validateFile(selectedFile);
        if (validationError) {
          setError(validationError);
          return;
        }
        setFile(selectedFile);
      }
    };
    input.click();
  }, [validateFile]);

  const startUpload = useCallback(async () => {
    if (!file) return;

    // Demo mode: simulate upload
    if (isDemo) {
      setUploading(true);
      setProgress(0);
      setError(null);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploading(false);
            setDone(true);
            setRecordingId("demo-recording-id");
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      return;
    }

    // Real upload flow
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned URL
      const contentType = file.type || "audio/webm";
      const res = await fetch("/api/recordings/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType,
          accountId: "default-account",
          userId: "default-user",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, recordingId: rid } = await res.json();

      // Step 2: Upload directly to S3 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
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
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(file);
      });

      setRecordingId(rid);
      setUploading(false);
      setDone(true);
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [file, isDemo]);

  const removeFile = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setFile(null);
    setProgress(0);
    setDone(false);
    setUploading(false);
    setError(null);
    setRecordingId(null);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AppLink href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>

      <div>
        <h1 className="font-heading text-3xl text-foreground">Upload Recording</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload an audio or video file to transcribe and analyze
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-brand-rose/5 border border-brand-rose/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-rose">Upload Error</p>
            <p className="text-sm text-brand-rose/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={!file ? handleFileSelect : undefined}
        className={`bg-card border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-brand-violet bg-brand-violet/5"
            : file
              ? "border-border cursor-default"
              : "border-border hover:border-brand-violet/40 hover:bg-muted/30"
        }`}
      >
        {!file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-violet/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-brand-violet" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag & drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max file size: 500MB
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-violet/10 flex items-center justify-center shrink-0">
              {file.type.startsWith("video") ? (
                <FileVideo className="w-5 h-5 text-brand-violet" />
              ) : (
                <FileAudio className="w-5 h-5 text-brand-violet" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1_000_000).toFixed(1)} MB
              </p>
              {(uploading || done) && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-100 ${
                        done ? "bg-brand-emerald" : "bg-brand-violet"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] mt-1 text-muted-foreground">
                    {done ? (
                      <span className="text-brand-emerald font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Upload complete — processing transcript...
                      </span>
                    ) : (
                      `Uploading... ${progress}%`
                    )}
                  </p>
                </div>
              )}
            </div>
            {!uploading && !done && (
              <button onClick={removeFile} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Supported formats */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Supported Formats</h3>
        <div className="flex flex-wrap gap-2">
          {supportedFormats.map((f) => (
            <span key={f.ext} className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-mono">
              {f.ext}
            </span>
          ))}
        </div>
      </div>

      {/* Options */}
      {file && !done && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-heading text-lg text-foreground">Options</h3>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
              <Languages className="w-4 h-4 text-muted-foreground" /> Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
              <Users className="w-4 h-4 text-muted-foreground" /> Number of Speakers
            </label>
            <select
              value={speakerCount}
              onChange={(e) => setSpeakerCount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            >
              <option value="auto">Auto-detect</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n} speaker{n !== 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
              <Tag className="w-4 h-4 text-muted-foreground" /> Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. standup, engineering, weekly"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Separate tags with commas</p>
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && !done && !uploading && (
        <button
          onClick={startUpload}
          className="w-full py-3 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
        >
          Upload & Transcribe
        </button>
      )}

      {done && (
        <div className="bg-brand-emerald/5 border border-brand-emerald/20 rounded-xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-emerald/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-brand-emerald" />
          </div>
          <h3 className="font-heading text-lg text-foreground mb-1">Upload Complete</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your recording is being transcribed. This usually takes 2-5 minutes.
          </p>
          {recordingId && (
            <p className="text-xs text-muted-foreground mb-3 font-mono">
              Recording ID: {recordingId}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <AppLink
              href="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors"
            >
              View Meetings
            </AppLink>
            <button
              onClick={removeFile}
              className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
