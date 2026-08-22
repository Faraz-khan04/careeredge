"use client";

import * as React from "react";

/**
 * Ambient constellation.
 *
 * Fixed behind the hero, drawn on canvas at device pixel ratio, with a
 * spotlight that eases toward the cursor rather than snapping to it. Renders
 * nothing until mounted, so there is no hydration mismatch — the server sends
 * an empty canvas and the field appears on the client.
 *
 * Pauses entirely when scrolled out of view and under reduced-motion, because
 * an animation nobody is looking at is just a battery cost.
 */
export function AmbientMeshBackground({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Read the theme from the class the provider sets, so the field is drawn
    // in ink that actually shows on whichever ground it lands on.
    const isDark = () => document.documentElement.classList.contains("dark");

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;

    const pointer = { x: -9999, y: -9999 };
    const spot = { x: -9999, y: -9999 };

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    let particles: P[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scaled to area, capped so large monitors don't melt.
      const count = Math.min(120, Math.round((width * height) / 15000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.4 + 0.5,
      }));
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
    });
    io.observe(canvas);

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    window.addEventListener("mousemove", onMove, { passive: true });

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible) return;

      ctx!.clearRect(0, 0, width, height);

      // Spotlight eases toward the cursor — snapping reads as jitter.
      if (spot.x < -9000) {
        spot.x = width / 2;
        spot.y = height * 0.32;
      }
      if (pointer.x > -9000) {
        spot.x += (pointer.x - spot.x) * 0.045;
        spot.y += (pointer.y - spot.y) * 0.045;
      }

      const glow = ctx!.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, Math.max(width, height) * 0.5);
      const dark = isDark();
      glow.addColorStop(0, dark ? "rgba(6, 182, 212, 0.10)" : "rgba(6, 130, 190, 0.09)");
      glow.addColorStop(0.45, dark ? "rgba(16, 185, 129, 0.045)" : "rgba(16, 140, 110, 0.05)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        // Particles near the spotlight brighten, so the field feels lit
        // rather than uniformly sprinkled.
        const d = Math.hypot(p.x - spot.x, p.y - spot.y);
        const lit = Math.max(0, 1 - d / 320);

        ctx!.fillStyle = dark
          ? `rgba(160, 200, 255, ${0.1 + lit * 0.45})`
          : `rgba(60, 90, 140, ${0.12 + lit * 0.4})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r + lit * 0.7, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Constellation lines, only between close pairs.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 108) continue;

          ctx!.strokeStyle = dark
            ? `rgba(120, 170, 235, ${(1 - d / 108) * 0.1})`
            : `rgba(70, 100, 150, ${(1 - d / 108) * 0.13})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
