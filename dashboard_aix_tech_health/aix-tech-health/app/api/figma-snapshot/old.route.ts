// app/api/figma-snapshot/route.ts
import { NextResponse } from "next/server";

const FILE_KEY  = process.env.FIGMA_FILE_KEY!;   // e.g., js4lzhusce9zxhI0bs3KCt
const NODE_ID   = process.env.FIGMA_NODE_ID!;    // e.g., 1:2
const TOKEN     = process.env.FIGMA_TOKEN!;      // figd_...

// Returns a short-lived CDN PNG URL for the node
export async function GET() {
  if (!FILE_KEY || !NODE_ID || !TOKEN) {
    return NextResponse.json({ error: "Figma env vars missing" }, { status: 500 });
  }

  const url = new URL(`https://api.figma.com/v1/images/${FILE_KEY}`);
  url.searchParams.set("ids", NODE_ID);      // API accepts raw 1:2; it will be URL-encoded automatically
  url.searchParams.set("format", "png");
  url.searchParams.set("scale", "2");        // crisp preview

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    // avoid logging token anywhere!
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "Figma API error", detail: text }, { status: 502 });
  }

  const data = await res.json();
  // data.images is a map of nodeId -> signed png url
  const imageUrl = data?.images?.[NODE_ID];
  if (!imageUrl) {
    return NextResponse.json({ error: "Snapshot URL not returned" }, { status: 502 });
  }

  return NextResponse.json({ imageUrl });
}

