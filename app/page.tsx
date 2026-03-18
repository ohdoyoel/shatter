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
    <div className="relative w-full max-w-sm mx-auto h-72 sm:h-80">
      {/* Intact mockup page */}
      <div className="animate-demo-intact absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
        {/* Mock browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <div className="flex-1 mx-3 h-5 rounded-md bg-white/10" />
        </div>
        {/* Mock page content */}
        <div className="flex-1 p-4 space-y-3">
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/8" />
          <div className="h-4 w-5/6 rounded bg-white/8" />
          <div className="mt-4 h-20 w-full rounded-lg bg-white/6" />
          <div className="flex gap-2 mt-3">
            <div className="h-8 w-20 rounded bg-red-500/20" />
            <div className="h-8 w-24 rounded bg-white/8" />
          </div>
          <div className="h-4 w-2/3 rounded bg-white/8 mt-3" />
        </div>
      </div>

      {/* Shattered pieces falling */}
      <div className="absolute inset-0">
        {/* Shard 1 - header */}
        <div
          className="animate-shard-1 absolute top-4 left-4 right-4 h-10 rounded-lg bg-white/10 border border-white/20 shadow-lg"
        />
        {/* Shard 2 - text block */}
        <div
          className="animate-shard-2 absolute top-16 left-4 w-3/5 h-6 rounded bg-white/10 border border-white/15 shadow-lg"
        />
        {/* Shard 3 - image placeholder */}
        <div
          className="animate-shard-3 absolute top-28 left-4 right-4 h-16 rounded-lg bg-red-500/15 border border-red-500/20 shadow-lg"
        />
        {/* Shard 4 - button */}
        <div
          className="animate-shard-4 absolute top-48 left-4 w-20 h-7 rounded bg-red-500/20 border border-red-500/30 shadow-lg"
        />
        {/* Shard 5 - text */}
        <div
          className="animate-shard-5 absolute top-24 right-6 w-16 h-5 rounded bg-white/10 border border-white/15 shadow-lg"
        />
        {/* Shard 6 - small element */}
        <div
          className="animate-shard-6 absolute top-48 left-28 w-24 h-7 rounded bg-white/8 border border-white/15 shadow-lg"
        />
      </div>
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
      <section className="relative px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
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
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              {/* Before */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-xs font-mono tracking-widest uppercase text-white/30">Intact webpage</span>
                <div className="relative w-64 sm:w-72 h-56 sm:h-64">
                  {/* Static mockup */}
                  <div className="absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border-b border-white/10">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                      <div className="flex-1 mx-2 h-4 rounded bg-white/10" />
                    </div>
                    <div className="flex-1 p-3 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/7" />
                      <div className="h-3 w-5/6 rounded bg-white/7" />
                      <div className="mt-3 h-16 w-full rounded-lg bg-white/5" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded bg-red-500/20" />
                        <div className="h-6 w-20 rounded bg-white/7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-8 h-8 text-red-500/60 rotate-90 md:rotate-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-xs font-mono text-red-500/50 tracking-wider">SHATTER</span>
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

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-sm">
          <div className="flex items-center gap-2">
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
