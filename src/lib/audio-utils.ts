/**
 * Audio analysis utilities for processing recorded/uploaded audio.
 */

/**
 * Analyze an audio buffer for silence.
 * Returns true if more than 80% of frames are below the -50 dB threshold.
 */
export function detectSilence(audioBuffer: ArrayBuffer): {
  isSilent: boolean;
  silencePercent: number;
} {
  const view = new Float32Array(audioBuffer);

  if (view.length === 0) {
    return { isSilent: true, silencePercent: 100 };
  }

  // -50 dB threshold in linear amplitude
  const threshold = Math.pow(10, -50 / 20); // ~0.00316

  let silentFrames = 0;

  for (let i = 0; i < view.length; i++) {
    if (Math.abs(view[i]) < threshold) {
      silentFrames++;
    }
  }

  const silencePercent = (silentFrames / view.length) * 100;

  return {
    isSilent: silencePercent > 80,
    silencePercent: Math.round(silencePercent * 100) / 100,
  };
}

/**
 * Basic peak normalization — scales audio so the loudest sample hits 1.0.
 * Returns a new ArrayBuffer with normalized float32 samples.
 */
export function normalizeVolume(audioBuffer: ArrayBuffer): ArrayBuffer {
  const input = new Float32Array(audioBuffer);
  const output = new Float32Array(input.length);

  // Find peak amplitude
  let peak = 0;
  for (let i = 0; i < input.length; i++) {
    const abs = Math.abs(input[i]);
    if (abs > peak) {
      peak = abs;
    }
  }

  // Avoid division by zero; if signal is silent, return as-is
  if (peak === 0) {
    output.set(input);
    return output.buffer;
  }

  const gain = 1.0 / peak;

  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * gain;
  }

  return output.buffer;
}
