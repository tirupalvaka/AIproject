// Show the UI
figma.showUI(__html__, { width: 420, height: 430 });

/**
 * Expected backend response shape:
 * {
 *   score: number,
 *   max: number,
 *   percent: number,
 *   level: number,
 *   maturity: string,
 *   timestamp: string,
 *   customer: string,
 *   participant_name: string
 * }
 */

var liveTimer = null;

function safeNumber(value, fallback) {
  return (value === null || value === undefined || isNaN(Number(value)))
    ? fallback
    : Number(value);
}

async function fetchDigitalReadiness(apiBase, customer, participant) {
  var base = apiBase.replace(/\/+$/, "");
  var url =
    base +
    "/api/digital_readiness_latest_live" +
    "?customer=" + encodeURIComponent(customer) +
    "&participant=" + encodeURIComponent(participant);

  var res = await fetch(url);
  if (!res.ok) {
    throw new Error("HTTP " + res.status + " from digital_readiness_latest_live");
  }
  return await res.json();
}

function findTextByName(node, name) {
  if ("name" in node && node.name === name && node.type === "TEXT") {
    return node;
  }
  if ("children" in node) {
    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];
      var found = findTextByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

async function updateFrameFromData(frame, data) {
  var percent = safeNumber(data.percent, 0);
  var rawScore = safeNumber(data.score, 0);
  var max = safeNumber(data.max, 140);
  var level = safeNumber(data.level, 0);
  var maturity = data.maturity || "";
  var ts = data.timestamp || "";

  var percentText = percent.toFixed(2) + " / 100";
  var rawText = rawScore + " / " + max;
  var levelText = "Level " + level + (maturity ? " · " + maturity : "");
  var updatedText = ts ? "Last updated: " + ts : "Last updated: --";

  var scoreNode = findTextByName(frame, "DigitalScore");
  var percentNode = findTextByName(frame, "DigitalPercent");
  var levelNode = findTextByName(frame, "DigitalLevel");
  var rawNode = findTextByName(frame, "DigitalRaw");
  var updatedNode = findTextByName(frame, "DigitalUpdated");

  // Try to load fonts (ignore errors if not present)
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  } catch (e) {}
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  } catch (e) {}

  if (scoreNode) scoreNode.characters = String(Math.round(percent));
  if (percentNode) percentNode.characters = percentText;
  if (levelNode) levelNode.characters = levelText;
  if (rawNode) rawNode.characters = rawText;
  if (updatedNode) updatedNode.characters = updatedText;
}

async function runOnce(apiBase, customer, participant) {
  if (figma.currentPage.selection.length !== 1) {
    throw new Error("Select exactly one frame that contains the Digital* text layers.");
  }

  var node = figma.currentPage.selection[0];
  if (
    node.type !== "FRAME" &&
    node.type !== "GROUP" &&
    node.type !== "COMPONENT" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error("Selection must be a frame / group / component.");
  }

  var data = await fetchDigitalReadiness(apiBase, customer, participant);
  await updateFrameFromData(node, data);
}

// Listen to UI
figma.ui.onmessage = async function (msg) {
  if (msg.type === "apply-digital-readiness") {
    var customer = msg.customer;
    var participant = msg.participant;
    var apiBase = msg.apiBase;
    var live = !!msg.live;

    // Clear existing timer if any
    if (liveTimer) {
      clearInterval(liveTimer);
      liveTimer = null;
    }

    try {
      await runOnce(apiBase, customer, participant);

      // Live auto-refresh every 30 seconds while plugin is open
      if (live) {
        liveTimer = setInterval(function () {
          runOnce(apiBase, customer, participant).catch(function (err) {
            figma.ui.postMessage({
              type: "status",
              text: "Live refresh failed: " + err.message,
              error: true,
              live: true
            });
          });
        }, 30000); // 30 seconds
      }

      figma.ui.postMessage({
        type: "status",
        text: live
          ? "Fetched successfully – live auto-refresh is ON (30s)."
          : "Fetched successfully ✔",
        error: false,
        live: live
      });
    } catch (err) {
      figma.ui.postMessage({
        type: "status",
        text: "Error: " + (err && err.message ? err.message : String(err)),
        error: true,
        live: false
      });
    }
  }
};

// Clean up timer when plugin window closes
figma.on("close", function () {
  if (liveTimer) clearInterval(liveTimer);
});

