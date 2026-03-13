"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before animation starts after becoming visible */
  delay?: number;
  /** Animation variant */
  variant?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale";
  /** Whether to stagger children instead of animating the container */
  stagger?: boolean;
  /** Stagger delay between children in ms */
  staggerDelay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variant = "fade-up",
  stagger = false,
  staggerDelay = 80,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if reduced motion is preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseStyles: Record<string, { hidden: string; visible: string }> = {
    "fade-up": {
      hidden: "opacity-0 translate-y-6",
      visible: "opacity-100 translate-y-0",
    },
    "fade-in": {
      hidden: "opacity-0",
      visible: "opacity-100",
    },
    "slide-left": {
      hidden: "opacity-0 -translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    "slide-right": {
      hidden: "opacity-0 translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    scale: {
      hidden: "opacity-0 scale-95",
      visible: "opacity-100 scale-100",
    },
  };

  const style = baseStyles[variant] || baseStyles["fade-up"];

  if (stagger) {
    return (
      <div ref={ref} className={className}>
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div
                key={i}
                className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  visible ? style.visible : style.hidden
                }`}
                style={{
                  transitionDelay: visible ? `${delay + i * staggerDelay}ms` : "0ms",
                }}
              >
                {child}
              </div>
            ))
          : children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        visible ? style.visible : style.hidden
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
