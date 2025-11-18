export default function HealthGauge({ score }: { score: number }) {
  return (
    <div className="p-4 border rounded">
      <div className="text-lg font-medium">Technical Health</div>
      <div className="text-3xl font-bold mt-2">{score} / 500</div>
    </div>
  );
}
