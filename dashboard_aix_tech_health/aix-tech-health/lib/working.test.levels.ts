export function levelForScore(score500: number) {
  if (score500 >= 401) return { level: 5, name: "Leading", tone: "green" as const };
  if (score500 >= 301) return { level: 4, name: "Advanced", tone: "green" as const };
  if (score500 >= 201) return { level: 3, name: "Developing", tone: "yellow" as const };
  if (score500 >= 101) return { level: 2, name: "Initial", tone: "orange" as const };
  return { level: 1, name: "Not Started", tone: "red" as const };
}

