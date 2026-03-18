interface RawElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isStatic: boolean;
}

function getArea(el: RawElement): number {
  return el.width * el.height;
}

function overlapRatio(a: RawElement, b: RawElement): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  const overlapArea = (x2 - x1) * (y2 - y1);
  const smallerArea = Math.min(getArea(a), getArea(b));
  return smallerArea > 0 ? overlapArea / smallerArea : 0;
}

export function filterElements(
  elements: RawElement[],
  viewport: { width: number; height: number },
  maxElements: number = 10000,
  pageHeight?: number
): RawElement[] {
  const effectiveHeight = pageHeight || viewport.height;

  const viewportArea = viewport.width * viewport.height;
  const MIN_AREA = viewportArea * 0.0001;

  // 1. Filter out too-small and off-screen elements
  let filtered = elements.filter((el) => {
    if (el.width * el.height < MIN_AREA) return false;
    if (el.x + el.width < 0 || el.y + el.height < 0) return false;
    if (el.x > viewport.width || el.y > effectiveHeight) return false;
    return true;
  });

  // 2. Clamp to page bounds
  filtered = filtered.map((el) => ({
    ...el,
    x: Math.max(0, el.x),
    y: Math.max(0, el.y),
    width: Math.min(el.width, viewport.width - Math.max(0, el.x)),
    height: Math.min(el.height, effectiveHeight - Math.max(0, el.y)),
  }));

  // Filter out elements that became too small after clamping
  filtered = filtered.filter((el) => el.width * el.height >= MIN_AREA);

  // 3. Remove near-exact positional duplicates (within 5px position AND size)
  const deduped: RawElement[] = [];
  for (const el of filtered) {
    const isDuplicate = deduped.some((kept) => {
      const samePos =
        Math.abs(kept.x - el.x) < 5 && Math.abs(kept.y - el.y) < 5;
      const sameSize =
        Math.abs(kept.width - el.width) < 5 &&
        Math.abs(kept.height - el.height) < 5;
      return samePos && sameSize;
    });
    if (isDuplicate) continue;
    deduped.push(el);
  }

  // 4. Remove large elements whose area is mostly covered by kept smaller children.
  //    Process small → large: keep fine pieces, skip redundant containers.
  deduped.sort((a, b) => getArea(a) - getArea(b));
  const kept: RawElement[] = [];
  for (const el of deduped) {
    const elArea = getArea(el);
    if (elArea <= 0) continue;
    let coveredArea = 0;
    for (const k of kept) {
      const ox1 = Math.max(el.x, k.x);
      const oy1 = Math.max(el.y, k.y);
      const ox2 = Math.min(el.x + el.width, k.x + k.width);
      const oy2 = Math.min(el.y + el.height, k.y + k.height);
      if (ox2 > ox1 && oy2 > oy1) coveredArea += (ox2 - ox1) * (oy2 - oy1);
    }
    // Skip if >50% covered by already-kept smaller elements
    if (coveredArea / elArea > 0.5) continue;
    kept.push(el);
  }

  // 5. Sort by page position (top-to-bottom, left-to-right)
  kept.sort((a, b) => a.y - b.y || a.x - b.x);

  // 6. Cap total elements
  return kept.slice(0, maxElements);
}
