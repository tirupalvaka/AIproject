figma.showUI(__html__, { width: 320, height: 260 });

async function loadFontForNode(node) {
  if (node.type !== "TEXT") return;
  const font = node.fontName;
  if (font === figma.mixed) {
    // load all fonts in ranges if needed; simple case: just return
    return;
  }
  await figma.loadFontAsync(font);
}

function sendStatus(text, error) {
  figma.ui.postMessage({ type: "status", text, error });
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "apply-digital-readiness") return;

  const { customer, participant, apiBase } = msg;

  try {
    if (figma.currentPage.selection.length !== 1 ||
        figma.currentPage.selection[0].type !== "FRAME") {
      sendStatus("Select exactly one frame before running the plugin.", true);
      return;
    }

    const frame = figma.currentPage.selection[0];

    const url =
      apiBase.replace(/\/$/, "") +
      `/api/digital_readiness_latest_live?customer=${encodeURIComponent(
        customer
      )}&participant=${encodeURIComponent(participant)}`;

    sendStatus("Calling API…", false);
    const res = await fetch(url);

    if (!res.ok) {
      sendStatus(`API error: ${res.status} ${res.statusText}`, true);
      return;
    }

    const data = await res.json();
    const score = data.score ?? 0;
    const max = data.max ?? 140;
    const percent = data.percent ?? (max ? (score / max) * 100 : 0);
    const level = data.level ?? 0;
    const maturity = data.maturity ?? "";
    const ts = data.timestamp || "";

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
      scoreNode.characters = `${Math.round(percent)}`;
    }

    if (percentNode) {
      await loadFontForNode(percentNode);
      percentNode.characters = `${percent.toFixed(2)} / 100`;
    }

    if (levelNode) {
      await loadFontForNode(levelNode);
      levelNode.characters =
        level && maturity
          ? `Level ${level} · ${maturity}`
          : `Level ${level || "—"}`;
    }

    if (rawNode) {
      await loadFontForNode(rawNode);
      rawNode.characters = `${score} / ${max}`;
    }

    if (updatedNode) {
      await loadFontForNode(updatedNode);
      updatedNode.characters = ts ? `Last updated: ${ts}` : "Last updated: --";
    }

    sendStatus("Frame updated with latest Digital Readiness.", false);
  } catch (err) {
    sendStatus(`Error: ${err}`, true);
  }
};

