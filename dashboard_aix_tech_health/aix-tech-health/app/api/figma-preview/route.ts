import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.FIGMA_TOKEN!;
  const fileKey = process.env.FIGMA_FILE_KEY!;
  const nodeId = process.env.FIGMA_NODE_ID!;      // e.g., "0:1" or "0-1"

  // 1) Ask Figma for PNG export URL for the node
  const res = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    { headers: { "X-Figma-Token": token } }
  );
  if (!res.ok) return NextResponse.json({ error: "figma api error" }, { status: 500 });
  const data = await res.json();
  const imageUrl = data.images?.[nodeId];
  if (!imageUrl) return NextResponse.json({ error: "no image url" }, { status: 404 });

  // 2) Fetch the actual PNG and stream it to the client
  const img = await fetch(imageUrl);
  return new NextResponse(img.body, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
  });
}

