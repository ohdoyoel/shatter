"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PhysicsScene from "@/components/PhysicsScene";
import LoadingOverlay from "@/components/LoadingOverlay";
import { capture } from "./actions";
import type { CaptureResponse } from "@/lib/types";

function ShatterContent() {
  const url = useSearchParams().get("url");
  const [data, setData] = useState<CaptureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError("No URL provided");
      return;
    }

    capture(url, {
      width: window.innerWidth,
      height: window.innerHeight,
    }, window.devicePixelRatio || 1)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Something went wrong")
      );
  }, [url]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-white/60 mb-6 max-w-md">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-all"
          >
            Try another URL
          </a>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingOverlay message={`Capturing ${url}...`} />;

  return (
    <div className="w-full relative" style={{ backgroundColor: data.bodyBgColor || "#fff" }}>
      <PhysicsScene data={data} />
      {/* Shatter logo - bottom right */}
      <a
        href="/"
        className="fixed bottom-4 right-4 z-[9998] opacity-40 hover:opacity-80 transition-opacity duration-200"
        title="Shatter"
      >
        <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(32,32) scale(1.4) translate(-32,-32)">
            <polygon points="28,24 36,22 34,32 26,30" fill="url(#sl-grad)" opacity="0.9"/>
            <polygon points="36,22 42,26 38,34 34,32" fill="#ef4444" opacity="0.8"/>
            <polygon points="26,30 34,32 30,40 24,36" fill="#dc2626" opacity="0.85"/>
            <polygon points="34,32 38,34 36,42 30,40" fill="#ef4444" opacity="0.75"/>
            <polygon points="38,34 44,30 42,40 36,42" fill="#b91c1c" opacity="0.7"/>
          </g>
          <polygon points="18,14 24,12 22,20" fill="#ef4444" opacity="0.6" transform="rotate(-10,20,16)"/>
          <polygon points="44,10 50,14 46,20" fill="#ef4444" opacity="0.55" transform="rotate(15,47,14)"/>
          <polygon points="50,36 56,34 54,42" fill="#ef4444" opacity="0.45" transform="rotate(8,53,38)"/>
          <polygon points="46,48 52,50 48,56" fill="#ef4444" opacity="0.35" transform="rotate(20,49,52)"/>
          <polygon points="22,46 28,48 24,54" fill="#ef4444" opacity="0.4" transform="rotate(-12,25,50)"/>
          <polygon points="8,28 14,24 12,32" fill="#ef4444" opacity="0.5" transform="rotate(-5,11,28)"/>
          <polygon points="10,42 16,44 12,50" fill="#ef4444" opacity="0.3" transform="rotate(-18,13,46)"/>
          <polygon points="40,6 44,4 42,10" fill="#ef4444" opacity="0.4" transform="rotate(25,42,6)"/>
          <rect x="6" y="12" width="3" height="3" fill="#fff" opacity="0.25" transform="rotate(45,7.5,13.5)"/>
          <rect x="54" y="22" width="2.5" height="2.5" fill="#fff" opacity="0.2" transform="rotate(30,55,23)"/>
          <defs>
            <linearGradient id="sl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#f87171"/>
            </linearGradient>
          </defs>
        </svg>
      </a>
    </div>
  );
}

export default function ShatterPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <ShatterContent />
    </Suspense>
  );
}
