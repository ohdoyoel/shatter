import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { filterElements } from "./element-filter";
import type { CapturedElement, CaptureResponse } from "./types";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Local development: use system Chrome
    const { execSync } = await import("child_process");
    let localChrome = "";
    try {
      localChrome = execSync(
        'find /Applications -name "Google Chrome" -type f -path "*/MacOS/*" 2>/dev/null | head -1'
      )
        .toString()
        .trim();
    } catch {}
    if (!localChrome) {
      localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: localChrome,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
      ],
    });
  }

  return browserInstance;
}

export async function captureUrl(
  url: string,
  viewport = { width: 1280, height: 800 },
  maxElements = 150,
  deviceScaleFactor = 1
): Promise<CaptureResponse> {
  const browser = await getBrowser();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  try {
    await page.setViewport({ ...viewport, deviceScaleFactor });

    // Spoof as real Chrome to prevent sites from serving different content
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    // Force light mode to prevent dark mode from altering page colors
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ]);

    // Try networkidle2 first; fall back to load for sites that keep connections open
    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });
    } catch {
      await page.goto(url, {
        waitUntil: "load",
        timeout: 15000,
      });
    }

    // Wait for meaningful content to render (SPA support)
    await page
      .waitForFunction(
        () => {
          // Check that body has multiple visible descendants with content
          const all = document.querySelectorAll("body *");
          let visibleCount = 0;
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              visibleCount++;
              if (visibleCount >= 5) return true;
            }
          }
          return false;
        },
        { timeout: 10000 }
      )
      .catch(() => {
        // Some minimal pages may never reach 5 visible elements — continue anyway
      });

    // Wait for fonts to load + animations to settle
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll through the entire page to trigger lazy-loaded images
    const scrollHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );
    const viewportHeight = viewport.height;
    for (let y = 0; y < scrollHeight; y += viewportHeight) {
      await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
      await new Promise((r) => setTimeout(r, 300));
    }
    // Scroll back to top and wait for images to finish loading
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 500));

    // Get full page scroll height (may have changed after lazy load)
    const pageHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );

    // Extract body background color
    const bodyBgColor = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
      const isTransparent = (c: string) =>
        !c || c === "rgba(0, 0, 0, 0)" || c === "transparent";
      if (!isTransparent(bg)) return bg;
      if (!isTransparent(htmlBg)) return htmlBg;
      return "rgb(255, 255, 255)";
    });

    // Take full-page JPEG screenshot and convert to data URI
    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 90,
      fullPage: true,
    });
    const screenshotBase64 = Buffer.from(screenshotBuffer).toString("base64");
    const screenshot = `data:image/jpeg;base64,${screenshotBase64}`;

    // Content-based element extraction function.
    // Runs inside browser context (main frame + each iframe).
    // offsetX/offsetY adjust coordinates for iframe position in the page.
    const extractFn = (
      vw: number, vh: number, pageBgColor: string,
      offsetX: number, offsetY: number, idPrefix: string,
    ) => {
      const SKIP_TAGS = new Set([
        "SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "BR", "HR",
      ]);
      const ATOMIC_TAGS = new Set([
        "IMG", "SVG", "VIDEO", "CANVAS",
        "INPUT", "BUTTON", "SELECT", "TEXTAREA", "IFRAME",
      ]);
      const MIN_AREA = vw * vh * 0.0001;

      const elements: {
        id: string; x: number; y: number;
        width: number; height: number; isStatic: boolean;
      }[] = [];
      let idCounter = 0;

      function isVisible(el: Element): boolean {
        const style = window.getComputedStyle(el);
        if (style.display === "none") return false;
        if (style.visibility === "hidden") return false;
        if (style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return true;
        // Zero-size parents can have visible absolute/fixed children
        if (el.children.length > 0 && style.overflow !== "hidden") return true;
        return false;
      }

      function hasDirectText(el: Element): boolean {
        for (const node of el.childNodes) {
          if (
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent?.trim() || "").length > 0
          ) return true;
        }
        return false;
      }

      // Has actual background content (color or image) — not just decoration
      function hasBackground(style: CSSStyleDeclaration): boolean {
        const bg = style.backgroundColor;
        const transparent =
          !bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
        if (!transparent && bg !== pageBgColor) return true;
        if (style.backgroundImage && style.backgroundImage !== "none") return true;
        return false;
      }

      // Has any visual appearance (bg, border, shadow, pseudo-elements)
      function hasVisualStyling(el: Element): boolean {
        const style = window.getComputedStyle(el);
        if (hasBackground(style)) return true;
        const bw =
          (parseFloat(style.borderTopWidth) || 0) +
          (parseFloat(style.borderRightWidth) || 0) +
          (parseFloat(style.borderBottomWidth) || 0) +
          (parseFloat(style.borderLeftWidth) || 0);
        if (bw > 0) return true;
        if (style.boxShadow && style.boxShadow !== "none") return true;
        // Check ::before/::after pseudo-elements
        for (const pseudo of ["::before", "::after"] as const) {
          const ps = window.getComputedStyle(el, pseudo);
          if (ps.content && ps.content !== "none" && ps.content !== "normal") {
            if (hasBackground(ps)) return true;
          }
        }
        return false;
      }

      // Stricter check for styled parents: only bg color/image counts.
      // Border and shadow alone are decorative → would duplicate children.
      function hasBackgroundContent(el: Element): boolean {
        if (hasBackground(window.getComputedStyle(el))) return true;
        for (const pseudo of ["::before", "::after"] as const) {
          const ps = window.getComputedStyle(el, pseudo);
          if (ps.content && ps.content !== "none" && ps.content !== "normal") {
            if (hasBackground(ps)) return true;
          }
        }
        return false;
      }

      function getVisibleChildren(el: Element): Element[] {
        return Array.from(el.children).filter((child) => {
          if (SKIP_TAGS.has(child.tagName.toUpperCase())) return false;
          if (!isVisible(child)) return false;
          // Ignore tiny LEAF accessibility elements (e.g., .blind 1x1px)
          // But keep zero-size containers — they can have absolute children
          const r = child.getBoundingClientRect();
          if ((r.width < 5 || r.height < 5) && child.children.length === 0) return false;
          return true;
        });
      }

      function capture(el: Element): void {
        const rect = el.getBoundingClientRect();
        elements.push({
          id: `${idPrefix}${idCounter++}`,
          x: Math.round(rect.x + offsetX),
          y: Math.round(rect.y + offsetY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          isStatic: false,
        });
      }

      function traverse(el: Element): void {
        const tag = el.tagName.toUpperCase();
        if (SKIP_TAGS.has(tag)) return;
        if (!isVisible(el)) return;
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;

        // Too small to capture, but still recurse children
        // (zero-size containers can have visible absolute/fixed children)
        if (area < MIN_AREA) {
          const children = getVisibleChildren(el);
          if (children.length > 0) { children.forEach(traverse); }
          return;
        }

        // Skip full-width/full-height layout wrappers — recurse only
        if (Math.abs(rect.width - vw) < 2 || Math.abs(rect.height - vh) < 2) {
          const children = getVisibleChildren(el);
          if (children.length > 0) { children.forEach(traverse); }
          return;
        }

        // Atomic: capture as-is (including iframes as fallback blocks)
        if (ATOMIC_TAGS.has(tag)) {
          capture(el);
          return;
        }

        // Has children → recurse for finer pieces
        // Parent backgrounds stay in the screenshot; children become physics bodies
        const children = getVisibleChildren(el);
        if (children.length > 0) {
          // Parent has background → capture as one piece, don't recurse (no duplication)
          // Parent has no background → recurse into children for finer pieces
          if (hasBackgroundContent(el)) {
            capture(el);
            return;
          }
          children.forEach(traverse);
          return;
        }

        // Leaf: capture if has text or visual styling
        if (hasDirectText(el) || hasVisualStyling(el)) {
          capture(el);
        }
      }

      Array.from(document.body.children).forEach(traverse);
      return elements;
    };

    // Extract from main frame
    const rawElements = await page.evaluate(
      extractFn,
      viewport.width, viewport.height, bodyBgColor,
      0, 0, "el-",
    );

    // Try to extract finer pieces from child iframes.
    // If successful, replace the ATOMIC iframe block with the fine pieces.
    const frames = page.frames();
    for (const frame of frames) {
      if (frame === page.mainFrame()) continue;
      try {
        const frameEl = await frame.frameElement();
        if (!frameEl) continue;
        const box = await frameEl.boundingBox();
        if (!box || box.width < 20 || box.height < 20) continue;

        const frameElements = await frame.evaluate(
          extractFn,
          viewport.width, viewport.height, bodyBgColor,
          box.x, box.y, `f${frames.indexOf(frame)}-`,
        );

        if (frameElements.length > 0) {
          // Remove the fallback ATOMIC iframe block from rawElements
          const bx = Math.round(box.x), by = Math.round(box.y);
          const bw = Math.round(box.width), bh = Math.round(box.height);
          for (let i = rawElements.length - 1; i >= 0; i--) {
            const r = rawElements[i];
            if (
              Math.abs(r.x - bx) < 3 && Math.abs(r.y - by) < 3 &&
              Math.abs(r.width - bw) < 3 && Math.abs(r.height - bh) < 3
            ) {
              rawElements.splice(i, 1);
              break;
            }
          }
          rawElements.push(...frameElements);
        }
        // If frameElements is empty, the ATOMIC fallback block stays
      } catch {
        // Failed — the ATOMIC iframe block remains as fallback
      }
    }

    // Filter and deduplicate elements
    const filtered = filterElements(rawElements, viewport, maxElements, pageHeight);

    // Build final CapturedElement array
    const capturedElements: CapturedElement[] = filtered.map((el) => ({
      id: el.id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      isStatic: el.isStatic,
    }));

    return {
      viewport,
      pageHeight,
      elements: capturedElements,
      bodyBgColor,
      screenshot,
    };
  } finally {
    await page.close();
    await context.close();
  }
}
