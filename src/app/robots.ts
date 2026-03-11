import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://reverbic.ai";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/demo/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
