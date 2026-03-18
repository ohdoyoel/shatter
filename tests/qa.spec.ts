import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const SCENE = '[data-testid="physics-scene"]';
const URLS = [
  "https://google.com",
  "https://naver.com",
  "https://www.daangn.com/kr/",
];

for (const targetUrl of URLS) {
  test.describe(`QA: ${targetUrl}`, () => {
    test("capture and render physics scene", async ({ page }) => {
      test.setTimeout(120000);

      await page.goto(
        `${BASE}/shatter?url=${encodeURIComponent(targetUrl)}`,
        { timeout: 60000 }
      );

      // Wait for PHYSICS SCENE (not loading spinner)
      await page.waitForSelector(`${SCENE} .absolute`, {
        timeout: 60000,
      });
      await page.waitForTimeout(4000);

      const safeName = targetUrl.replace(/[^a-z0-9]/gi, "_");
      await page.screenshot({
        path: `tests/screenshots/${safeName}_full.png`,
        fullPage: false,
      });

      // --- Check 1: Element count ---
      const elementCount = await page.evaluate((sel) => {
        const container = document.querySelector(sel);
        return container
          ? container.querySelectorAll(".absolute").length
          : 0;
      }, SCENE);
      console.log(`[${targetUrl}] Elements: ${elementCount}`);
      expect(elementCount).toBeGreaterThan(3);

      // --- Check 2: Background colors ---
      const bgInfo = await page.evaluate((sel) => {
        const container = document.querySelector(sel) as HTMLElement;
        const wrapper = container?.parentElement as HTMLElement;
        return {
          containerBg: container
            ? getComputedStyle(container).backgroundColor
            : "none",
          wrapperBg: wrapper
            ? getComputedStyle(wrapper).backgroundColor
            : "none",
        };
      }, SCENE);
      console.log(`[${targetUrl}] BG:`, bgInfo);

      // --- Check 3: Scroll ---
      const viewportHeight = page.viewportSize()?.height || 720;
      const pageHeight = await page.evaluate(
        () => document.documentElement.scrollHeight
      );
      console.log(
        `[${targetUrl}] Page: ${pageHeight}px, Viewport: ${viewportHeight}px`
      );

      if (pageHeight > viewportHeight + 50) {
        // Try programmatic scroll first
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(300);
        const progScroll = await page.evaluate(() => window.scrollY);
        console.log(
          `[${targetUrl}] Programmatic scroll: ${progScroll}px`
        );

        // Reset and try wheel scroll
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);
        await page.mouse.move(640, 360);
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(500);
        const wheelScroll = await page.evaluate(() => window.scrollY);
        console.log(`[${targetUrl}] Wheel scroll: ${wheelScroll}px`);

        if (wheelScroll > 0) {
          console.log(`[${targetUrl}] ✅ WHEEL SCROLL WORKS`);
          await page.screenshot({
            path: `tests/screenshots/${safeName}_scrolled.png`,
            fullPage: false,
          });
        } else if (progScroll > 0) {
          console.log(
            `[${targetUrl}] ⚠️ Programmatic scroll works, wheel doesn't`
          );
        } else {
          console.log(`[${targetUrl}] ❌ SCROLL BROKEN`);
        }

        await page.evaluate(() => window.scrollTo(0, 0));
      } else {
        console.log(`[${targetUrl}] Page fits viewport`);
      }

      // --- Check 4: Compare bg with original ---
      const realPage = await page.context().newPage();
      try {
        await realPage.goto(targetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000,
        });
        await realPage.waitForTimeout(2000);
        const realBg = await realPage.evaluate(() => {
          const bg = getComputedStyle(document.body).backgroundColor;
          const htmlBg =
            getComputedStyle(document.documentElement).backgroundColor;
          const t = (c: string) =>
            !c || c === "rgba(0, 0, 0, 0)" || c === "transparent";
          return !t(bg) ? bg : !t(htmlBg) ? htmlBg : "rgb(255, 255, 255)";
        });
        console.log(
          `[${targetUrl}] BG match: original=${realBg} scene=${bgInfo.containerBg}`
        );
        await realPage.screenshot({
          path: `tests/screenshots/${safeName}_original.png`,
          fullPage: false,
        });
      } catch {
        console.log(`[${targetUrl}] Could not load original`);
      } finally {
        await realPage.close();
      }
    });
  });
}
