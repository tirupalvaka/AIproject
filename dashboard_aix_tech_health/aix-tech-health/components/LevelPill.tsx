// components/LevelPill.tsx
import { scoreToHealthLevel } from "@/lib/levels";

export default function LevelPill({ score500 }: { score500: number }) {
  const lvl = scoreToHealthLevel(score500);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm text-white ${lvl.color}`}>
      <strong className="font-semibold">{lvl.label}</strong>
      <span aria-hidden>•</span>
      <span className="opacity-95">{lvl.name}</span>
    </span>
  );
}

