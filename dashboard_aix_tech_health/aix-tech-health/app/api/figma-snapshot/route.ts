// app/api/figma-snapshot/route.ts
import { NextResponse } from "next/server";

const FILE_KEY = process.env.FIGMA_FILE_KEY!;
const NODE_ID  = process.env.FIGMA_NODE_ID!;   // e.g. "1:2"
const TOKEN    = process.env.FIGMA_TOKEN!;

export async function GET() {
  try {
    if (!FILE_KEY || !NODE_ID || !TOKEN) {
      return NextResponse.json(
        {
          error: "Figma env vars missing",
          have: {
            FIGMA_FILE_KEY: !!FILE_KEY,
            FIGMA_NODE_ID:  !!NODE_ID,
            FIGMA_TOKEN:    TOKEN ? `figd_...${TOKEN.slice(-6)}` : false,
          },
        },
        { status: 500 },
      );
    }

    const url = new URL(`https://api.figma.com/v1/images/${FILE_KEY}`);
    url.searchParams.set("ids", NODE_ID);   // ":" will be encoded to %3A
    url.searchParams.set("format", "png");
    url.searchParams.set("scale", "2");

    const res = await fetch(url, {
      headers: { "X-Figma-Token": TOKEN },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Figma API error", status: res.status, detail: text },
        { status: res.status },
      );
    }

    const data = await res.json() as { images?: Record<string, string>, err?: unknown };
    const imageUrl = data?.images?.[NODE_ID];

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Snapshot URL not returned", raw: data },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unhandled error", detail: String(e?.message || e) },
      { status: 500 },
    );
  }
}

