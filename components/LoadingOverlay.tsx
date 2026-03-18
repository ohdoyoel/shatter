"use client";

import { useEffect, useRef, useState } from "react";

// Shard shape definitions — triangular fragments like broken glass
const SHARDS = [
  { points: "0,-18 12,10 -14,6", size: 1, speed: 0.7, orbit: 90, phase: 0, depth: 1 },
  { points: "0,-14 16,8 -10,12", size: 0.8, speed: 0.5, orbit: 120, phase: 60, depth: 2 },
  { points: "0,-10 12,6 -8,10", size: 0.6, speed: 0.9, orbit: 70, phase: 120, depth: 1 },
  { points: "0,-16 10,12 -12,4", size: 0.7, speed: 0.6, orbit: 140, phase: 180, depth: 3 },
  { points: "0,-12 14,8 -6,10", size: 0.5, speed: 0.8, orbit: 100, phase: 240, depth: 2 },
  { points: "0,-8 10,6 -10,8", size: 0.9, speed: 0.4, orbit: 160, phase: 300, depth: 3 },
  { points: "0,-14 8,12 -12,6", size: 0.55, speed: 0.65, orbit: 110, phase: 30, depth: 1 },
  { points: "0,-10 14,4 -8,12", size: 0.75, speed: 0.55, orbit: 130, phase: 150, depth: 2 },
  { points: "0,-12 6,10 -14,4", size: 0.45, speed: 0.85, orbit: 80, phase: 210, depth: 3 },
  { points: "0,-16 12,10 -10,8", size: 0.65, speed: 0.45, orbit: 150, phase: 270, depth: 1 },
];

export default function LoadingOverlay({ message }: { message?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  const [dots, setDots] = useState("");

  // Animation timer
  useEffect(() => {
    let raf: number;
    let start = performance.now();
    function tick() {
      setTime((performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Dots animation
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(id);
  }, []);

  // Track mouse/touch for parallax
  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMouse({ x: (cx / w - 0.5) * 2, y: (cy / h - 0.5) * 2 });
    };
    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Radial glow background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(600px circle at ${50 + mouse.x * 5}% ${50 + mouse.y * 5}%, rgba(239,68,68,0.08) 0%, transparent 70%)`,
        }}
      />

      <div className="relative" style={{ width: 320, height: 320 }}>
        {/* Orbiting shards */}
        <svg
          viewBox="-160 -160 320 320"
          className="absolute inset-0 w-full h-full"
          style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.3))" }}
        >
          <defs>
            <linearGradient id="shard-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="shard-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="shard-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          {SHARDS.map((shard, i) => {
            const angle = ((shard.phase + time * shard.speed * 60) * Math.PI) / 180;
            const wobble = Math.sin(time * 1.5 + i) * 8;
            const ox = Math.cos(angle) * (shard.orbit + wobble);
            const oy = Math.sin(angle) * (shard.orbit + wobble);
            // Parallax: deeper shards move more with mouse
            const parallax = shard.depth * 8;
            const px = ox + mouse.x * parallax;
            const py = oy + mouse.y * parallax;
            const rot = time * shard.speed * 40 + shard.phase;
            const pulse = 0.4 + Math.sin(time * 2 + i * 0.7) * 0.25;
            return (
              <polygon
                key={i}
                points={shard.points}
                fill={`url(#shard-grad-${shard.depth})`}
                opacity={pulse}
                transform={`translate(${px},${py}) rotate(${rot}) scale(${shard.size})`}
              />
            );
          })}
        </svg>

        {/* Central logo — larger version with pulse */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${mouse.x * -4}px, ${mouse.y * -4}px)`,
          }}
        >
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="w-24 h-24"
            style={{
              filter: `drop-shadow(0 0 ${12 + Math.sin(time * 2) * 6}px rgba(239,68,68,${0.4 + Math.sin(time * 2) * 0.2}))`,
            }}
          >
            <g transform="translate(32,32) scale(1.4) translate(-32,-32)">
              <polygon points="28,24 36,22 34,32 26,30" fill="url(#logo-grad)" opacity="0.9" />
              <polygon points="36,22 42,26 38,34 34,32" fill="#ef4444" opacity="0.8" />
              <polygon points="26,30 34,32 30,40 24,36" fill="#dc2626" opacity="0.85" />
              <polygon points="34,32 38,34 36,42 30,40" fill="#ef4444" opacity="0.75" />
              <polygon points="38,34 44,30 42,40 36,42" fill="#b91c1c" opacity="0.7" />
            </g>
            {/* Scattered debris */}
            <polygon points="18,14 24,12 22,20" fill="#ef4444" opacity="0.6" transform="rotate(-10,20,16)" />
            <polygon points="44,10 50,14 46,20" fill="#ef4444" opacity="0.55" transform="rotate(15,47,14)" />
            <polygon points="50,36 56,34 54,42" fill="#ef4444" opacity="0.45" transform="rotate(8,53,38)" />
            <polygon points="46,48 52,50 48,56" fill="#ef4444" opacity="0.35" transform="rotate(20,49,52)" />
            <polygon points="22,46 28,48 24,54" fill="#ef4444" opacity="0.4" transform="rotate(-12,25,50)" />
            <polygon points="8,28 14,24 12,32" fill="#ef4444" opacity="0.5" transform="rotate(-5,11,28)" />
            <polygon points="10,42 16,44 12,50" fill="#ef4444" opacity="0.3" transform="rotate(-18,13,46)" />
            <polygon points="40,6 44,4 42,10" fill="#ef4444" opacity="0.4" transform="rotate(25,42,6)" />
            <rect x="6" y="12" width="3" height="3" fill="#fff" opacity="0.25" transform="rotate(45,7.5,13.5)" />
            <rect x="54" y="22" width="2.5" height="2.5" fill="#fff" opacity="0.2" transform="rotate(30,55,23)" />
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Rotating ring */}
        <svg viewBox="-160 -160 320 320" className="absolute inset-0 w-full h-full">
          <circle
            cx="0"
            cy="0"
            r="72"
            fill="none"
            stroke="rgba(239,68,68,0.15)"
            strokeWidth="1"
          />
          <circle
            cx="0"
            cy="0"
            r="72"
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="2"
            strokeDasharray="60 393"
            strokeLinecap="round"
            transform={`rotate(${time * 90})`}
          />
          <defs>
            <linearGradient id="ring-grad">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      <div className="absolute bottom-1/4 text-center">
        <p className="text-white/70 text-base tracking-wide">
          {message || "Capturing page"}{dots}
        </p>
      </div>
    </div>
  );
}
