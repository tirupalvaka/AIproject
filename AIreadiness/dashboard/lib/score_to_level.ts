// lib/score_to_level.ts

export function scoreToLevel(total: number) {
  if (total >= 85) return { level: 5, maturity: "Leading" };
  if (total >= 64) return { level: 4, maturity: "Advanced" };
  if (total >= 43) return { level: 3, maturity: "Developing" };
  if (total >= 22) return { level: 2, maturity: "Initial" };
  return { level: 1, maturity: "Not Started" };
}

export function levelToColor(level: number) {
  return {
    5: "#00C853", // bright green
    4: "#64DD17", // duller green
    3: "#FFD600", // yellow
    2: "#FFAB00", // amber
    1: "#D50000"  // red
  }[level] || "#9CA3AF";
}

