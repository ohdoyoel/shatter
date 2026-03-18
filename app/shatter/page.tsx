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
    <div className="w-full" style={{ backgroundColor: data.bodyBgColor || "#fff" }}>
      <PhysicsScene data={data} />
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
