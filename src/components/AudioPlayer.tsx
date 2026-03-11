"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AudioPlayerProps {
  meetingId: string;
  s3Key: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekToTime?: number | null;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  meetingId,
  s3Key,
  onTimeUpdate,
  seekToTime,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Fetch presigned URL
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/recordings/${meetingId}?key=${encodeURIComponent(s3Key)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load audio (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAudioUrl(data.downloadUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, s3Key]);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration);
    };

    const onError = () => {
      setError("Failed to load audio file. The URL may have expired.");
      setIsPlaying(false);
    };

    const onProgress = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("progress", onProgress);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("progress", onProgress);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Animation frame loop for smooth time updates
  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (audio && !isDraggingProgress) {
        setCurrentTime(audio.currentTime);
        onTimeUpdate?.(audio.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isDraggingProgress, onTimeUpdate]);

  // Handle external seek (from transcript timestamp clicks)
  useEffect(() => {
    if (seekToTime != null && audioRef.current) {
      audioRef.current.currentTime = seekToTime;
      setCurrentTime(seekToTime);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekToTime]);

  // Play / Pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {
        setError("Unable to play audio. Please try again.");
      });
    }
  }, [isPlaying]);

  // Volume
  const handleVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
    }
  }, [isMuted]);

  // Playback speed
  const cycleSpeed = useCallback(() => {
    setShowSpeedMenu((prev) => !prev);
  }, []);

  const selectSpeed = useCallback((speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, []);

  // Progress bar seek
  const handleProgressSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      const bar = progressRef.current;
      if (!bar || !audioRef.current || !duration) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = x / rect.width;
      const newTime = ratio * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Progress drag handlers
  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDraggingProgress(true);
      handleProgressSeek(e);

      const onMouseMove = (ev: MouseEvent) => handleProgressSeek(ev);
      const onMouseUp = () => {
        setIsDraggingProgress(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [handleProgressSeek]
  );

  // Volume bar drag handlers
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const handleVolumeDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      const bar = volumeBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      handleVolumeChange(x / rect.width);
    },
    [handleVolumeChange]
  );

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDraggingVolume(true);
      handleVolumeDrag(e);

      const onMouseMove = (ev: MouseEvent) => handleVolumeDrag(ev);
      const onMouseUp = () => {
        setIsDraggingVolume(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [handleVolumeDrag]
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Loading state
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-violet/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-brand-violet animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Loading audio...</p>
            <p className="text-xs text-muted-foreground">Preparing playback</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card border border-brand-rose/20 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-brand-rose" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Audio unavailable</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Top row: Play button + time + controls */}
      <div className="flex items-center gap-4">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-brand-violet text-white flex items-center justify-center hover:bg-brand-violet/90 transition-all active:scale-95 shadow-sm shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Time display */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
          <span className="text-foreground font-medium">{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Speed control */}
        <div className="relative">
          <button
            onClick={cycleSpeed}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              playbackRate !== 1
                ? "bg-brand-violet/10 text-brand-violet"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Playback speed"
          >
            {playbackRate}x
          </button>
          {showSpeedMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSpeedMenu(false)}
              />
              <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[80px]">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => selectSpeed(speed)}
                    className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      playbackRate === speed
                        ? "bg-brand-violet/10 text-brand-violet font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
          <div
            ref={volumeBarRef}
            className="w-20 h-1.5 bg-muted rounded-full cursor-pointer relative group"
            onMouseDown={handleVolumeMouseDown}
          >
            <div
              className="absolute left-0 top-0 h-full bg-brand-violet/60 rounded-full transition-all"
              style={{ width: `${volumePercent}%` }}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-violet rounded-full shadow-sm transition-opacity ${
                isDraggingVolume ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{ left: `calc(${volumePercent}% - 6px)` }}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="w-full h-2 bg-muted rounded-full cursor-pointer relative group"
        onMouseDown={handleProgressMouseDown}
      >
        {/* Buffered */}
        <div
          className="absolute left-0 top-0 h-full bg-muted-foreground/15 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Progress */}
        <div
          className="absolute left-0 top-0 h-full bg-brand-violet rounded-full transition-[width] duration-75"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-brand-violet rounded-full shadow-md border-2 border-white transition-opacity ${
            isDraggingProgress ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{ left: `calc(${progressPercent}% - 7px)` }}
        />
      </div>
    </div>
  );
}
