import { useEffect, useMemo, useState } from "react";

// Lightweight SVG radar chart — no Chart.js dependency needed
// With staggered axis animation on mount
interface Props {
  axes: string[];
  optionA: { name: string; values: number[] };
  optionB: { name: string; values: number[] };
}

export const RadarChart = ({ axes, optionA, optionB }: Props) => {
  const size = 420;
  const cx = size / 2, cy = size / 2;
  const radius = 150;
  const levels = 4;
  const N = axes.length;

  // Animation: reveal axes one-by-one with 100ms stagger
  const [revealedAxes, setRevealedAxes] = useState(0);
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setRevealedAxes(count);
      if (count >= N) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [N]);

  const point = (val: number, i: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (val / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  // Only show values for revealed axes, rest collapse to center
  const getAnimatedValues = (values: number[]) =>
    values.map((v, i) => (i < revealedAxes ? v : 0));

  const animatedA = getAnimatedValues(optionA.values);
  const animatedB = getAnimatedValues(optionB.values);

  const polyA = useMemo(() => animatedA.map((v, i) => point(v, i).join(",")).join(" "), [animatedA]);
  const polyB = useMemo(() => animatedB.map((v, i) => point(v, i).join(",")).join(" "), [animatedB]);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[460px] h-auto">
        {/* Grid */}
        {Array.from({ length: levels }).map((_, lv) => {
          const r = ((lv + 1) / levels) * radius;
          const pts = Array.from({ length: N }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
            return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r].join(",");
          }).join(" ");
          return <polygon key={lv} points={pts} fill="none" stroke="hsl(var(--border))" strokeWidth={1} />;
        })}
        {/* Spokes — animate opacity */}
        {axes.map((_, i) => {
          const [x, y] = point(100, i);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              style={{
                opacity: i < revealedAxes ? 1 : 0.15,
                transition: "opacity 0.3s ease",
              }}
            />
          );
        })}
        {/* Option B (violet) under */}
        <polygon
          points={polyB}
          fill="hsl(var(--accent) / 0.25)"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          style={{ transition: "all 0.15s ease-out" }}
        />
        {/* Option A (indigo) over */}
        <polygon
          points={polyA}
          fill="hsl(var(--primary) / 0.3)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          style={{ transition: "all 0.15s ease-out" }}
        />
        {/* Dots */}
        {animatedA.map((v, i) => {
          const [x, y] = point(v, i);
          return (
            <circle
              key={`a${i}`} cx={x} cy={y} r={3.5}
              fill="hsl(var(--primary))"
              style={{ opacity: i < revealedAxes ? 1 : 0, transition: "all 0.3s ease" }}
            />
          );
        })}
        {animatedB.map((v, i) => {
          const [x, y] = point(v, i);
          return (
            <circle
              key={`b${i}`} cx={x} cy={y} r={3.5}
              fill="hsl(var(--accent))"
              style={{ opacity: i < revealedAxes ? 1 : 0, transition: "all 0.3s ease" }}
            />
          );
        })}
        {/* Labels — fade in per axis */}
        {axes.map((label, i) => {
          const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (radius + 28);
          const ly = cy + Math.sin(angle) * (radius + 22);
          const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
          return (
            <text
              key={i} x={lx} y={ly}
              fill="hsl(var(--foreground))"
              fontSize={11} fontWeight={500}
              textAnchor={anchor as any}
              dominantBaseline="middle"
              style={{ opacity: i < revealedAxes ? 1 : 0, transition: "opacity 0.3s ease" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" />{optionA.name}</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-accent" />{optionB.name}</div>
      </div>
    </div>
  );
};
