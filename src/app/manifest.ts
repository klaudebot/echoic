import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reverbic — AI Meeting Intelligence",
    short_name: "Reverbic",
    description:
      "AI-powered meeting transcription with 99.2% accuracy. Smart summaries, action items, decision tracking, and meeting coaching.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
