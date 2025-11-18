"use strict";

// code.ts
var API_URL = "https://aix-voice-service-gbczb3badydydcgu.eastus2-01.azurewebsites.net/api/tech-health/latest";
function coalesce(v, fb) {
  return v === null || v === void 0 ? fb : v;
}
async function setText(node, text) {
  if (!node) return;
  const rng = node.getRangeFontName(0, node.characters.length);
  const fontName = rng === figma.mixed ? node.fontName : rng;
  await figma.loadFontAsync(fontName);
  node.characters = String(text);
}
async function run() {
  try {
    const res = await fetch(API_URL);
    if (!res || !res.ok) throw new Error("HTTP " + (res ? res.status : "no-response"));
    const data = await res.json();
    const score = coalesce(data && data.score, 0);
    const max = coalesce(data && data.max, 500);
    const level = coalesce(data && data.level, "");
    const ts = coalesce(data && data.timestamp, "");
    const page = figma.currentPage;
    const scoreNode = page.findOne((n) => n.type === "TEXT" && n.name === "scoreText");
    const levelNode = page.findOne((n) => n.type === "TEXT" && n.name === "levelText");
    const timeNode = page.findOne((n) => n.type === "TEXT" && n.name === "timeText");
    const dialArc = page.findOne((n) => n.type === "ELLIPSE" && n.name === "dialArc");
    await setText(scoreNode, score + " / " + max);
    await setText(levelNode, level);
    await setText(timeNode, "Live as of " + ts);
    if (dialArc) {
      var ratio = score / max;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      dialArc.arcData = { startingAngle: 0, endingAngle: 2 * Math.PI * ratio, innerRadius: 0.7 };
    }
    figma.notify("Technical Health updated \u2705");
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    figma.notify("Update failed: " + msg);
  } finally {
    figma.closePlugin();
  }
}
run();
