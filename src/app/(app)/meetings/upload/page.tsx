"use client";

import { useState, useCallback, useRef } from "react";
import { AppLink, useBasePrefix } from "@/components/DemoContext";
import { useUser } from "@/components/UserContext";
import { saveMeeting, type Meeting } from "@/lib/meeting-store";
import { runProcessingPipeline } from "@/lib/process-pipeline";
import { notifyUploadComplete } from "@/lib/notifications";
import { compressAudioFile } from "@/lib/audio-compress";
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
  Link,
  Video,
  Loader2,
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
  const { user } = useUser();

  const [mode, setMode] = useState<"file" | "loom">("file");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [language, setLanguage] = useState("English");
  const [speakerCount, setSpeakerCount] = useState("auto");
  const [tags, setTags] = useState("");
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Loom import state
  const [loomUrl, setLoomUrl] = useState("");
  const [loomImporting, setLoomImporting] = useState(false);
  const [loomStep, setLoomStep] = useState("");

  const isLoomUrl = (url: string) => /^https?:\/\/(www\.)?loom\.com\/share\/[a-f0-9]+/.test(url.trim());

  const startLoomImport = useCallback(async () => {
    const url = loomUrl.trim();
    if (!isLoomUrl(url)) {
      setError("Invalid Loom URL. Expected format: https://www.loom.com/share/...");
      return;
    }
    if (isDemo) {
      setLoomImporting(true);
      setLoomStep("Importing...");
      setTimeout(() => {
        setLoomImporting(false);
        setDone(true);
        setRecordingId("demo-loom-id");
      }, 2000);
      return;
    }

    setError(null);
    setLoomImporting(true);
    setLoomStep("Fetching video from Loom...");

    try {
      const res = await fetch("/api/loom/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import Loom video");
      }

      setLoomStep("Creating meeting record...");

      const { recordingId: rid, s3Key, title, fileSize } = data;
      setRecordingId(rid);

      // Save meeting to store
      const meetingTitle = title || `Loom Recording ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`;
      await saveMeeting({
        id: rid,
        title: meetingTitle,
        originalTitle: meetingTitle,
        s3Key,
        fileName: `loom-${rid}.mp3`,
        fileSize: fileSize || 0,
        duration: data.duration || null,
        language,
        tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        notes: `Imported from Loom: ${url}`,
        createdAt: new Date().toISOString(),
        status: "processing",
        audioAnalysis: null,
        transcript: null,
        summary: null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
      }, user!.organizationId!, user!.id);

      // Notify and start processing
      await notifyUploadComplete(user!.id, meetingTitle, rid);
      runProcessingPipeline(
        rid,
        s3Key,
        meetingTitle,
        user!.id,
        language.toLowerCase().slice(0, 2),
      );

      setLoomImporting(false);
      setDone(true);
    } catch (err) {
      setLoomImporting(false);
      setLoomStep("");
      setError(err instanceof Error ? err.message : "Loom import failed");
    }
  }, [loomUrl, isDemo, language, tags, user]);

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
    setError(null);

    try {
      // Step 1: Compress large files client-side
      let uploadBlob: Blob = file;
      let contentType = file.type || "audio/webm";
      let uploadFileSize = file.size;

      if (file.size >= 24 * 1024 * 1024) {
        setCompressing(true);
        setCompressProgress(0);
        const result = await compressAudioFile(file, (pct) => {
          setCompressProgress(pct);
        });
        setCompressing(false);
        if (result.compressed) {
          uploadBlob = result.blob;
          contentType = "audio/mpeg";
          uploadFileSize = result.blob.size;
        }
      }

      // Step 2: Get presigned URL
      setUploading(true);
      setProgress(0);

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

      // Step 3: Upload directly to S3 with progress tracking
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
        xhr.send(uploadBlob);
      });

      setRecordingId(rid);
      setUploading(false);
      setDone(true);

      // Save meeting to local store with processing status
      const dateTimeTitle = `Recording ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`;
      await saveMeeting({
        id: rid,
        title: dateTimeTitle,
        originalTitle: dateTimeTitle,
        s3Key: `default-account/default-user/${rid}.${file.name.split('.').pop()}`,
        fileName: file.name,
        fileSize: uploadFileSize,
        duration: null,
        language,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        notes: '',
        createdAt: new Date().toISOString(),
        status: 'processing',
        audioAnalysis: null,
        transcript: null,
        summary: null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
      }, user!.organizationId!, user!.id);

      // Notify upload complete
      await notifyUploadComplete(user!.id, dateTimeTitle, rid);

      // Trigger staged processing pipeline (fire and forget)
      runProcessingPipeline(
        rid,
        `default-account/default-user/${rid}.${file.name.split('.').pop()}`,
        dateTimeTitle,
        user!.id,
        language.toLowerCase().slice(0, 2),
      );
    } catch (err) {
      setCompressing(false);
      setUploading(false);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [file, isDemo, language, tags]);

  const resetAll = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setFile(null);
    setProgress(0);
    setCompressing(false);
    setCompressProgress(0);
    setDone(false);
    setUploading(false);
    setError(null);
    setRecordingId(null);
    setLoomUrl("");
    setLoomImporting(false);
    setLoomStep("");
  };

  const removeFile = resetAll;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AppLink href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>

      <div>
        <h1 className="font-heading text-3xl text-foreground">Upload Recording</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a file or import from a Loom link
        </p>
      </div>

      {/* Tab switcher */}
      {!done && !uploading && !compressing && !loomImporting && (
        <div className="flex items-center bg-muted rounded-xl p-1">
          <button
            onClick={() => { setMode("file"); setError(null); }}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              mode === "file"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => { setMode("loom"); setError(null); }}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              mode === "loom"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="w-4 h-4" />
            Import Loom
          </button>
        </div>
      )}

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

      {/* Loom import */}
      {mode === "loom" && !done && (
        <>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Link className="w-4 h-4 text-brand-violet" />
              <h3 className="text-sm font-semibold text-foreground">Paste Loom Link</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Paste a public Loom share link and we&apos;ll extract the audio, transcribe it, and generate insights.
            </p>
            <input
              type="url"
              value={loomUrl}
              onChange={(e) => { setLoomUrl(e.target.value); setError(null); }}
              placeholder="https://www.loom.com/share/73cb6e11a519404..."
              disabled={loomImporting}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30 disabled:opacity-50"
            />
            {loomImporting && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-brand-violet" />
                <span>{loomStep}</span>
              </div>
            )}
          </div>

          {/* Loom options */}
          {!loomImporting && loomUrl && (
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
                  <Tag className="w-4 h-4 text-muted-foreground" /> Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. loom, product-review, walkthrough"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Separate tags with commas</p>
              </div>
            </div>
          )}

          {/* Loom import button */}
          {!loomImporting && loomUrl && isLoomUrl(loomUrl) && (
            <button
              onClick={startLoomImport}
              className="w-full py-3 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              Import & Transcribe
            </button>
          )}
        </>
      )}

      {/* Drop zone */}
      {mode === "file" && (
        <>
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
                  {(compressing || uploading || done) && (
                    <div className="mt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-100 ${
                            done ? "bg-brand-emerald" : compressing ? "bg-brand-amber" : "bg-brand-violet"
                          }`}
                          style={{ width: `${compressing ? compressProgress : progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-1 text-muted-foreground">
                        {done ? (
                          <span className="text-brand-emerald font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Upload complete — processing transcript...
                          </span>
                        ) : compressing ? (
                          `Compressing audio... ${compressProgress}%`
                        ) : (
                          `Uploading... ${progress}%`
                        )}
                      </p>
                    </div>
                  )}
                </div>
                {!compressing && !uploading && !done && (
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
          {file && !done && !uploading && !compressing && (
            <button
              onClick={startUpload}
              className="w-full py-3 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
            >
              Upload & Transcribe
            </button>
          )}
        </>
      )}

      {done && (
        <div className="bg-brand-emerald/5 border border-brand-emerald/20 rounded-xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-emerald/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-brand-emerald" />
          </div>
          <h3 className="font-heading text-lg text-foreground mb-1">
            {mode === "loom" ? "Import Complete" : "Upload Complete"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your recording is being processed. You can track progress on the{" "}
            {recordingId ? (
              <AppLink href={`/meetings/${recordingId}`} className="text-brand-violet hover:underline">
                meeting detail page
              </AppLink>
            ) : (
              <AppLink href="/meetings" className="text-brand-violet hover:underline">
                meetings page
              </AppLink>
            )}
            .
          </p>
          {recordingId && (
            <p className="text-xs text-muted-foreground mb-3 font-mono">
              Recording ID: {recordingId}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            {recordingId && (
              <AppLink
                href={`/meetings/${recordingId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors"
              >
                View Meeting
              </AppLink>
            )}
            <AppLink
              href="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              View Meetings
            </AppLink>
            <button
              onClick={resetAll}
              className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              {mode === "loom" ? "Import Another" : "Upload Another"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
