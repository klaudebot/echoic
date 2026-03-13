import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export async function GET() {
  let iconDataUrl = "";
  try {
    const buf = await readFile(join(process.cwd(), "public", "icon-transparent.png"));
    iconDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch { /* fallback below */ }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1a1040 50%, #0F172A 100%)",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          {/* Logo icon */}
          {iconDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconDataUrl} alt="" width={64} height={64} />
          ) : (
            <div style={{ width: 64, height: 64 }} />
          )}
          <span
            style={{
              fontSize: 72,
              fontFamily: "Georgia, serif",
              color: "white",
              letterSpacing: -2,
            }}
          >
            Reverbic
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "system-ui, sans-serif",
            marginBottom: 32,
          }}
        >
          Your meetings, remembered.
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            "AI Transcription",
            "Smart Summaries",
            "Action Items",
            "Decision Tracking",
            "Meeting Coach",
          ].map((f) => (
            <div
              key={f}
              style={{
                padding: "8px 20px",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 4,
                fontSize: 18,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            fontSize: 20,
            color: "#7C3AED",
            fontFamily: "monospace",
          }}
        >
          reverbic.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
