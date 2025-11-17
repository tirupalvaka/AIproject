// code.js — Digital Readiness Live (pure JavaScript)

// Show UI
figma.showUI(__html__, { width: 360, height: 360 });

function sendStatus(text, isError) {
  figma.ui.postMessage({
    type: "status",
    text,
    error: !!isError,
  });
}

function findTextByName(container, name) {
  return container.findOne(n => n.type === "TEXT" && n.name === name);
}

// Safely set text on existing node (any font)
async function setText(node, value) {
  if (!node) return;
  const fontName = node.fontName;
  if (fontName === figma.mixed) return;
  await figma.loadFontAsync(fontName);
  node.characters = String(value);
}

// Color based on level
function getLevelColor(level) {
  if (level <= 1) {
    return { r: 239 / 255, g: 68 / 255, b: 68 / 255 };      // red
  }
  if (level === 2) {
    return { r: 251 / 255, g: 191 / 255, b: 36 / 255 };     // amber
  }
  if (level === 3) {
    return { r: 163 / 255, g: 230 / 255, b: 53 / 255 };     // lime
  }
  return { r: 16 / 255, g: 185 / 255, b: 129 / 255 };       // emerald
}

function getInterpretation(level, percent, maturity) {
  var p = Math.round(percent || 0);
  var label = maturity || "Digital readiness";

  switch (level) {
    case 1:
      return label + " is at Level 1 (Initial). Foundations are emerging; focus on basic digital capabilities and governance.";
    case 2:
      return label + " is at Level 2 (Developing). Some structured initiatives exist; expand consistency and coverage across the organization.";
    case 3:
      return label + " is at Level 3 (Established). Core capabilities are in place; prioritize scaling automation and integration end-to-end.";
    case 4:
      return label + " is at Level 4 (Advanced). Strong digital alignment with good automation and insight; focus on continuous optimisation and innovation.";
    case 5:
      return label + " is at Level 5 (Leading). You are operating as a digital leader; maintain innovation velocity and share best practices.";
    default:
      return "Digital readiness has been scored at " + p + "%. Continue maturing capabilities to move towards advanced and leading levels.";
  }
}

// Ensure text node in card
function ensureCardText(parent, name, fontSize, opacity, lineHeight) {
  var node = parent.findOne(n => n.type === "TEXT" && n.name === name);
  if (!node) {
    node = figma.createText();
    node.name = name;
    parent.appendChild(node);
  }
  node.fontName = { family: "Inter", style: "Regular" };
  node.fontSize = fontSize;
  node.opacity = opacity;
  node.lineHeight = { unit: "AUTO" };
  if (lineHeight) {
    node.lineHeight = { unit: "PIXELS", value: lineHeight };
  }
  return node;
}

// Build / update Digital Readiness Card
async function buildOrUpdateCard(frame, metrics) {
  const customer = metrics.customer;
  const participant = metrics.participant;
  const score = metrics.score;
  const max = metrics.max;
  const percent = metrics.percent;
  const level = metrics.level;
  const maturity = metrics.maturity;
  const timestamp = metrics.timestamp;

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  var card = frame.findOne(n => n.type === "FRAME" && n.name === "DigitalReadinessCard");
  if (!card) {
    card = figma.createFrame();
    card.name = "DigitalReadinessCard";
    frame.appendChild(card);

    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "AUTO";
    card.counterAxisSizingMode = "AUTO";
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.itemSpacing = 12;
    card.cornerRadius = 16;
    card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    card.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.89, b: 0.95 } }];
    card.strokeWeight = 1;
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 4 },
      radius: 16,
      visible: true,
      blendMode: "NORMAL"
    }];
  }

  // Title
  var title = ensureCardText(card, "CardTitle", 20, 1.0, 24);
  title.characters = "Digital Readiness";

  // Top row
  var topRow = card.findOne(n => n.type === "FRAME" && n.name === "CardTopRow");
  if (!topRow) {
    topRow = figma.createFrame();
    topRow.name = "CardTopRow";
    card.appendChild(topRow);
    topRow.layoutMode = "HORIZONTAL";
    topRow.primaryAxisSizingMode = "AUTO";
    topRow.counterAxisSizingMode = "AUTO";
    topRow.itemSpacing = 24;
    topRow.counterAxisAlignItems = "CENTER";
  }

  // Dial frame
  var dialFrame = topRow.findOne(n => n.type === "FRAME" && n.name === "DialFrame");
  if (!dialFrame) {
    dialFrame = figma.createFrame();
    dialFrame.name = "DialFrame";
    topRow.appendChild(dialFrame);
    dialFrame.layoutMode = "NONE";
    dialFrame.clipsContent = false;
    dialFrame.primaryAxisSizingMode = "FIXED";
    dialFrame.counterAxisSizingMode = "FIXED";
    dialFrame.resize(160, 160);
  }

  // Background ring
  var bgRing = dialFrame.findOne(n => n.type === "ELLIPSE" && n.name === "DialBg");
  if (!bgRing) {
    bgRing = figma.createEllipse();
    bgRing.name = "DialBg";
    dialFrame.appendChild(bgRing);
    bgRing.resize(160, 160);
  }
  bgRing.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.94, b: 0.96 } }];
  bgRing.strokeWeight = 0;
  bgRing.arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: 3 * Math.PI / 2,
    innerRadius: 0.75
  };
  bgRing.x = 0;
  bgRing.y = 0;

  // Foreground ring
  var fgRing = dialFrame.findOne(n => n.type === "ELLIPSE" && n.name === "DialArc");
  if (!fgRing) {
    fgRing = figma.createEllipse();
    fgRing.name = "DialArc";
    dialFrame.appendChild(fgRing);
    fgRing.resize(160, 160);
  }
  var clamped = Math.max(0, Math.min(100, percent || 0));
  var levelColor = getLevelColor(level || 0);
  fgRing.fills = [{ type: "SOLID", color: levelColor }];
  fgRing.strokeWeight = 0;
  fgRing.arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: -Math.PI / 2 + (2 * Math.PI * clamped) / 100,
    innerRadius: 0.75
  };
  fgRing.x = 0;
  fgRing.y = 0;

  // Dial score
  var dialScore = dialFrame.findOne(n => n.type === "TEXT" && n.name === "DialScoreText");
  if (!dialScore) {
    dialScore = figma.createText();
    dialScore.name = "DialScoreText";
    dialFrame.appendChild(dialScore);
  }
  dialScore.fontName = { family: "Inter", style: "Regular" };
  dialScore.fontSize = 32;
  dialScore.opacity = 1.0;
  await setText(dialScore, Math.round(clamped));
  dialScore.x = 160 / 2 - dialScore.width / 2;
  dialScore.y = 160 / 2 - dialScore.height / 2 - 6;

  // Dial range
  var dialRange = dialFrame.findOne(n => n.type === "TEXT" && n.name === "DialRangeText");
  if (!dialRange) {
    dialRange = figma.createText();
    dialRange.name = "DialRangeText";
    dialFrame.appendChild(dialRange);
  }
  dialRange.fontName = { family: "Inter", style: "Regular" };
  dialRange.fontSize = 10;
  dialRange.opacity = 0.6;
  await setText(dialRange, "0 | " + (max || 140));
  dialRange.x = 160 / 2 - dialRange.width / 2;
  dialRange.y = 160 / 2 + dialRange.height / 2 + 4;

  // Metrics column
  var metricsCol = topRow.findOne(n => n.type === "FRAME" && n.name === "CardMetricsCol");
  if (!metricsCol) {
    metricsCol = figma.createFrame();
    metricsCol.name = "CardMetricsCol";
    topRow.appendChild(metricsCol);
    metricsCol.layoutMode = "VERTICAL";
    metricsCol.primaryAxisSizingMode = "AUTO";
    metricsCol.counterAxisSizingMode = "AUTO";
    metricsCol.itemSpacing = 8;
  }

  var whoText = ensureCardText(metricsCol, "CardWho", 12, 0.8, 16);
  whoText.characters = customer + " — " + participant;

  var pctLabel = ensureCardText(metricsCol, "CardPctLabel", 10, 0.6, 14);
  pctLabel.characters = "PERCENTAGE";

  var pctValue = ensureCardText(metricsCol, "CardPctValue", 14, 1.0, 18);
  pctValue.characters = (percent || 0).toFixed(2) + " / 100";

  var levelLabel = ensureCardText(metricsCol, "CardLevelLabel", 10, 0.6, 14);
  levelLabel.characters = "MATURITY LEVEL";

  var levelValue = ensureCardText(metricsCol, "CardLevelValue", 14, 1.0, 18);
  levelValue.characters =
    "Level " + (level || "—") + (maturity ? " · " + maturity : "");

  var rawLabel = ensureCardText(metricsCol, "CardRawLabel", 10, 0.6, 14);
  rawLabel.characters = "RAW SCORE";

  var rawValue = ensureCardText(metricsCol, "CardRawValue", 14, 1.0, 18);
  rawValue.characters = score + " / " + (max || 140);

  var interp = ensureCardText(card, "CardInterpretation", 11, 0.8, 16);
  interp.characters = getInterpretation(level || 0, percent || 0, maturity);

  var updated = ensureCardText(card, "CardUpdatedLine", 10, 0.6, 14);
  var tsDisplay = timestamp ? "Last updated: " + timestamp : "Last updated: --";
  updated.characters = tsDisplay;
}

// Listen for UI messages
figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "apply-digital-readiness") return;

  try {
    const customer = msg.customer;
    const participant = msg.participant;
    const apiBase = msg.apiBase;

    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== "FRAME") {
      sendStatus("Error: Select exactly one frame before running the plugin.", true);
      return;
    }
    const frame = selection[0];

    const base = apiBase.replace(/\/$/, "");
    const url =
      base +
      "/api/digital_readiness_latest_live?customer=" +
      encodeURIComponent(customer) +
      "&participant=" +
      encodeURIComponent(participant);

    // HTTP call via Figma API
    const responseText = await figma.requestHTTPsAsync(url, { method: "GET" });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      sendStatus("Error: Could not parse API response as JSON.", true);
      return;
    }

    const score = Number(data.score || 0);
    const max = Number(data.max || 140);
    const percent = typeof data.percent === "number"
      ? data.percent
      : max ? (score / max) * 100 : 0;
    const level = data.level || 0;
    const maturity = data.maturity || "";
    const timestamp = data.timestamp || "";

    const metrics = {
      customer,
      participant,
      score,
      max,
      percent,
      level,
      maturity,
      timestamp,
    };

    // Update legacy text layers if they exist
    const scoreNode = findTextByName(frame, "DigitalScore");
    const percentNode = findTextByName(frame, "DigitalPercent");
    const levelNode = findTextByName(frame, "DigitalLevel");
    const rawNode = findTextByName(frame, "DigitalRaw");
    const updatedNode = findTextByName(frame, "DigitalUpdated");

    await Promise.all([
      setText(scoreNode, score),
      setText(percentNode, percent.toFixed(2) + " / 100"),
      setText(
        levelNode,
        "Level " + (level || "—") + (maturity ? " · " + maturity : "")
      ),
      setText(rawNode, score + " / " + max),
      setText(
        updatedNode,
        timestamp ? "Last updated: " + timestamp : "Last updated: --"
      ),
    ]);

    // Build / update card
    await buildOrUpdateCard(frame, metrics);

    sendStatus("Updated successfully ✔", false);
  } catch (err) {
    sendStatus(
      "Error: " + (err && err.message ? err.message : String(err)),
      true
    );
  }
};

