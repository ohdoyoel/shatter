# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Shatter?

Shatter is a Next.js web app that takes any URL, captures a full-page screenshot and element positions using Puppeteer (server-side), and renders those elements as interactive physics bodies using Matter.js (client-side). Users enter a URL, the page is captured, then elements "shatter" and fall with realistic physics — users can drag and throw them.

## Commands

- `npm run dev` — start dev server (default port 3000)
- `npm run build` — production build
- `npm run lint` — run Next.js linter
- `npx playwright test` — run Playwright E2E tests (requires dev server running separately)
- `npx playwright test tests/qa.spec.ts` — run a single test file

Tests in `tests/qa.spec.ts` expect the dev server on port 3001; `tests/naver-issues.spec.ts` expects port 3000. There is no Playwright config file — tests use hardcoded `BASE` URLs.

## Architecture

The app has a two-phase pipeline: **server-side capture** → **client-side physics rendering**.

### Server-side capture pipeline

1. **`app/shatter/actions.ts`** — Next.js Server Action entry point. Validates the URL (http/https only) and calls `captureUrl()` with the client's viewport dimensions and device pixel ratio. Also available via HTTP GET at `app/api/capture/route.ts`.

2. **`lib/capture.ts`** — Core capture logic using a persistent Puppeteer browser instance with anti-detection measures (spoofed user-agent, disabled webdriver flag, light mode emulation).
   - **Page loading**: Uses `networkidle2` with fallback to `load`; waits for 5+ visible elements; scrolls entire page to trigger lazy-loads; waits for fonts + 1.5s settle time.
   - **Pass 1 (browser-side)**: DOM traversal identifies atomic elements (IMG, SVG, VIDEO, CANVAS, INPUT, BUTTON, etc.) and leaf elements with text/visual styling. Skips containers that have no background content (recurses into children instead). Min area = 0.01% of viewport.
   - **Pass 2**: Attempts finer element extraction from child iframes, replacing fallback atomic iframe blocks with extracted elements.
   - **Screenshot**: Captures full-page JPEG (quality 90) as base64 data URI — this is the visual source for all rendering.
   - Output: `CaptureResponse` with element positions/sizes, viewport, pageHeight, bodyBgColor, and screenshot.

3. **`lib/element-filter.ts`** — Multi-stage filter and deduplication. Removes too-small/off-screen elements, clamps to page bounds, removes near-exact positional duplicates (within 5px), deduplicates by coverage overlap (>50% covered → skip, sorted small→large), and caps content elements at `maxElements` (default 150).

### Client-side physics rendering

4. **`components/PhysicsScene.tsx`** — Main rendering component. Uses CSS `background-image` with the full-page screenshot on every element, clipped via `background-position` offsets (no HTML rendering — purely screenshot-based).
   - **Two-layer rendering**: Static elements (`isStatic: true`) at zIndex 0 visible immediately; physics elements (`isStatic: false`) at zIndex 1, hidden until shatter.
   - **Shatter flow**: Init physics → create bodies for non-static elements → start rAF loop syncing DOM transforms to Matter.js positions → 500ms delay → trigger shatter. White mask rectangles are placed at original positions post-shatter to erase physics elements from the background layer.
   - **Gravity controls**: iOS uses accelerometer (requires permission prompt) with desktop fallback; Android tries sensor with desktop fallback; Desktop uses keyboard (arrows/WASD) + mouse-edge detection (15% screen zone).

5. **`lib/physics.ts`** — Matter.js world setup with walls/floor/ceiling. Mouse constraint with wheel events removed to preserve page scroll. Touch handling only blocks scroll during active body drag. Batch activation (30 bodies every 80ms) with random impulses top→bottom.

### Key data types (`lib/types.ts`)

- **`CapturedElement`**: id, x, y, width, height, `isStatic` boolean (true = static background, false = physics body).
- **`CaptureResponse`**: viewport, pageHeight, elements array, bodyBgColor, screenshot (base64 JPEG data URI).

### Static vs physics element distinction

Elements detected as background containers get `isStatic: true` (rendered at zIndex 0, stay in place). All other visible elements get `isStatic: false` (physics bodies, draggable, zIndex 1). This split is central to maintaining visual fidelity while allowing individual elements to shatter.

### Critical implementation detail

Matter.js bodies must be created as dynamic first, then set to static via `Body.setStatic(true)`. Creating with `isStatic: true` directly breaks mass/inertia restoration, producing NaN positions when later activated with `setStatic(false)`.

### Important config (`next.config.ts`)

- `reactStrictMode: false` — prevents double-mounting issues with physics engine.
- `serverExternalPackages: ["puppeteer"]` — required for server-side Puppeteer.

### Known issues

The `tests/naver-issues.spec.ts` file documents two known rendering bugs:
1. **Element overlap/duplication**: Static elements render the full screenshot region including children that also appear as separate physics elements, causing visual doubling before shatter.
2. **Search bar clipping**: `overflow: hidden` on element wrappers (and the CSS rule in `globals.css` forcing overflow hidden on descendants) can clip content when captured bounding boxes are slightly too small.
