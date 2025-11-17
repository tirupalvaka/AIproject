// code.js – Figma plugin controller

// Show the UI panel
figma.showUI(__html__, { width: 320, height: 220 });

// When the UI sends updated data, sync it into the Figma frame
figma.ui.onmessage = (msg) => {
  if (msg.type !== "update-score") return;

  const data = msg.payload;
  if (!data) return;

  const { total_105, level, maturity, customer, participant_name } = data;

  // Expect these layer names in your AI Readiness frame:
  //   AI_SCORE_VALUE        (TEXT)
  //   AI_LEVEL_LABEL        (TEXT)
  //   AI_CUSTOMER_PARTICIPANT (TEXT)
  //   AI_GAUGE_ARC          (VECTOR/ELLIPSE etc for colored arc)

  const scoreNode = figma.currentPage.findOne(
    (n) => n.type === "TEXT" && n.name === "AI_SCORE_VALUE"
  );
  const levelNode = figma.currentPage.findOne(
    (n) => n.type === "TEXT" && n.name === "AI_LEVEL_LABEL"
  );
  const custPartNode = figma.currentPage.findOne(
    (n) => n.type === "TEXT" && n.name === "AI_CUSTOMER_PARTICIPANT"
  );
  const arcNode = figma.currentPage.findOne(
    (n) => (n.type === "VECTOR" || n.type === "ELLIPSE" || n.type === "RECTANGLE") &&
           n.name === "AI_GAUGE_ARC"
  );

  function levelToColor(lvl) {
    // 5: bright green, 4: green, 3: yellow, 2: orange, 1: red
    switch (lvl) {
      case 5: return { r: 0.27, g: 0.78, b: 0.39 }; // #45C463
      case 4: return { r: 0.37, g: 0.67, b: 0.30 }; // duller green
      case 3: return { r: 0.97, g: 0.84, b: 0.35 }; // yellow
      case 2: return { r: 0.98, g: 0.68, b: 0.26 }; // orange
      default: return { r: 0.90, g: 0.23, b: 0.23 }; // red
    }
  }

  if (scoreNode && scoreNode.type === "TEXT") {
    scoreNode.characters = String(total_105 ?? "");
  }

  if (levelNode && levelNode.type === "TEXT") {
    const lvl = level ?? "";
    const mat = maturity ?? "";
    levelNode.characters = `Level ${lvl} · ${mat}`;
  }

  if (custPartNode && custPartNode.type === "TEXT") {
    const cust = customer || "";
    const part = participant_name || "";
    custPartNode.characters = `Customer: ${cust} · Participant: ${part}`;
  }

  if (arcNode) {
    const color = levelToColor(level);
    const fills = clone(arcNode.fills);
    if (Array.isArray(fills) && fills.length > 0) {
      fills[0].color = color;
      arcNode.fills = fills;
    }
  }
};

// Helper because figma.fills etc are readonly
function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

