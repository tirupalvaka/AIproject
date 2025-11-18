export default function LevelChip({ level, name }: { level: number; name: string }) {
  const colors: Record<number, string> = {
    5: "bg-red-500",
    4: "bg-orange-500",
    3: "bg-yellow-400",
    2: "bg-amber-600",
    1: "bg-gray-400",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white ${colors[level] || "bg-gray-600"}`}>
      <span className="text-xs">Level {level}</span>
      <span className="text-xs font-semibold">{name}</span>
    </span>
  );
}

