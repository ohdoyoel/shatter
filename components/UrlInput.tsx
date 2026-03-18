"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UrlInput() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let finalUrl = url.trim();
    if (!finalUrl) return;

    // Add https:// if no protocol
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    router.push(`/shatter?url=${encodeURIComponent(finalUrl)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-3">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter any URL... (e.g. google.com)"
        className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-lg outline-none focus:border-white/50 focus:bg-white/15 transition-all"
      />
      <button
        type="submit"
        className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-white/90 active:scale-95 transition-all"
      >
        Shatter!
      </button>
    </form>
  );
}
