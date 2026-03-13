import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const BASE_URL = "https://reverbic.ai";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Reverbic — AI Meeting Transcription & Intelligence",
    template: "%s | Reverbic",
  },
  description:
    "AI-powered meeting transcription with 99.2% accuracy. Smart summaries, action items, decision tracking, and meeting coaching. Trusted by teams for meeting intelligence. Start your free trial.",

  keywords: [
    "AI meeting transcription",
    "meeting notes AI",
    "meeting summarizer",
    "meeting intelligence",
    "action item tracker",
    "decision tracking",
    "meeting coach",
    "smart meeting clips",
    "meeting recording",
    "AI notetaker",
    "meeting assistant",
    "Zoom transcription",
    "Google Meet transcription",
    "Teams transcription",
    "Otter alternative",
    "Fireflies alternative",
    "Grain alternative",
    "async meeting tool",
    "meeting productivity",
    "speaker diarization",
    "real-time transcription",
    "meeting analytics",
    "talk-to-listen ratio",
    "filler word detection",
    "meeting recap",
    "AI meeting notes",
    "automatic meeting notes",
    "Reverbic",
  ],

  authors: [{ name: "Reverbic", url: BASE_URL }],
  creator: "Reverbic",
  publisher: "Reverbic",

  applicationName: "Reverbic",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Reverbic",
    title: "Reverbic — Your meetings, remembered.",
    description:
      "AI transcription with 99.2% accuracy. Smart summaries, action items, decision tracking, and meeting coaching. Join 1,000+ teams.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Reverbic — AI Meeting Transcription & Intelligence",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Reverbic — AI Meeting Transcription & Intelligence",
    description:
      "99.2% accurate AI transcription. Smart summaries, action items, decision tracking & meeting coaching. Trusted by teams for meeting intelligence.",
    images: ["/opengraph-image"],
    creator: "@reverbic_ai",
    site: "@reverbic_ai",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },

  category: "technology",

  other: {
    "msapplication-TileColor": "#7C3AED",
  },

  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Reverbic",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "AI-powered meeting transcription with 99.2% accuracy. Smart summaries, action items, decision tracking, and meeting coaching.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free",
      description: "3 hours of transcription per month",
    },
    {
      "@type": "Offer",
      price: "9",
      priceCurrency: "USD",
      name: "Starter",
      description: "30 hours of transcription, AI summaries & action items",
    },
    {
      "@type": "Offer",
      price: "19",
      priceCurrency: "USD",
      name: "Pro",
      description: "Unlimited transcription, AI Coach, Decision Tracker, Smart Clips",
    },
    {
      "@type": "Offer",
      price: "39",
      priceCurrency: "USD",
      name: "Team",
      description: "SSO, admin controls, API access, priority support",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
  },
  featureList: [
    "AI Transcription with 99.2% accuracy",
    "50+ language support",
    "Real-time speaker diarization",
    "Smart meeting summaries",
    "Automatic action item extraction",
    "Decision tracking across meetings",
    "AI Meeting Coach with talk ratio analytics",
    "Smart Clips for async sharing",
    "Team workspace with collaboration",
    "Zoom, Google Meet, and Teams integration",
  ],
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Reverbic",
  url: BASE_URL,
  logo: `${BASE_URL}/icon.svg`,
  sameAs: [
    "https://twitter.com/reverbic_ai",
    "https://linkedin.com/company/reverbic",
    "https://github.com/reverbic",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@reverbic.ai",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How accurate is Reverbic's transcription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reverbic achieves 99.2% transcription accuracy across 50+ languages with real-time speaker diarization and smart punctuation.",
      },
    },
    {
      "@type": "Question",
      name: "What makes Reverbic different from Otter or Fireflies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reverbic offers three unique features: AI Meeting Coach (real-time speaking analytics), Decision Tracker (cross-meeting decision log), and Smart Clips (AI-generated shareable audio moments).",
      },
    },
    {
      "@type": "Question",
      name: "Is Reverbic free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Reverbic offers a free tier with 3 hours of transcription per month, basic summaries, and 1 integration. No credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "What platforms does Reverbic integrate with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reverbic integrates with Zoom, Google Meet, Microsoft Teams, Slack, Notion, Linear, Jira, Asana, HubSpot, and Salesforce.",
      },
    },
    {
      "@type": "Question",
      name: "Can Reverbic transcribe uploaded recordings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can upload any audio or video file and Reverbic will transcribe it with the same 99.2% accuracy, generate summaries, and extract action items.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XDCCC1DMDH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XDCCC1DMDH');
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
