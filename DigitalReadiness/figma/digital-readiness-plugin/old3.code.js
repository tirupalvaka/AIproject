// code.js — Digital Readiness Live (JS)

figma.showUI(__html__, { width: 420, height: 420 });

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "fetch-digital") return;

  const customer = msg.customer || "Contoso";
  const participant = msg.participant || "Alex Doe";
  const baseUrl = (msg.baseUrl || "").replace(/\/+$/, "");

  if (!baseUrl) {
    figma.ui.postMessage({
      type: "digital-error",
      message: "Please enter a valid API base URL",
    });
    figma.notify("Please enter a valid API base URL");
    return;
  }

  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].type !== "FRAME") {
    const message = "Select exactly one frame before running the plugin.";
    figma.ui.postMessage({ type: "digital-error", message });
    figma.notify(message);
    return;
  }

  const frame = selection[0];

  try {
    const url =
      baseUrl +
      "/api/digital_readiness_latest_live?customer=" +
      encodeURIComponent(customer) +
      "&participant=" +
      encodeURIComponent(participant);

    const res = await fetch(url);
    if (!res.ok) {
      const message = "API error: " + res.status;
      figma.ui.postMessage({ type: "digital-error", message });
      figma.notify(message);
      return;
    }

    const data = await res.json();

    const score = typeof data.score === "number" ? data.score : 0;
    const max =
      typeof data.max === "number" && data.max > 0 ? data.max : 140;
    const percent =
      typeof data.percent === "number"
        ? data.percent
        : max
        ? (score / max) * 100
        : 0;
    const level = typeof data.level === "number" ? data.level : 0;
    const maturity = data.maturity || "";
    const timestamp = data.timestamp || "";

    const levelLabel =
      (level ? "Level " + level : "Level —") +
      (maturity ? " · " + maturity : "");

    const updatedLabel = timestamp
      ? "Last updated: " + new Date(timestamp).toLocaleString()
      : "Last updated: --";

    function setText(name, value) {
      const node = frame.findOne(
        (n) => n.type === "TEXT" && n.name === name
      );
      if (!node) return;

      if (figma.editorType === "figma") {
        figma.loadFontAsync(node.fontName).then(() => {
          node.characters = value;
        });
      } else {
        node.characters = value;
      }
    }

    setText("DigitalScore", percent.toFixed(0));
    setText("DigitalPercent", percent.toFixed(2) + " / 100");
    setText("DigitalLevel", levelLabel);
    setText("DigitalRaw", score + " / " + max);
    setText("DigitalUpdated", updatedLabel);

    // ✅ Tell the UI that we’re done
    figma.ui.postMessage({
      type: "digital-result",
      data: {
        score,
        max,
        percent,
        level,
        maturity,
        timestamp,
      },
    });

    figma.notify("Digital Readiness updated ✅");
  } catch (err) {
    console.error("Plugin error", err);
    const message = "Failed to fetch Digital Readiness";
    figma.ui.postMessage({ type: "digital-error", message });
    figma.notify(message);
  }
};

