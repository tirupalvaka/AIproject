// code.js – Figma plugin controller

// Show the UI panel
figma.showUI(__html__, { width: 620, height: 420 });

// Helper: load whatever font the text node is using
async function ensureFontsLoaded(node) {
  if (!node || node.type !== "TEXT") return;

  // Node may have a single font or mixed fonts
  if (node.fontName === figma.mixed) {
    var len = node.characters.length;
    var fonts = node.getRangeAllFontNames(0, len);
    for (var i = 0; i < fonts.length; i++) {
      await figma.loadFontAsync(fonts[i]);
    }
  } else {
    await figma.loadFontAsync(node.fontName);
  }
}

// Helper because figma.fills etc are readonly
function clone(val) {
  return JSON.parse(JSON.stringify(val));
}

// When the UI sends updated data, sync it into the Figma frame
figma.ui.onmessage = async function (msg) {
  if (!msg || msg.type !== "update-score") return;

  var data = msg.payload;
  if (!data) return;

  var total_105 = data.total_105;
  var level = data.level;
  var maturity = data.maturity;
  var customer = data.customer;
  var participant_name = data.participant_name;

  // Expect these layer names in your AI Readiness frame:
  //   AI_SCORE_VALUE           (TEXT)
  //   AI_LEVEL_LABEL           (TEXT)
  //   AI_CUSTOMER_PARTICIPANT  (TEXT)
  //   AI_GAUGE_ARC             (VECTOR/ELLIPSE/RECTANGLE)

  var scoreNode = figma.currentPage.findOne(function (n) {
    return n.type === "TEXT" && n.name === "AI_SCORE_VALUE";
  });

  var levelNode = figma.currentPage.findOne(function (n) {
    return n.type === "TEXT" && n.name === "AI_LEVEL_LABEL";
  });

  var custPartNode = figma.currentPage.findOne(function (n) {
    return n.type === "TEXT" && n.name === "AI_CUSTOMER_PARTICIPANT";
  });

  var arcNode = figma.currentPage.findOne(function (n) {
    return (
      (n.type === "VECTOR" ||
        n.type === "ELLIPSE" ||
        n.type === "RECTANGLE") &&
      n.name === "AI_GAUGE_ARC"
    );
  });

  function levelToColor(lvl) {
    // 5: bright green, 4: green, 3: yellow, 2: orange, 1: red
    switch (lvl) {
      case 5:
        return { r: 0.27, g: 0.78, b: 0.39 }; // #45C463
      case 4:
        return { r: 0.37, g: 0.67, b: 0.3 }; // duller green
      case 3:
        return { r: 0.97, g: 0.84, b: 0.35 }; // yellow
      case 2:
        return { r: 0.98, g: 0.68, b: 0.26 }; // orange
      default:
        return { r: 0.9, g: 0.23, b: 0.23 }; // red
    }
  }

  // --- Update SCORE ---
  if (scoreNode && scoreNode.type === "TEXT") {
    await ensureFontsLoaded(scoreNode);
    var scoreText =
      total_105 !== undefined && total_105 !== null ? String(total_105) : "";
    scoreNode.characters = scoreText;
  }

  // --- Update LEVEL / MATURITY label ---
  if (levelNode && levelNode.type === "TEXT") {
    await ensureFontsLoaded(levelNode);
    var lvl = level !== undefined && level !== null ? level : "";
    var mat =
      maturity !== undefined && maturity !== null ? maturity : "";
    levelNode.characters = "Level " + lvl + " · " + mat;
  }

  // --- Update CUSTOMER / PARTICIPANT label ---
  if (custPartNode && custPartNode.type === "TEXT") {
    await ensureFontsLoaded(custPartNode);
    var cust = customer || "";
    var part = participant_name || "";
    custPartNode.characters = "Customer: " + cust + " · Participant: " + part;
  }

  // --- Update GAUGE ARC color ---
  if (arcNode) {
    var color = levelToColor(level);
    var fills = clone(arcNode.fills);
    if (fills && fills.length > 0) {
      fills[0].color = color;
      arcNode.fills = fills;
    }
  }
};

