import { test, expect } from "@playwright/test";

/**
 * Tests for two known issues with naver.com rendering in Shatter:
 *
 * 1. OVERLAPPING/DUPLICATED ELEMENTS:
 *    Container DIVs (isContainer=true) render their full HTML (including children)
 *    at zIndex:0. Those same children are ALSO rendered as separate physics elements
 *    at zIndex:1. Before shatter triggers, the children are visible TWICE: once
 *    inside the container's HTML and once as overlaid physics elements.
 *
 * 2. SEARCH BAR CLIPPING:
 *    Element wrappers in PhysicsScene.tsx use `overflow: hidden` (line 225).
 *    Additionally, globals.css forces `overflow: hidden !important` on all
 *    descendants of physics scene elements (lines 11-16). If the captured
 *    bounding box is slightly too small, the search input gets clipped.
 */

const BASE = "http://localhost:3000";
const SCENE = '[data-testid="physics-scene"]';

test.describe("Naver.com rendering issues", () => {
  test.setTimeout(120_000);

  let captureData: any;

  test("capture naver.com and detect element overlap before shatter", async ({
    page,
  }) => {
    // Navigate to shatter page for naver.com
    await page.goto(
      `${BASE}/shatter?url=${encodeURIComponent("https://naver.com")}`,
      { timeout: 60_000 }
    );

    // Wait for the physics scene to render elements (not just the loading spinner)
    await page.waitForSelector(`${SCENE} .absolute`, { timeout: 60_000 });

    // Brief pause to let initial rendering settle but BEFORE shatter triggers
    // (shatter waits for images to load, so we have a window)
    await page.waitForTimeout(1000);

    // Take a pre-shatter screenshot for visual inspection
    await page.screenshot({
      path: "tests/screenshots/naver_pre_shatter.png",
      fullPage: false,
    });

    // ========================================================================
    // TEST 1: Detect duplicate/overlapping elements
    // ========================================================================

    // Fetch the capture data from the physics scene's underlying JSON.
    // We check: for each container DIV, are there separate physics elements
    // (non-container) that overlap spatially with the container's children?
    const overlapAnalysis = await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return { error: "No physics scene found" };

      const wrappers = Array.from(container.querySelectorAll(":scope > .absolute")) as HTMLElement[];

      // Separate containers (zIndex 0) from physics elements (zIndex 1)
      const containers: { el: HTMLElement; rect: DOMRect }[] = [];
      const physicsEls: { el: HTMLElement; rect: DOMRect }[] = [];

      for (const w of wrappers) {
        const z = parseInt(w.style.zIndex || "0", 10);
        const rect = w.getBoundingClientRect();
        if (z === 0) {
          containers.push({ el: w, rect });
        } else {
          physicsEls.push({ el: w, rect });
        }
      }

      // For each physics element, check if it overlaps spatially with a
      // container element. If a physics element sits on top of a container
      // at nearly the same position, the content is visually duplicated.
      let overlapCount = 0;
      const overlappingPairs: {
        physicsRect: { x: number; y: number; w: number; h: number };
        containerRect: { x: number; y: number; w: number; h: number };
        overlapRatio: number;
      }[] = [];

      for (const phys of physicsEls) {
        for (const cont of containers) {
          // Check if physics element is mostly inside this container
          const ix1 = Math.max(phys.rect.left, cont.rect.left);
          const iy1 = Math.max(phys.rect.top, cont.rect.top);
          const ix2 = Math.min(phys.rect.right, cont.rect.right);
          const iy2 = Math.min(phys.rect.bottom, cont.rect.bottom);

          if (ix2 <= ix1 || iy2 <= iy1) continue;

          const intersection = (ix2 - ix1) * (iy2 - iy1);
          const physArea = phys.rect.width * phys.rect.height;
          if (physArea === 0) continue;

          const ratio = intersection / physArea;

          // If the physics element is >80% inside a container, it's likely
          // a duplicate of something already rendered in the container's HTML
          if (ratio > 0.8) {
            overlapCount++;
            if (overlappingPairs.length < 10) {
              overlappingPairs.push({
                physicsRect: {
                  x: Math.round(phys.rect.x),
                  y: Math.round(phys.rect.y),
                  w: Math.round(phys.rect.width),
                  h: Math.round(phys.rect.height),
                },
                containerRect: {
                  x: Math.round(cont.rect.x),
                  y: Math.round(cont.rect.y),
                  w: Math.round(cont.rect.width),
                  h: Math.round(cont.rect.height),
                },
                overlapRatio: Math.round(ratio * 100) / 100,
              });
            }
          }
        }
      }

      return {
        totalWrappers: wrappers.length,
        containerCount: containers.length,
        physicsElementCount: physicsEls.length,
        overlapCount,
        overlappingPairs,
      };
    }, SCENE);

    console.log("[Naver Overlap Analysis]", JSON.stringify(overlapAnalysis, null, 2));

    // ASSERTION: There should be overlapping elements (confirming the bug exists).
    // Container DIVs keep their full children HTML AND those children are also
    // rendered as separate physics elements on top, creating visual duplication.
    expect(overlapAnalysis).not.toHaveProperty("error");
    expect(overlapAnalysis.containerCount).toBeGreaterThan(0);
    expect(overlapAnalysis.physicsElementCount).toBeGreaterThan(0);

    // The bug: many physics elements overlap with containers, causing duplication
    // We expect a significant number of overlaps as evidence of the bug
    console.log(
      `[Naver] ${overlapAnalysis.overlapCount} physics elements overlap with containers ` +
        `(out of ${overlapAnalysis.physicsElementCount} physics elements)`
    );
    expect(overlapAnalysis.overlapCount).toBeGreaterThan(5);

    // Also verify that containers have visible children (the source of duplication)
    const containersWithVisibleChildren = await page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return 0;

      const wrappers = Array.from(container.querySelectorAll(":scope > .absolute")) as HTMLElement[];
      let count = 0;

      for (const w of wrappers) {
        const z = parseInt(w.style.zIndex || "0", 10);
        if (z !== 0) continue; // only check containers

        // Check if the container's inner HTML div has visible child elements
        const innerDiv = w.querySelector(":scope > div");
        if (!innerDiv) continue;

        const visibleChildren = Array.from(innerDiv.querySelectorAll("*")).filter((child) => {
          const rect = child.getBoundingClientRect();
          return rect.width > 2 && rect.height > 2;
        });

        if (visibleChildren.length > 0) count++;
      }

      return count;
    }, SCENE);

    console.log(
      `[Naver] ${containersWithVisibleChildren} container DIVs have visible children ` +
        `(these children also appear as separate physics elements = duplication)`
    );
    expect(containersWithVisibleChildren).toBeGreaterThan(0);
  });

  test("detect search bar clipping on naver.com", async ({ page }) => {
    // Navigate to shatter page for naver.com
    await page.goto(
      `${BASE}/shatter?url=${encodeURIComponent("https://naver.com")}`,
      { timeout: 60_000 }
    );

    // Wait for the physics scene to render
    await page.waitForSelector(`${SCENE} .absolute`, { timeout: 60_000 });
    await page.waitForTimeout(1000);

    // ========================================================================
    // TEST 2: Search bar clipping
    // ========================================================================

    // Find the search input element within the physics scene.
    // Naver's search bar is an <input> inside a wrapper with overflow:hidden.
    const searchBarAnalysis = await page.evaluate((sel) => {
      const scene = document.querySelector(sel);
      if (!scene) return { error: "No physics scene found" };

      // Find all elements that look like search inputs
      const allWrappers = Array.from(scene.querySelectorAll(":scope > .absolute")) as HTMLElement[];
      const searchCandidates: {
        wrapperRect: { x: number; y: number; w: number; h: number };
        inputRect: { x: number; y: number; w: number; h: number } | null;
        wrapperOverflow: string;
        isClipped: boolean;
        clipAmount: { right: number; bottom: number };
        wrapperZIndex: string;
      }[] = [];

      for (const wrapper of allWrappers) {
        // Look for input elements inside this wrapper
        const inputs = wrapper.querySelectorAll("input");
        if (inputs.length === 0) continue;

        for (const input of inputs) {
          const wRect = wrapper.getBoundingClientRect();
          const iRect = input.getBoundingClientRect();

          // Check if this is likely a search input (reasonable size, near top of page)
          if (iRect.width < 100 || iRect.top > 300) continue;

          const clipRight = Math.max(0, iRect.right - wRect.right);
          const clipBottom = Math.max(0, iRect.bottom - wRect.bottom);
          const clipLeft = Math.max(0, wRect.left - iRect.left);
          const clipTop = Math.max(0, wRect.top - iRect.top);
          const isClipped = clipRight > 2 || clipBottom > 2 || clipLeft > 2 || clipTop > 2;

          searchCandidates.push({
            wrapperRect: {
              x: Math.round(wRect.x),
              y: Math.round(wRect.y),
              w: Math.round(wRect.width),
              h: Math.round(wRect.height),
            },
            inputRect: {
              x: Math.round(iRect.x),
              y: Math.round(iRect.y),
              w: Math.round(iRect.width),
              h: Math.round(iRect.height),
            },
            wrapperOverflow: wrapper.style.overflow || "not set",
            isClipped,
            clipAmount: {
              right: Math.round(Math.max(0, iRect.right - wRect.right)),
              bottom: Math.round(Math.max(0, iRect.bottom - wRect.bottom)),
            },
            wrapperZIndex: wrapper.style.zIndex || "not set",
          });
        }
      }

      // Also check: are there any elements with overflow:hidden that clip their content?
      const overflowHiddenClippers: {
        wrapperPos: { x: number; y: number; w: number; h: number };
        childOverflow: { right: number; bottom: number };
        childTag: string;
      }[] = [];

      for (const wrapper of allWrappers) {
        if (wrapper.style.overflow !== "hidden") continue;

        const innerDiv = wrapper.querySelector(":scope > div");
        if (!innerDiv) continue;

        const wRect = wrapper.getBoundingClientRect();

        // Check all direct visible children of the inner content div
        for (const child of innerDiv.children) {
          const cRect = child.getBoundingClientRect();
          if (cRect.width === 0 || cRect.height === 0) continue;

          const overflowRight = cRect.right - wRect.right;
          const overflowBottom = cRect.bottom - wRect.bottom;

          if (overflowRight > 5 || overflowBottom > 5) {
            overflowHiddenClippers.push({
              wrapperPos: {
                x: Math.round(wRect.x),
                y: Math.round(wRect.y),
                w: Math.round(wRect.width),
                h: Math.round(wRect.height),
              },
              childOverflow: {
                right: Math.round(overflowRight),
                bottom: Math.round(overflowBottom),
              },
              childTag: child.tagName,
            });
            if (overflowHiddenClippers.length >= 10) break;
          }
        }
        if (overflowHiddenClippers.length >= 10) break;
      }

      return {
        searchCandidates,
        overflowHiddenClippers,
        totalWrappersWithOverflowHidden: allWrappers.filter(
          (w) => w.style.overflow === "hidden"
        ).length,
        totalWrappers: allWrappers.length,
      };
    }, SCENE);

    console.log("[Naver Search Bar Analysis]", JSON.stringify(searchBarAnalysis, null, 2));

    expect(searchBarAnalysis).not.toHaveProperty("error");

    // All wrappers have overflow:hidden (set in PhysicsScene.tsx line 225)
    console.log(
      `[Naver] ${searchBarAnalysis.totalWrappersWithOverflowHidden} / ` +
        `${searchBarAnalysis.totalWrappers} wrappers have overflow:hidden`
    );
    // Every wrapper should have overflow:hidden (the cause of clipping)
    expect(searchBarAnalysis.totalWrappersWithOverflowHidden).toBe(
      searchBarAnalysis.totalWrappers
    );

    // Log search input findings
    if (searchBarAnalysis.searchCandidates.length > 0) {
      for (const candidate of searchBarAnalysis.searchCandidates) {
        console.log(
          `[Naver] Search input: wrapper=${JSON.stringify(candidate.wrapperRect)}, ` +
            `input=${JSON.stringify(candidate.inputRect)}, ` +
            `clipped=${candidate.isClipped}, clipAmount=${JSON.stringify(candidate.clipAmount)}`
        );
      }
    } else {
      console.log("[Naver] No search input candidates found - search bar may be fully clipped or not captured as INPUT");
    }

    // Log overflow clipping findings
    if (searchBarAnalysis.overflowHiddenClippers.length > 0) {
      console.log(
        `[Naver] ${searchBarAnalysis.overflowHiddenClippers.length} elements are clipped by overflow:hidden`
      );
    }

    // Take a focused screenshot of the search bar area (top portion of the page)
    await page.screenshot({
      path: "tests/screenshots/naver_search_area.png",
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 200 },
    });
  });

  test("compare naver.com element counts: containers vs physics elements", async ({
    page,
  }) => {
    // This test captures the raw data to quantify the duplication problem
    await page.goto(
      `${BASE}/shatter?url=${encodeURIComponent("https://naver.com")}`,
      { timeout: 60_000 }
    );

    await page.waitForSelector(`${SCENE} .absolute`, { timeout: 60_000 });
    await page.waitForTimeout(1000);

    // Extract the capture data to analyze the container/physics element split
    const elementStats = await page.evaluate((sel) => {
      const scene = document.querySelector(sel);
      if (!scene) return { error: "No physics scene found" };

      const wrappers = Array.from(scene.querySelectorAll(":scope > .absolute")) as HTMLElement[];

      let containers = 0;
      let physicsElements = 0;
      let containersWithChildren = 0;

      // Track spatial regions
      const containerRegions: { x: number; y: number; w: number; h: number; childCount: number }[] = [];

      for (const w of wrappers) {
        const z = parseInt(w.style.zIndex || "0", 10);
        const rect = w.getBoundingClientRect();

        if (z === 0) {
          containers++;
          const innerDiv = w.querySelector(":scope > div");
          const childElems = innerDiv
            ? Array.from(innerDiv.querySelectorAll("*")).filter((c) => {
                const cr = c.getBoundingClientRect();
                return cr.width > 2 && cr.height > 2;
              })
            : [];
          if (childElems.length > 0) {
            containersWithChildren++;
            containerRegions.push({
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height),
              childCount: childElems.length,
            });
          }
        } else {
          physicsElements++;
        }
      }

      return {
        totalElements: wrappers.length,
        containers,
        physicsElements,
        containersWithChildren,
        topContainersByChildren: containerRegions
          .sort((a, b) => b.childCount - a.childCount)
          .slice(0, 5),
      };
    }, SCENE);

    console.log("[Naver Element Stats]", JSON.stringify(elementStats, null, 2));

    expect(elementStats).not.toHaveProperty("error");

    // Report the duplication scale
    console.log(
      `[Naver] Total: ${elementStats.totalElements} elements ` +
        `(${elementStats.containers} containers + ${elementStats.physicsElements} physics elements)`
    );
    console.log(
      `[Naver] ${elementStats.containersWithChildren} containers have visible children ` +
        `whose content is ALSO rendered as separate physics elements (= duplication source)`
    );

    // The duplication is significant: many containers have children
    expect(elementStats.containersWithChildren).toBeGreaterThan(0);
    expect(elementStats.containers).toBeGreaterThan(0);
    expect(elementStats.physicsElements).toBeGreaterThan(0);
  });
});
