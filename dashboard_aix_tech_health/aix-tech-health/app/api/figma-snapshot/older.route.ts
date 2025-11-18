import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token  = process.env.FIGMA_TOKEN!;
  const file   = process.env.FIGMA_FILE_KEY!;
  const defId  = process.env.FIGMA_NODE_ID!; // e.g., "4:4"

  const { searchParams } = new URL(req.url);
  const node  = searchParams.get("node")  || defId;
  const fmt   = searchParams.get("format") || "png"; // png|svg|jpg|pdf
  const scale = searchParams.get("scale")  || "2";

  const encoded = encodeURIComponent(node);
  const metaUrl = `https://api.figma.com/v1/images/${file}?ids=${encoded}&format=${fmt}&scale=${scale}&use_absolute_bounds=true`;

  const meta = await fetch(metaUrl, { headers: { "X-Figma-Token": token } });
  if (!meta.ok) {
    const detail = await meta.text();
    return NextResponse.json({ error: "Figma API error", detail }, { status: 502 });
  }

  const json = await meta.json();
  const imgUrl = json.images?.[node];
  if (!imgUrl) {
    return NextResponse.json({ error: "Image URL not found", json }, { status: 404 });
  }

  const img = await fetch(imgUrl);
  if (!img.ok) {
    return NextResponse.json({ error: "Failed to fetch image bytes", status: img.status }, { status: 502 });
  }

  const contentType =
    img.headers.get("content-type") ||
    (fmt === "svg" ? "image/svg+xml" : fmt === "pdf" ? "application/pdf" : "image/png");

  const buf = Buffer.from(await img.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}

