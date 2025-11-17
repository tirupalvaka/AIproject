// code.ts – Digital Readiness Live card

type DigitalReadinessResponse = {
  score: number;      // raw 0–140
  max: number;        // 140
  percent: number;    // 0–100
  level: number;      // 1–5
  maturity: string;   // Not Started / Initial / ...
  timestamp: string;  // ISO string
};

figma.showUI(__html__, { width: 360, height: 320 });

function postStatus(text: string, error = false) {
  figma.ui.postMessage({
    type: "status",
    text,
    error
  });
}

function getRingColor(level: number): RGB {
  // Tailwind-ish colors
  if (level <= 1) {
    // red-500
    return { r: 220 / 255, g: 38 / 255, b: 38 / 255 };
  }
  if (level === 2) {
    // amber-400
    return { r: 245 / 255, g: 158 / 255, b: 11 / 255 };
  }
  if (level === 3) {
    // lime-400
    return { r: 132 / 255, g: 204 / 255, b: 22 / 255 };
  }
  // level 4+ – emerald-500
  return { r: 16 / 255, g: 185 / 255, b: 129 / 255 };
}

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

// Build the full card UI inside the selected frame
async function buildCard(
  frame: FrameNode,
  data: DigitalReadinessResponse,
  customer: string,
  participant: string
) {
  const score = data.score ?? 0;
  const max = data.max ?? 140;
  const pct = data.percent ?? (max ? (score / max) * 100 : 0);
  const clamped = Math.max(0, Math.min(100, pct));
  const level = data.level ?? 0;
  const maturity = data.maturity ?? "";
  const lastUpdated = data.timestamp
    ? new Date(data.timestamp).toLocaleString()
    : "--";

  // Card styling on selected frame
  frame.name = "Digital Readiness Card";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.itemSpacing = 20;
  frame.cornerRadius = 24;
  frame.fills = [
    {
      type: "SOLID",
      color: { r: 1, g: 1, b: 1 }
    }
  ];
  frame.strokes = [
    {
      type: "SOLID",
      color: { r: 229 / 255, g: 231 / 255, b: 235 / 255 }
    }
  ];
  frame.strokeWeight = 1;
  frame.effects = [
    {
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 6 },
      radius: 18,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    } as DropShadowEffect
  ];

  // Clear any existing children
  for (const child of frame.children) {
    child.remove();
  }

  // ---------- Title ----------
  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Semi Bold" };
  title.characters = "Digital Readiness";
  title.fontSize = 20;
  title.fills = [
    {
      type: "SOLID",
      color: { r: 17 / 255, g: 24 / 255, b: 39 / 255 }
    }
  ];
  frame.appendChild(title);

  // ---------- Content row: dial + details ----------
  const contentRow = figma.createFrame();
  contentRow.name = "Content";
  contentRow.layoutMode = "HORIZONTAL";
  contentRow.primaryAxisSizingMode = "AUTO";
  contentRow.counterAxisSizingMode = "AUTO";
  contentRow.counterAxisAlignItems = "CENTER";
  contentRow.itemSpacing = 24;
  contentRow.fills = [];
  contentRow.strokes = [];
  frame.appendChild(contentRow);

  // ===== Dial side =====
  const dialColumn = figma.createFrame();
  dialColumn.name = "DialColumn";
  dialColumn.layoutMode = "VERTICAL";
  dialColumn.primaryAxisSizingMode = "AUTO";
  dialColumn.counterAxisSizingMode = "AUTO";
  dialColumn.counterAxisAlignItems = "CENTER";
  dialColumn.itemSpacing = 12;
  dialColumn.fills = [];
  dialColumn.strokes = [];
  contentRow.appendChild(dialColumn);

  const gaugeSize = 160;
  const ringColor = getRingColor(level);

  // Base donut
  const baseDonut = figma.createEllipse();
  baseDonut.resize(gaugeSize, gaugeSize);
  baseDonut.arcData = {
    startingAngle: 0,
    endingAngle: Math.PI * 2,
    innerRadius: 0.72
  };
  baseDonut.fills = [
    {
      type: "SOLID",
      color: { r: 241 / 255, g: 245 / 255, b: 249 / 255 }
    }
  ];
  baseDonut.strokes = [];

  // Colored arc donut
  const arcDonut = figma.createEllipse();
  arcDonut.resize(gaugeSize, gaugeSize);
  arcDonut.arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: -Math.PI / 2 + (Math.PI * 2 * clamped) / 100,
    innerRadius: 0.72
  };
  arcDonut.fills = [
    {
      type: "SOLID",
      color: ringColor
    }
  ];
  arcDonut.strokes = [];

  const gaugeFrame = figma.createFrame();
  gaugeFrame.name = "Dial";
  gaugeFrame.layoutMode = "NONE";
  gaugeFrame.primaryAxisSizingMode = "FIXED";
  gaugeFrame.counterAxisSizingMode = "FIXED";
  gaugeFrame.resize(gaugeSize, gaugeSize);
  gaugeFrame.fills = [];
  gaugeFrame.strokes = [];
  gaugeFrame.clipsContent = false;

  baseDonut.x = 0;
  baseDonut.y = 0;
  arcDonut.x = 0;
  arcDonut.y = 0;

  gaugeFrame.appendChild(baseDonut);
  gaugeFrame.appendChild(arcDonut);

  // Centre text (percentage)
  const scoreText = figma.createText();
  scoreText.fontName = { family: "Inter", style: "Semi Bold" };
  scoreText.fontSize = 40;
  scoreText.characters = Math.round(clamped).toString();
  scoreText.fills = [
    {
      type: "SOLID",
      color: { r: 15 / 255, g: 23 / 255, b: 42 / 255 }
    }
  ];
  gaugeFrame.appendChild(scoreText);

  // Range text "0 | 140"
  const rangeText = figma.createText();
  rangeText.fontName = { family: "Inter", style: "Regular" };
  rangeText.fontSize = 10;
  rangeText.characters = `0  |  ${max}`;
  rangeText.fills = [
    {
      type: "SOLID",
      color: { r: 100 / 255, g: 116 / 255, b: 139 / 255 }
    }
  ];
  gaugeFrame.appendChild(rangeText);

  // Center the texts manually
  scoreText.x = gaugeSize / 2 - scoreText.width / 2;
  scoreText.y = gaugeSize / 2 - scoreText.height / 2 - 4;

  rangeText.x = gaugeSize / 2 - rangeText.width / 2;
  rangeText.y = scoreText.y + scoreText.height + 2;

  dialColumn.appendChild(gaugeFrame);

  // Dial caption
  const dialCaption = figma.createText();
  dialCaption.fontName = { family: "Inter", style: "Regular" };
  dialCaption.fontSize = 11;
  dialCaption.characters =
    "Overall strategic alignment and digital readiness score.";
  dialCaption.textAlignHorizontal = "CENTER";
  dialCaption.resize(gaugeSize, dialCaption.height);
  dialCaption.fills = [
    {
      type: "SOLID",
      color: { r: 71 / 255, g: 85 / 255, b: 105 / 255 }
    }
  ];
  dialColumn.appendChild(dialCaption);

  // ===== Details side =====
  const detailsColumn = figma.createFrame();
  detailsColumn.name = "Details";
  detailsColumn.layoutMode = "VERTICAL";
  detailsColumn.primaryAxisSizingMode = "AUTO";
  detailsColumn.counterAxisSizingMode = "AUTO";
  detailsColumn.itemSpacing = 12;
  detailsColumn.fills = [];
  detailsColumn.strokes = [];
  contentRow.appendChild(detailsColumn);

  // Customer + participant
  const who = figma.createText();
  who.fontName = { family: "Inter", style: "Medium" };
  who.fontSize = 12;
  who.characters = `${customer} — ${participant}`;
  who.fills = [
    {
      type: "SOLID",
      color: { r: 55 / 255, g: 65 / 255, b: 81 / 255 }
    }
  ];
  detailsColumn.appendChild(who);

  // Percentage
  const pctLabel = figma.createText();
  pctLabel.fontName = { family: "Inter", style: "Regular" };
  pctLabel.fontSize = 10;
  pctLabel.characters = "PERCENTAGE";
  pctLabel.fills = [
    {
      type: "SOLID",
      color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 }
    }
  ];

  const pctValue = figma.createText();
  pctValue.fontName = { family: "Inter", style: "Medium" };
  pctValue.fontSize = 14;
  pctValue.characters = `${pct.toFixed(2)} / 100`;
  pctValue.fills = [
    {
      type: "SOLID",
      color: { r: 15 / 255, g: 23 / 255, b: 42 / 255 }
    }
  ];

  detailsColumn.appendChild(pctLabel);
  detailsColumn.appendChild(pctValue);

  // Maturity level
  const levelLabel = figma.createText();
  levelLabel.fontName = { family: "Inter", style: "Regular" };
  levelLabel.fontSize = 10;
  levelLabel.characters = "MATURITY LEVEL";
  levelLabel.fills = [
    {
      type: "SOLID",
      color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 }
    }
  ];

  const levelValue = figma.createText();
  levelValue.fontName = { family: "Inter", style: "Medium" };
  levelValue.fontSize = 14;
  levelValue.characters =
    level > 0
      ? `Level ${level} · ${maturity || "—"}`
      : maturity || "—";
  levelValue.fills = [
    {
      type: "SOLID",
      color: { r: 15 / 255, g: 23 / 255, b: 42 / 255 }
    }
  ];

  detailsColumn.appendChild(levelLabel);
  detailsColumn.appendChild(levelValue);

  // Raw score
  const rawLabel = figma.createText();
  rawLabel.fontName = { family: "Inter", style: "Regular" };
  rawLabel.fontSize = 10;
  rawLabel.characters = "RAW SCORE";
  rawLabel.fills = [
    {
      type: "SOLID",
      color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 }
    }
  ];

  const rawValue = figma.createText();
  rawValue.fontName = { family: "Inter", style: "Medium" };
  rawValue.fontSize = 14;
  rawValue.characters = `${score} / ${max}`;
  rawValue.fills = [
    {
      type: "SOLID",
      color: { r: 15 / 255, g: 23 / 255, b: 42 / 255 }
    }
  ];

  detailsColumn.appendChild(rawLabel);
  detailsColumn.appendChild(rawValue);

  // ---------- Footer ----------
  const updated = figma.createText();
  updated.fontName = { family: "Inter", style: "Regular" };
  updated.fontSize = 10;
  updated.characters = `Last updated: ${lastUpdated}`;
  updated.fills = [
    {
      type: "SOLID",
      color: { r: 107 / 255, g: 114 / 255, b: 128 / 255 }
    }
  ];
  frame.appendChild(updated);
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "apply-digital-readiness") {
    const { customer, participant, apiBase } = msg as {
      customer: string;
      participant: string;
      apiBase: string;
    };

    const selection = figma.currentPage.selection;
    if (
      selection.length !== 1 ||
      selection[0].type !== "FRAME"
    ) {
      postStatus(
        "Please select exactly one frame to turn into the Digital Readiness card.",
        true
      );
      return;
    }

    const frame = selection[0] as FrameNode;

    try {
      postStatus("Fetching latest digital readiness…", false);

      const url = `${apiBase.replace(
        /\/$/,
        ""
      )}/api/digital_readiness_latest_live?customer=${encodeURIComponent(
        customer
      )}&participant=${encodeURIComponent(participant)}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }
      const data = (await res.json()) as DigitalReadinessResponse;

      await loadFonts();
      await buildCard(frame, data, customer, participant);

      postStatus("Updated successfully ✔️", false);
    } catch (err: any) {
      console.error(err);
      postStatus(
        `Error: ${err?.message ?? "Failed to update card"}`,
        true
      );
    }
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

