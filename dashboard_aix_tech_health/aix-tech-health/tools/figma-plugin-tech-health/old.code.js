"use strict";

// code.ts
var API_URL = "https://<your-func>.azurewebsites.net/api/tech-health/latest";
async function setText(node, text) {
  if (!node) return;
  const font = node.getRangeFontName(0, node.characters.length);
  const fontName = font === figma.mixed ? node.fontName : font;
  await figma.loadFontAsync(fontName);
  node.characters = text;
}
async function run() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const score = data.score ?? 0;
    const max = data.max ?? 500;
    const level = data.level ?? "";
    const timestamp = data.timestamp ?? "";
    const page = figma.currentPage;
    const scoreNode = page.findOne((n) => n.name === "scoreText" && n.type === "TEXT");
    const levelNode = page.findOne((n) => n.name === "levelText" && n.type === "TEXT");
    const timeNode = page.findOne((n) => n.name === "timeText" && n.type === "TEXT");
    const dialArc = page.findOne((n) => n.name === "dialArc" && n.type === "ELLIPSE");
    await setText(scoreNode, `${score} / ${max}`);
    await setText(levelNode, level);
    await setText(timeNode, `Live as of ${timestamp}`);
    if (dialArc) {
      const ratio = Math.max(0, Math.min(1, score / max));
      dialArc.arcData = {
        startingAngle: 0,
        endingAngle: 2 * Math.PI * ratio,
        innerRadius: 0.7
      };
    }
    figma.notify("Technical Health updated from ADX \u2705");
  } catch (e) {
    figma.notify(`Update failed: ${e.message}`);
  } finally {
    figma.closePlugin();
  }
}
run();
