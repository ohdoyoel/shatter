export interface CapturedElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isStatic: boolean; // true = background (stays in place), false = physics body (falls)
}

export interface CaptureResponse {
  viewport: { width: number; height: number };
  pageHeight: number;
  elements: CapturedElement[];
  bodyBgColor: string;
  screenshot: string; // full-page JPEG as data URI
}
