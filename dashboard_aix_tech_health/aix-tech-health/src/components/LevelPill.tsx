type Props = { level: 1|2|3|4|5; name: string };
const palette: Record<number, string> = {
  1: "bg-gray-200 text-gray-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-amber-200 text-amber-900",
  4: "bg-blue-100 text-blue-800",
  5: "bg-emerald-100 text-emerald-800",
};
export default function LevelPill({ level, name }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${palette[level]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {`Level ${level} — ${name}`}
    </span>
  );
}
