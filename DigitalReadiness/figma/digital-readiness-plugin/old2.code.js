figma.showUI(__html__, { width: 320, height: 260 });

async function loadFontForNode(node) {
  if (node.type !== "TEXT") return;
  const font = node.fontName;
  if (font === figma.mixed) {
    // Simple case: skip mixed fonts
    return;
  }
  await figma.loadFontAsync(font);
}

function sendStatus(text, error) {
  figma.ui.postMessage({ type: "status", text: text, error: !!error });
}

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "apply-digital-readiness") return;

  const customer = msg.customer;
  const participant = msg.participant;
  const apiBase = msg.apiBase;

  try {
    if (
      figma.currentPage.selection.length !== 1 ||
      figma.currentPage.selection[0].type !== "FRAME"
    ) {
      sendStatus("Select exactly one frame before running the plugin.", true);
      return;
    }

    const frame = figma.currentPage.selection[0];

    const base = apiBase.replace(/\/$/, "");
    const url =
      base +
      "/api/digital_readiness_latest_live?customer=" +
      encodeURIComponent(customer) +
      "&participant=" +
      encodeURIComponent(participant);

    sendStatus("Calling API…", false);
    const res = await fetch(url);

    if (!res.ok) {
      sendStatus("API error: " + res.status + " " + res.statusText, true);
      return;
    }

    const data = await res.json();

    const score =
      typeof data.score === "number" ? data.score : 0;
    const max =
      typeof data.max === "number" ? data.max : 140;
    const percent =
      typeof data.percent === "number"
        ? data.percent
        : max
        ? (score / max) * 100
        : 0;
    const level =
      typeof data.level === "number" ? data.level : 0;
    const maturity =
      typeof data.maturity === "string" ? data.maturity : "";
    const ts = data.timestamp ? String(data.timestamp) : "";

    // Find text nodes by name inside the frame
    const scoreNode = frame.findOne(
      (n) => n.type === "TEXT" && n.name === "DigitalScore"
    );
    const percentNode = frame.findOne(
      (n) => n.type === "TEXT" && n.name === "DigitalPercent"
    );
    const levelNode = frame.findOne(
      (n) => n.type === "TEXT" && n.name === "DigitalLevel"
    );
    const rawNode = frame.findOne(
      (n) => n.type === "TEXT" && n.name === "DigitalRaw"
    );
    const updatedNode = frame.findOne(
      (n) => n.type === "TEXT" && n.name === "DigitalUpdated"
    );

    // Update text where nodes exist
    if (scoreNode) {
      await loadFontForNode(scoreNode);
      scoreNode.characters = String(Math.round(percent));
    }

    if (percentNode) {
      await loadFontForNode(percentNode);
      percentNode.characters = percent.toFixed(2) + " / 100";
    }

    if (levelNode) {
      await loadFontForNode(levelNode);
      levelNode.characters =
        (level ? "Level " + level : "Level —") +
        (maturity ? " · " + maturity : "");
    }

    if (rawNode) {
      await loadFontForNode(rawNode);
      rawNode.characters = score + " / " + max;
    }

    if (updatedNode) {
      await loadFontForNode(updatedNode);
      updatedNode.characters = ts
        ? "Last updated: " + ts
        : "Last updated: --";
    }

    sendStatus("Frame updated with latest Digital Readiness.", false);
  } catch (err) {
    sendStatus("Error: " + err, true);
  }
};

