"use client";

import { useEffect, useState, useRef } from "react";
import { Crown, Sparkles, X } from "lucide-react";

interface UpgradeCelebrationProps {
  planName: string;
  onClose: () => void;
}

// Confetti particle
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
}

const CONFETTI_COLORS = [
  "#7C3AED", // violet
  "#06B6D4", // cyan
  "#10B981", // emerald
  "#F59E0B", // amber
  "#F43F5E", // rose
  "#A78BFA", // violet-light
  "#22D3EE", // cyan-light
];

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 6 + 4,
        opacity: 1,
      });
    }

    let animationId: number;
    let frame = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    function animate() {
      frame++;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.08; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99; // air resistance

        // Fade out in the last 60 frames
        if (frame > maxFrames - 60) {
          p.opacity = Math.max(0, p.opacity - 0.016);
        }

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx!.restore();
      }

      if (frame < maxFrames) {
        animationId = requestAnimationFrame(animate);
      }
    }

    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "30 hours of transcription per month",
    "AI summaries & action items",
    "3 integrations",
    "5 team members",
  ],
  pro: [
    "Unlimited transcription",
    "Meeting Coach with personalized tips",
    "Smart Clips for async sharing",
    "All integrations",
    "20 team members",
  ],
  team: [
    "Everything in Pro",
    "SSO & admin controls",
    "API access",
    "Unlimited team members",
    "Priority support",
  ],
};

export default function UpgradeCelebration({ planName, onClose }: UpgradeCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const tier = planName.toLowerCase();
  const features = PLAN_FEATURES[tier] ?? PLAN_FEATURES.starter;

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <>
      <ConfettiCanvas />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[61] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[62] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center pointer-events-auto transition-all duration-500 ${
            visible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-6 circle-fill">
            <Crown className="w-8 h-8 text-brand-violet" />
          </div>

          {/* Title */}
          <h2 className="font-heading text-3xl text-foreground mb-2">
            Welcome to {planName}!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your account has been upgraded. Here&apos;s what&apos;s unlocked:
          </p>

          {/* Features list */}
          <div className="text-left space-y-2.5 mb-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 fade-up"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <Sparkles className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            className="w-full bg-brand-violet text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-violet/90 transition-colors"
          >
            Let&apos;s Go
          </button>
        </div>
      </div>
    </>
  );
}
