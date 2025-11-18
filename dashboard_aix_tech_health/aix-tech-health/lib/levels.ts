// lib/levels.ts
export type HealthLevelId = 1 | 2 | 3 | 4 | 5;

export type HealthLevel = {
  id: HealthLevelId;
  label: string;          // "Level 4"
  name: string;           // "Advanced"
  range: [number, number];// inclusive
  profile: string;        // Organizational Profile
  color: string;          // Tailwind color token
};

// Source of truth for the MVP ranges you shared
export const HEALTH_LEVELS: HealthLevel[] = [
  {
    id: 5,
    label: "Level 5",
    name: "Leading",
    range: [401, 500],
    profile: "Industry-leading Technical and Platform Health",
    color: "bg-emerald-600",
  },
  {
    id: 4,
    label: "Level 4",
    name: "Advanced",
    range: [301, 400],
    profile: "Strong Technical and Platform Health",
    color: "bg-green-600",
  },
  {
    id: 3,
    label: "Level 3",
    name: "Developing",
    range: [201, 300],
    profile: "Growing Technical and Platform Health",
    color: "bg-amber-500",
  },
  {
    id: 2,
    label: "Level 2",
    name: "Initial",
    range: [101, 200],
    profile: "Basic Technical and Platform Health",
    color: "bg-orange-500",
  },
  {
    id: 1,
    label: "Level 1",
    name: "Not Started",
    range: [0, 100],
    profile: "Minimal or no Technical and Platform Health",
    color: "bg-red-600",
  },
];

// Clamp to 0–500 then pick the band
export function scoreToHealthLevel(score500: number): HealthLevel {
  const s = Math.max(0, Math.min(500, Math.round(score500)));
  return (
    HEALTH_LEVELS.find(({ range: [lo, hi] }) => s >= lo && s <= hi) ??
    HEALTH_LEVELS[0]
  );
}

