"use server";

import { captureUrl } from "@/lib/capture";
import type { CaptureResponse } from "@/lib/types";

export async function capture(
  url: string,
  viewport: { width: number; height: number },
  deviceScaleFactor: number
): Promise<CaptureResponse> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }
  return captureUrl(url, viewport, 1000, deviceScaleFactor);
}
