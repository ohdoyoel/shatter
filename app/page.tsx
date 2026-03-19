"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

/* ─── Inline URL form (same logic as UrlInput component) ─── */
function HeroForm() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }
    router.push(`/shatter?url=${encodeURIComponent(finalUrl)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter any URL... (e.g. google.com)"
        className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-base sm:text-lg outline-none focus:border-red-500/60 focus:bg-white/15 focus:ring-1 focus:ring-red-500/30 transition-all"
      />
      <button
        type="submit"
        className="px-8 py-4 rounded-xl bg-red-500 text-white font-bold text-base sm:text-lg hover:bg-red-400 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
      >
        Shatter it
      </button>
    </form>
  );
}

/* ─── Shatter demo visual ─── */
function ShatterDemo() {
  return (
    <div className="relative w-72 sm:w-80 h-80 sm:h-96 mx-auto">
      {/* Pulsing glow behind */}
      <div className="animate-mockup-glow absolute -inset-6 bg-red-500/5 rounded-3xl blur-2xl pointer-events-none" />

      {/* Intact mockup page */}
      <div className="animate-demo-intact absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
        {/* Mock browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          {/* Nav buttons */}
          <div className="flex items-center gap-1 ml-2">
            <svg className="w-3 h-3 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
            <svg className="w-3 h-3 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
          </div>
          {/* Address bar */}
          <div className="flex-1 mx-2 h-5 rounded-md bg-white/8 flex items-center px-2 gap-1.5">
            <svg className="w-2.5 h-2.5 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
            <span className="text-[7px] text-white/25 font-mono truncate">https://example.com</span>
          </div>
        </div>
        {/* Mock page content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Shimmer scan line */}
          <div className="animate-shimmer-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none z-10" />

          <div className="p-3 space-y-2">
            {/* Navigation bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-500/25" />
                <div className="h-2.5 w-12 rounded bg-white/12" />
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-8 rounded bg-white/8" />
                <div className="h-2 w-8 rounded bg-white/8" />
                <div className="h-2 w-8 rounded bg-white/8" />
                <div className="h-2 w-8 rounded bg-red-500/20" />
              </div>
            </div>

            {/* Hero image area */}
            <div className="h-16 w-full rounded-lg bg-gradient-to-br from-red-500/10 via-purple-500/8 to-blue-500/10 border border-white/5 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-2.5 w-20 rounded bg-white/15" />
                <div className="h-2 w-14 rounded bg-white/8" />
              </div>
            </div>

            {/* Content area with sidebar */}
            <div className="flex gap-2">
              {/* Main content */}
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-full rounded bg-white/10" />
                <div className="h-2 w-5/6 rounded bg-white/6" />
                <div className="h-2 w-full rounded bg-white/6" />
                <div className="h-2 w-3/4 rounded bg-white/6" />
              </div>
              {/* Sidebar */}
              <div className="w-16 space-y-1.5 shrink-0">
                <div className="h-10 w-full rounded bg-white/5 border border-white/5" />
                <div className="h-2 w-full rounded bg-white/6" />
                <div className="h-2 w-3/4 rounded bg-white/5" />
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <div className="h-12 rounded-md bg-gradient-to-b from-blue-500/8 to-blue-500/4 border border-white/5">
                <div className="p-1.5">
                  <div className="h-4 w-full rounded bg-white/5 mb-1" />
                  <div className="h-1.5 w-full rounded bg-white/5" />
                </div>
              </div>
              <div className="h-12 rounded-md bg-gradient-to-b from-emerald-500/8 to-emerald-500/4 border border-white/5">
                <div className="p-1.5">
                  <div className="h-4 w-full rounded bg-white/5 mb-1" />
                  <div className="h-1.5 w-full rounded bg-white/5" />
                </div>
              </div>
              <div className="h-12 rounded-md bg-gradient-to-b from-amber-500/8 to-amber-500/4 border border-white/5">
                <div className="p-1.5">
                  <div className="h-4 w-full rounded bg-white/5 mb-1" />
                  <div className="h-1.5 w-full rounded bg-white/5" />
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 mt-1">
              <div className="h-5 w-16 rounded bg-red-500/20 border border-red-500/15" />
              <div className="h-5 w-20 rounded bg-white/7 border border-white/5" />
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 pt-1.5 mt-1.5 flex justify-between">
              <div className="h-1.5 w-10 rounded bg-white/5" />
              <div className="flex gap-2">
                <div className="h-1.5 w-6 rounded bg-white/4" />
                <div className="h-1.5 w-6 rounded bg-white/4" />
                <div className="h-1.5 w-6 rounded bg-white/4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crack overlay */}
      <div className="animate-crack-overlay absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-20">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 0 L145 80 L120 120 L80 180 L60 320" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <path d="M150 0 L160 70 L190 110 L220 170 L250 320" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <path d="M0 160 L70 155 L120 120 L180 125 L300 130" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <path d="M145 80 L100 90 L0 95" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          <path d="M160 70 L210 65 L300 55" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          <path d="M120 120 L115 200 L100 320" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          <path d="M190 110 L200 200 L210 320" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Flash overlay */}
      <div className="animate-shatter-flash absolute inset-0 rounded-xl bg-white pointer-events-none z-30" />

      {/* Shattered pieces falling - 10 shards */}
      <div className="absolute inset-0">
        {/* Shard 1 - browser chrome top */}
        <div className="animate-shard-1 shard-shadow absolute top-0 left-0 right-0 h-9 rounded-t-xl bg-white/8 border border-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500/40" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
            <div className="w-2 h-2 rounded-full bg-green-500/40" />
          </div>
        </div>
        {/* Shard 2 - nav bar */}
        <div className="animate-shard-2 shard-shadow absolute top-10 left-3 right-3 h-6 rounded bg-white/6 border border-white/12 flex items-center px-2">
          <div className="w-3 h-3 rounded bg-red-500/20 mr-2" />
          <div className="h-1.5 w-8 rounded bg-white/10" />
        </div>
        {/* Shard 3 - hero image block */}
        <div className="animate-shard-3 shard-shadow absolute top-[68px] left-3 right-3 h-16 rounded-lg bg-gradient-to-br from-red-500/12 via-purple-500/8 to-blue-500/10 border border-white/10" />
        {/* Shard 4 - text paragraph left */}
        <div className="animate-shard-4 shard-shadow absolute top-[140px] left-3 w-[55%] h-10 rounded bg-white/6 border border-white/10">
          <div className="p-1.5 space-y-1">
            <div className="h-1.5 w-full rounded bg-white/8" />
            <div className="h-1.5 w-4/5 rounded bg-white/6" />
          </div>
        </div>
        {/* Shard 5 - sidebar block */}
        <div className="animate-shard-5 shard-shadow absolute top-[140px] right-3 w-16 h-14 rounded bg-white/5 border border-white/10" />
        {/* Shard 6 - card 1 */}
        <div className="animate-shard-6 shard-shadow absolute top-[190px] left-3 w-[30%] h-12 rounded-md bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-white/10" />
        {/* Shard 7 - card 2 */}
        <div className="animate-shard-7 shard-shadow absolute top-[190px] left-[35%] w-[30%] h-12 rounded-md bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-white/10" />
        {/* Shard 8 - card 3 */}
        <div className="animate-shard-8 shard-shadow absolute top-[190px] right-3 w-[30%] h-12 rounded-md bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-white/10" />
        {/* Shard 9 - CTA buttons */}
        <div className="animate-shard-9 shard-shadow absolute top-[248px] left-3 w-24 h-5 rounded flex gap-1.5">
          <div className="h-full w-12 rounded bg-red-500/20 border border-red-500/15" />
          <div className="h-full w-14 rounded bg-white/7 border border-white/8" />
        </div>
        {/* Shard 10 - footer */}
        <div className="animate-shard-10 shard-shadow absolute bottom-3 left-3 right-3 h-5 rounded-b-lg bg-white/4 border border-white/8" />
      </div>

      {/* Particle effects - tiny dots that fly out */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-particle-1 absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-red-500/70" />
        <div className="animate-particle-2 absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-white/60" />
        <div className="animate-particle-3 absolute top-1/2 left-1/4 w-1 h-1 rounded-full bg-red-400/50" />
        <div className="animate-particle-4 absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-white/50" />
        <div className="animate-particle-5 absolute top-2/5 left-1/5 w-0.5 h-0.5 rounded-full bg-red-500/60" />
        <div className="animate-particle-6 absolute top-2/5 right-1/5 w-0.5 h-0.5 rounded-full bg-white/40" />
        <div className="animate-particle-7 absolute top-1/4 left-2/5 w-1 h-1 rounded-full bg-red-300/50" />
        <div className="animate-particle-8 absolute top-1/4 right-2/5 w-1 h-1 rounded-full bg-white/50" />
        <div className="animate-particle-9 absolute top-1/5 left-1/2 w-0.5 h-0.5 rounded-full bg-red-500/40" />
        <div className="animate-particle-10 absolute top-3/5 left-2/5 w-1 h-1 rounded-full bg-white/40" />
        <div className="animate-particle-11 absolute top-2/5 right-1/6 w-0.5 h-0.5 rounded-full bg-red-400/50" />
        <div className="animate-particle-12 absolute top-1/3 left-1/6 w-1 h-1 rounded-full bg-white/30" />
      </div>

      {/* Ground line */}
      <div className="animate-ground-pulse absolute -bottom-2 left-[-10%] right-[-10%] h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      <div className="absolute -bottom-2 left-[5%] right-[5%] h-[3px] bg-gradient-to-r from-transparent via-red-500/10 to-transparent blur-sm" />
    </div>
  );
}

/* ─── Step card for "How it works" ─── */
function StepCard({
  number,
  title,
  description,
  icon,
  delay,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: string;
}) {
  return (
    <div className={`animate-fade-in-up ${delay} flex flex-col items-center text-center p-6 sm:p-8`}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 sm:mb-6">
        {icon}
      </div>
      <span className="text-xs font-mono text-red-500/80 tracking-widest uppercase mb-2">
        Step {number}
      </span>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-white/50 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({
  title,
  description,
  icon,
  floatClass,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  floatClass?: string;
}) {
  return (
    <div
      className={`${floatClass ?? ""} group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-red-500/30 hover:bg-white/[0.06] transition-all duration-300`}
    >
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/45 leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── SVG Icons (inline, no deps) ─── */
function IconLink() {
  return (
    <svg
      className="w-7 h-7 sm:w-9 sm:h-9 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      className="w-7 h-7 sm:w-9 sm:h-9 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg
      className="w-7 h-7 sm:w-9 sm:h-9 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function IconPhysics() {
  return (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
    </svg>
  );
}

function IconTilt() {
  return (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

function IconDrag() {
  return (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function ShatterLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(32,32) scale(1.4) translate(-32,-32)">
        <polygon points="28,24 36,22 34,32 26,30" fill="url(#logo-grad)" opacity="0.9"/>
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
      <rect x="14" y="56" width="2" height="2" fill="#fff" opacity="0.2" transform="rotate(60,15,57)"/>
      <rect x="56" y="52" width="2.5" height="2.5" fill="#fff" opacity="0.15" transform="rotate(15,57,53)"/>
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444"/>
          <stop offset="100%" stopColor="#f87171"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Main Landing Page
   ═══════════════════════════════════════════════ */

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-grid bg-spotlight overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Logo */}
          <div className="animate-fade-in-up mb-4">
            <ShatterLogo className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter mb-6">
            Sh
            <span className="inline-block text-red-500 animate-glow-pulse">a</span>
            tter
          </h1>

          {/* Tagline */}
          <p className="animate-fade-in-up delay-200 text-lg sm:text-xl md:text-2xl text-white/50 max-w-lg mx-auto leading-relaxed mb-10">
            Enter any URL. Watch every element break apart and fall with real physics.
          </p>

          {/* URL input */}
          <div className="animate-fade-in-up delay-400 w-full max-w-2xl">
            <HeroForm />
          </div>

          {/* Tech badge */}
          <p className="animate-fade-in-up delay-600 mt-8 text-white/20 text-xs sm:text-sm font-mono tracking-wide">
            Puppeteer &middot; Matter.js &middot; Next.js
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <IconArrowDown />
        </div>
      </section>

      {/* ── DEMO PREVIEW ── */}
      <section className="relative px-6 py-20 sm:py-28 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              See it in action
            </h2>
            <p className="animate-fade-in-up delay-200 text-white/40 text-base sm:text-lg max-w-md mx-auto">
              Any webpage transforms into interactive physics elements
            </p>
          </div>

          <div className="animate-fade-in-up delay-300 relative">
            {/* Demo container with labels */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              {/* Before - Enhanced intact webpage mockup */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-mono tracking-widest uppercase text-white/30">Intact webpage</span>
                <div className="relative w-72 sm:w-80 h-80 sm:h-96">
                  {/* Pulsing glow behind */}
                  <div className="animate-mockup-glow absolute -inset-6 bg-white/[0.02] rounded-3xl blur-2xl pointer-events-none" />

                  {/* Static mockup */}
                  <div className="absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                      </div>
                      {/* Nav buttons */}
                      <div className="flex items-center gap-1 ml-1.5">
                        <svg className="w-2.5 h-2.5 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
                        <svg className="w-2.5 h-2.5 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
                      </div>
                      {/* Address bar */}
                      <div className="flex-1 mx-2 h-4 rounded bg-white/8 flex items-center px-2 gap-1">
                        <svg className="w-2 h-2 text-green-400/40 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
                        <span className="text-[6px] text-white/20 font-mono truncate">https://example.com</span>
                      </div>
                    </div>

                    {/* Page content with shimmer */}
                    <div className="flex-1 relative overflow-hidden">
                      {/* Shimmer scan line */}
                      <div className="animate-shimmer-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none z-10" />

                      <div className="p-3 space-y-2">
                        {/* Navigation bar */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 rounded bg-red-500/20" />
                            <div className="h-2 w-10 rounded bg-white/10" />
                          </div>
                          <div className="flex gap-2">
                            <div className="h-1.5 w-7 rounded bg-white/7" />
                            <div className="h-1.5 w-7 rounded bg-white/7" />
                            <div className="h-1.5 w-7 rounded bg-white/7" />
                            <div className="h-1.5 w-7 rounded bg-red-500/15" />
                          </div>
                        </div>

                        {/* Hero image area */}
                        <div className="h-14 w-full rounded-lg bg-gradient-to-br from-red-500/8 via-purple-500/6 to-blue-500/8 border border-white/5 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="h-2 w-16 rounded bg-white/12" />
                            <div className="h-1.5 w-12 rounded bg-white/7" />
                          </div>
                        </div>

                        {/* Content with sidebar */}
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-full rounded bg-white/8" />
                            <div className="h-1.5 w-5/6 rounded bg-white/5" />
                            <div className="h-1.5 w-full rounded bg-white/5" />
                            <div className="h-1.5 w-3/4 rounded bg-white/5" />
                          </div>
                          <div className="w-14 space-y-1 shrink-0">
                            <div className="h-9 w-full rounded bg-white/4 border border-white/5" />
                            <div className="h-1.5 w-full rounded bg-white/5" />
                            <div className="h-1.5 w-3/4 rounded bg-white/4" />
                          </div>
                        </div>

                        {/* Cards grid */}
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          <div className="h-10 rounded bg-gradient-to-b from-blue-500/6 to-blue-500/3 border border-white/5">
                            <div className="p-1">
                              <div className="h-3.5 w-full rounded bg-white/4 mb-0.5" />
                              <div className="h-1 w-full rounded bg-white/4" />
                            </div>
                          </div>
                          <div className="h-10 rounded bg-gradient-to-b from-emerald-500/6 to-emerald-500/3 border border-white/5">
                            <div className="p-1">
                              <div className="h-3.5 w-full rounded bg-white/4 mb-0.5" />
                              <div className="h-1 w-full rounded bg-white/4" />
                            </div>
                          </div>
                          <div className="h-10 rounded bg-gradient-to-b from-amber-500/6 to-amber-500/3 border border-white/5">
                            <div className="p-1">
                              <div className="h-3.5 w-full rounded bg-white/4 mb-0.5" />
                              <div className="h-1 w-full rounded bg-white/4" />
                            </div>
                          </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="flex gap-1.5 mt-1">
                          <div className="h-4 w-14 rounded bg-red-500/15 border border-red-500/10" />
                          <div className="h-4 w-16 rounded bg-white/6 border border-white/5" />
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/5 pt-1 mt-1 flex justify-between">
                          <div className="h-1 w-8 rounded bg-white/4" />
                          <div className="flex gap-1.5">
                            <div className="h-1 w-5 rounded bg-white/3" />
                            <div className="h-1 w-5 rounded bg-white/3" />
                            <div className="h-1 w-5 rounded bg-white/3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow - animated pulse + glow */}
              <div className="flex flex-col items-center gap-3">
                <div className="animate-arrow-pulse">
                  <svg
                    className="w-10 h-10 text-red-500 rotate-90 md:rotate-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
                <span className="text-xs font-bold font-mono text-red-500/70 tracking-widest animate-glow-pulse">SHATTER</span>
              </div>

              {/* After - animated */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-mono tracking-widest uppercase text-white/30">Physics mode</span>
                <ShatterDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative px-6 py-20 sm:py-28">
        {/* Top separator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="animate-fade-in-up delay-200 text-white/40 text-base sm:text-lg">
              Three simple steps to destruction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[calc(33.33%-2rem)] w-[calc(33.33%+4rem)] h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-line-pulse" />
            <div className="hidden md:block absolute top-10 left-[calc(66.66%-2rem)] w-[calc(33.33%+4rem)] h-px bg-gradient-to-r from-white/10 via-white/20 to-white/10 animate-line-pulse" />

            <StepCard
              number="1"
              title="Enter a URL"
              description="Paste any website address. We handle the rest -- no login, no setup."
              icon={<IconLink />}
              delay="delay-200"
            />
            <StepCard
              number="2"
              title="Capture elements"
              description="Puppeteer loads the page and identifies every visible element with pixel-perfect accuracy."
              icon={<IconCamera />}
              delay="delay-400"
            />
            <StepCard
              number="3"
              title="Shatter and play"
              description="Elements break apart and fall with real gravity. Drag, throw, and watch them collide."
              icon={<IconBolt />}
              delay="delay-600"
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative px-6 py-20 sm:py-28">
        {/* Top separator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Features
            </h2>
            <p className="animate-fade-in-up delay-200 text-white/40 text-base sm:text-lg">
              Built for fun. Powered by real tech.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FeatureCard
              title="Real physics simulation"
              description="Powered by Matter.js -- elements have mass, friction, and bounce. Collisions look and feel natural."
              icon={<IconPhysics />}
              floatClass="animate-float"
            />
            <FeatureCard
              title="Device sensor gravity"
              description="On mobile, tilt your phone to change gravity direction. Elements slide and tumble with your movement."
              icon={<IconTilt />}
              floatClass="animate-float-delayed"
            />
            <FeatureCard
              title="Drag and throw"
              description="Click or tap any element to grab it. Flick to throw it across the screen and watch it crash into others."
              icon={<IconDrag />}
              floatClass="animate-float-delayed-2"
            />
            <FeatureCard
              title="Works with any website"
              description="From news sites to social media. Shatter captures the visual layout of any publicly accessible URL."
              icon={<IconGlobe />}
              floatClass="animate-float"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-20 sm:py-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to break something?
          </h2>
          <p className="animate-fade-in-up delay-200 text-white/40 text-base sm:text-lg mb-10">
            Try it now. It only takes a URL.
          </p>
          <div className="animate-fade-in-up delay-400 w-full max-w-2xl mx-auto">
            <HeroForm />
          </div>
        </div>
      </section>

      {/* ── GITHUB ── */}
      <section className="relative px-6 py-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="animate-fade-in-up max-w-2xl mx-auto flex flex-col items-center gap-3">
          <a
            href="https://github.com/ohdoyoel/shatter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-white/50 hover:text-white transition-colors duration-200"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="text-sm font-medium">ohdoyoel</span>
          </a>
          <a
            href="https://github.com/ohdoyoel/shatter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/25 hover:text-white/40 transition-colors duration-200"
          >
            View source on GitHub
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-sm">
          <div className="flex items-center gap-2">
            <ShatterLogo className="w-5 h-5" />
            <span className="font-bold text-white/40">Shatter</span>
            <span>&middot;</span>
            <span>Break any webpage with physics</span>
          </div>
          <div className="font-mono text-xs">
            Puppeteer &middot; Matter.js &middot; Next.js
          </div>
        </div>
      </footer>
    </main>
  );
}
