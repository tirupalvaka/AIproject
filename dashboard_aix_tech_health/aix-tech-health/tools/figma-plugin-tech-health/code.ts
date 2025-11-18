// HTTPS endpoint
const API_URL = "https://aix-voice-service-gbczb3badydydcgu.eastus2-01.azurewebsites.net/api/tech_health_latest;

// old-JS friendly null-coalesce
function coalesce<T>(v: T | null | undefined, fb: T): T {
  return (v === null || v === undefined) ? fb : v;
}

async function setText(node: TextNode | null, text: string) {
  if (!node) return;
  const rng = node.getRangeFontName(0, node.characters.length);
  const fontName: FontName =
    (rng as any) === figma.mixed ? (node.fontName as FontName) : (rng as FontName);
  await figma.loadFontAsync(fontName);
  node.characters = String(text);
}

async function run() {
  try {
    const res = await fetch(API_URL);
    if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "no-response"));
    const data = await res.json();

    const score = coalesce<number>(data && data.score, 0);
    const max   = coalesce<number>(data && data.max, 500);
    const level = coalesce<string>(data && data.level, "");
    const ts    = coalesce<string>(data && data.timestamp, "");

    const page = figma.currentPage;
    const scoreNode = page.findOne(n => n.type === "TEXT"    && n.name === "scoreText") as TextNode | null;
    const levelNode = page.findOne(n => n.type === "TEXT"    && n.name === "levelText") as TextNode | null;
    const timeNode  = page.findOne(n => n.type === "TEXT"    && n.name === "timeText")  as TextNode | null;
    const dialArc   = page.findOne(n => n.type === "ELLIPSE" && n.name === "dialArc")   as EllipseNode | null;

    await setText(scoreNode, score + " / " + max);
    await setText(levelNode, level);
    await setText(timeNode, "Live as of " + ts);

    if (dialArc) {
      var ratio = score / max;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      dialArc.arcData = { startingAngle: 0, endingAngle: 2 * Math.PI * ratio, innerRadius: 0.7 };
    }

    figma.notify("Technical Health updated ✅");
  } catch (e) {
    const msg = (e && (e as any).message) ? (e as any).message : String(e);
    figma.notify("Update failed: " + msg);
  } finally {
    figma.closePlugin();
  }
}
run();
