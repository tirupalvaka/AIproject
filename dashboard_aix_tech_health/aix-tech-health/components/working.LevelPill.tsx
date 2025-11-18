export default function LevelPill({ levelName }: { levelName: string }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-sm border">
      {levelName}
    </span>
  );
}
