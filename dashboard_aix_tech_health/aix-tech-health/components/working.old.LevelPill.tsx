export default function LevelPill({ text, tone = "yellow" }: { text: string; tone?: "green"|"yellow"|"orange"|"red" }) {
  const cls =
    tone === "green"  ? "bg-green-100 text-green-800" :
    tone === "yellow" ? "bg-yellow-100 text-yellow-800" :
    tone === "orange" ? "bg-orange-100 text-orange-800" :
                        "bg-red-100 text-red-800";
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${cls}`}>{text}</span>;
}

