import { captureUrl } from "@/lib/capture";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return Response.json({ error: "No URL provided" }, { status: 400 });
  }

  const width = parseInt(searchParams.get("width") || "1280", 10);
  const height = parseInt(searchParams.get("height") || "800", 10);
  const dpr = parseFloat(searchParams.get("dpr") || "1");

  const data = await captureUrl(url, { width, height }, 1000, dpr);
  return Response.json(data);
}
