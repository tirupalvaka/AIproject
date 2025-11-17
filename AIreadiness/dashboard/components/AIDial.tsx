export default function AIDial({ total, level, percent }) {
  const max = 105;
  const pct = (total / max) * 100;

  const levelColor = {
    5: "#00C853",
    4: "#64DD17",
    3: "#FFD600",
    2: "#FFAB00",
    1: "#D50000",
  }[level];

  return (
    <div className="gauge">
      <div className="gauge__fill" style={{ background: levelColor, width: `${pct}%` }}></div>
      <div className="gauge__value">{total}</div>
    </div>
  );
}

