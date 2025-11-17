// score_to_level.ts
export function scoreToLevel(total: number) {
  // 21 -> Level 1
  // 22-42 -> Level 2
  // 43-63 -> Level 3
  // 64-84 -> Level 4
  // 85-105 -> Level 5
  if (total >= 85) return { level: 5, maturity: "Leading" };
  if (total >= 64) return { level: 4, maturity: "Advanced" };
  if (total >= 43) return { level: 3, maturity: "Developing" };
  if (total >= 22) return { level: 2, maturity: "Initial" };
  return { level: 1, maturity: "Not Started" }; // 21 or lower
}

export function levelToColor(level: number) {
  // 5 bright green → 1 red (you can tweak hex codes)
  return {
    5: "#1DB954", // bright green
    4: "#5CBF70", // duller green
    3: "#D4C122", // yellow
    2: "#E8D464", // light yellow
    1: "#D9534F"  // red
  }[level] || "#999999";
}

