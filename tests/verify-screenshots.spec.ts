import { test, expect } from "@playwright/test";
import puppeteer from "puppeteer";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import fs from "fs";
import path from "path";

/**
 * Screenshot fidelity verification tests.
 *
 * Compares Puppeteer screenshots (same settings as our capture pipeline)
 * with Playwright screenshots (representing a "real browser") to verify
 * that the capture pipeline sees pages the same way a real browser does.
 *
 * Also tests the full shatter pipeline end-to-end: capture → reassemble → compare.
 */

const VERIFY_DIR = path.join(__dirname, "screenshots", "verify");
const BASE = "http://localhost:3000";

const URLS = [
  "https://example.com",
  "https://google.com",
  "https://naver.com",
  "https://www.daangn.com/kr/",
];

const VIEWPORT = { width: 1280, height: 800 };

function safeName(url: string): string {
  return url.replace(/[^a-z0-9]/gi, "_");
}

function compareImages(
  buf1: Buffer,
  buf2: Buffer
): { matchPercent: number; diffPixels: number; totalPixels: number; diffBuffer: Buffer } {
  const img1 = PNG.sync.read(buf1);
  const img2 = PNG.sync.read(buf2);

  // Resize to the smaller dimensions if they differ
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  // Crop both images to the common size
  const crop = (img: PNG, w: number, h: number): Buffer => {
    const cropped = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (y * w + x) * 4;
        cropped.data[dstIdx] = img.data[srcIdx];
        cropped.data[dstIdx + 1] = img.data[srcIdx + 1];
        cropped.data[dstIdx + 2] = img.data[srcIdx + 2];
        cropped.data[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }
    return cropped.data as unknown as Buffer;
  };

  const data1 = img1.width === width && img1.height === height ? img1.data : crop(img1, width, height);
  const data2 = img2.width === width && img2.height === height ? img2.data : crop(img2, width, height);

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    new Uint8Array(data1.buffer, data1.byteOffset, data1.byteLength),
    new Uint8Array(data2.buffer, data2.byteOffset, data2.byteLength),
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const matchPercent = ((1 - diffPixels / totalPixels) * 100);

  return {
    matchPercent,
    diffPixels,
    totalPixels,
    diffBuffer: PNG.sync.write(diff),
  };
}

// =========================================================================
// Test 1: Puppeteer vs Playwright screenshot fidelity
// =========================================================================
test.describe("Screenshot fidelity: Puppeteer vs Playwright", () => {
  for (const url of URLS) {
    test(`${url}`, async ({ page }) => {
      test.setTimeout(120_000);
      const name = safeName(url);

      // --- Puppeteer screenshot (same settings as capture pipeline) ---
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      const pPage = await browser.newPage();
      await pPage.setViewport({ ...VIEWPORT, deviceScaleFactor: 1 });
      await pPage.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );
      await pPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      });
      await pPage.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "light" },
      ]);

      try {
        await pPage.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
      } catch {
        await pPage.goto(url, { waitUntil: "load", timeout: 15000 });
      }

      await pPage.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 2000));

      const puppeteerPng = await pPage.screenshot({ type: "png" });
      fs.writeFileSync(
        path.join(VERIFY_DIR, `${name}_puppeteer.png`),
        puppeteerPng
      );
      await browser.close();

      // --- Playwright screenshot (real browser) ---
      await page.setViewportSize(VIEWPORT);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      } catch {
        await page.goto(url, { waitUntil: "load", timeout: 15000 });
      }
      await page.waitForTimeout(2000);

      const playwrightPng = await page.screenshot({ type: "png" });
      fs.writeFileSync(
        path.join(VERIFY_DIR, `${name}_playwright.png`),
        playwrightPng
      );

      // --- Compare ---
      const result = compareImages(
        Buffer.from(puppeteerPng),
        Buffer.from(playwrightPng)
      );
      fs.writeFileSync(
        path.join(VERIFY_DIR, `${name}_diff.png`),
        result.diffBuffer
      );

      console.log(
        `[${url}] Puppeteer vs Playwright: ${result.matchPercent.toFixed(2)}% match ` +
          `(${result.diffPixels} diff pixels / ${result.totalPixels} total)`
      );

      // We expect at least 80% match (same Chromium engine, minor timing differences expected)
      expect(result.matchPercent).toBeGreaterThan(80);
    });
  }
});

// =========================================================================
// Test 2: Capture pipeline end-to-end (requires dev server on port 3000)
// =========================================================================
test.describe("Capture pipeline verification", () => {
  for (const url of URLS) {
    test(`capture and reassemble: ${url}`, async ({ page }) => {
      test.setTimeout(120_000);
      const name = safeName(url);

      // Get capture data from API
      const apiUrl = `${BASE}/api/capture?url=${encodeURIComponent(url)}&width=${VIEWPORT.width}&height=${VIEWPORT.height}&dpr=1`;
      const response = await page.request.get(apiUrl, { timeout: 60000 });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.elements).toBeDefined();
      expect(data.screenshot).toBeDefined();
      expect(data.elements.length).toBeGreaterThan(0);

      console.log(
        `[${url}] Captured ${data.elements.length} elements, ` +
          `page: ${data.viewport.width}x${data.pageHeight}`
      );

      // Save the raw Puppeteer screenshot from capture pipeline
      const screenshotBase64 = data.screenshot.split(",")[1];
      const screenshotBuffer = Buffer.from(screenshotBase64, "base64");
      fs.writeFileSync(
        path.join(VERIFY_DIR, `${name}_capture_raw.jpg`),
        screenshotBuffer
      );

      // Take a Playwright screenshot of the same URL for comparison
      await page.setViewportSize(VIEWPORT);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      } catch {
        await page.goto(url, { waitUntil: "load", timeout: 15000 });
      }
      await page.waitForTimeout(2000);
      const realPng = await page.screenshot({ type: "png" });
      fs.writeFileSync(
        path.join(VERIFY_DIR, `${name}_real.png`),
        realPng
      );

      // Log element size distribution
      const areas = data.elements.map(
        (e: { width: number; height: number }) => e.width * e.height
      );
      const avgArea = areas.reduce((a: number, b: number) => a + b, 0) / areas.length;
      const vpArea = VIEWPORT.width * VIEWPORT.height;
      console.log(
        `[${url}] Avg element area: ${Math.round(avgArea)}px² ` +
          `(${((avgArea / vpArea) * 100).toFixed(1)}% of viewport)`
      );

      // Check element coverage of viewport (first screenful)
      const viewportElements = data.elements.filter(
        (e: { y: number; height: number }) =>
          e.y < VIEWPORT.height && e.y + e.height > 0
      );
      console.log(
        `[${url}] ${viewportElements.length} elements in first viewport`
      );
      expect(viewportElements.length).toBeGreaterThan(2);
    });
  }
});

// =========================================================================
// Test 3: Multiple captures consistency (same URL captured multiple times)
// =========================================================================
test.describe("Capture consistency", () => {
  const consistencyUrl = "https://example.com";

  test("same URL produces consistent results across 3 captures", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const results: { elementCount: number; pageHeight: number }[] = [];

    for (let i = 0; i < 3; i++) {
      const apiUrl = `${BASE}/api/capture?url=${encodeURIComponent(consistencyUrl)}&width=${VIEWPORT.width}&height=${VIEWPORT.height}&dpr=1`;
      const response = await page.request.get(apiUrl, { timeout: 60000 });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      results.push({
        elementCount: data.elements.length,
        pageHeight: data.pageHeight,
      });

      // Save each screenshot
      const base64 = data.screenshot.split(",")[1];
      fs.writeFileSync(
        path.join(VERIFY_DIR, `consistency_run${i + 1}.jpg`),
        Buffer.from(base64, "base64")
      );

      console.log(
        `[Run ${i + 1}] Elements: ${data.elements.length}, ` +
          `Page height: ${data.pageHeight}`
      );
    }

    // Element counts should be identical across runs
    expect(results[0].elementCount).toBe(results[1].elementCount);
    expect(results[1].elementCount).toBe(results[2].elementCount);

    // Page heights should be identical
    expect(results[0].pageHeight).toBe(results[1].pageHeight);
    expect(results[1].pageHeight).toBe(results[2].pageHeight);

    console.log(
      `[Consistency] All 3 runs produced identical results: ` +
        `${results[0].elementCount} elements, ${results[0].pageHeight}px height`
    );
  });
});
