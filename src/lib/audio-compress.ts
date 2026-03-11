import { Mp3Encoder } from "lamejs";

const COMPRESS_THRESHOLD = 24 * 1024 * 1024; // 24MB
const TARGET_SAMPLE_RATE = 16000;
const TARGET_BITRATE = 64; // kbps

export async function compressAudioFile(
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; compressed: boolean }> {
  // If file is small enough, skip compression
  if (file.size < COMPRESS_THRESHOLD) {
    return { blob: file instanceof Blob ? file : file, compressed: false };
  }

  try {
    // Create AudioContext (with webkit fallback)
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioCtx();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get PCM data - downmix to mono if stereo
    let pcmData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      pcmData = audioBuffer.getChannelData(0);
    } else {
      // Downmix by averaging channels
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      pcmData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        pcmData[i] = (left[i] + right[i]) / 2;
      }
    }

    // Resample to target sample rate if needed
    const sourceSampleRate = audioBuffer.sampleRate;
    let resampled: Float32Array;
    if (sourceSampleRate !== TARGET_SAMPLE_RATE) {
      const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
      const newLength = Math.floor(pcmData.length / ratio);
      resampled = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const low = Math.floor(srcIndex);
        const high = Math.min(low + 1, pcmData.length - 1);
        const frac = srcIndex - low;
        resampled[i] = pcmData[low] * (1 - frac) + pcmData[high] * frac;
      }
    } else {
      resampled = pcmData;
    }

    // Convert Float32 [-1, 1] to Int16
    const samples = new Int16Array(resampled.length);
    for (let i = 0; i < resampled.length; i++) {
      const s = Math.max(-1, Math.min(1, resampled[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Encode to MP3 using lamejs
    const encoder = new Mp3Encoder(1, TARGET_SAMPLE_RATE, TARGET_BITRATE);
    const mp3Chunks: Uint8Array[] = [];
    const CHUNK_SIZE = 1152; // lamejs requirement
    const totalChunks = Math.ceil(samples.length / CHUNK_SIZE);

    for (let i = 0; i < samples.length; i += CHUNK_SIZE) {
      const chunk = samples.subarray(i, i + CHUNK_SIZE);
      const mp3buf = encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf.buffer));
      }
      // Report progress periodically (every 10 chunks)
      if (onProgress && i % (CHUNK_SIZE * 10) === 0) {
        const currentChunk = Math.floor(i / CHUNK_SIZE);
        onProgress(Math.round((currentChunk / totalChunks) * 100));
      }
    }

    // Flush remaining data
    const remaining = encoder.flush();
    if (remaining.length > 0) {
      mp3Chunks.push(new Uint8Array(remaining.buffer));
    }

    if (onProgress) {
      onProgress(100);
    }

    // Close the audio context
    await audioContext.close();

    // Build the MP3 blob
    const mp3Blob = new Blob(mp3Chunks as BlobPart[], { type: "audio/mpeg" });
    return { blob: mp3Blob, compressed: true };
  } catch {
    // If anything fails, return the original file as-is
    // Server-side ffmpeg will handle it as a fallback
    return { blob: file instanceof Blob ? file : file, compressed: false };
  }
}
