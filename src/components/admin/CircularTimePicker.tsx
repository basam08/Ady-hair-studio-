"use client";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08..21
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function polar(index: number, total: number, radiusPct: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + radiusPct * Math.cos(angle)}%`,
    top: `${50 + radiusPct * Math.sin(angle)}%`,
  };
}

export function CircularTimePicker({
  value,
  onChange,
  mode,
  onModeChange,
}: {
  value: string;
  onChange: (v: string) => void;
  mode: "hour" | "minute";
  onModeChange: (m: "hour" | "minute") => void;
}) {
  const [h, m] = value ? value.split(":").map(Number) : [10, 0];
  const hour = Number.isFinite(h) ? h : 10;
  const minute = Number.isFinite(m) ? m : 0;

  function pad(n: number) {
    return String(n).padStart(2, "0");
  }

  function pickHour(next: number) {
    onChange(`${pad(next)}:${pad(minute)}`);
    onModeChange("minute");
  }

  function pickMinute(next: number) {
    onChange(`${pad(hour)}:${pad(next)}`);
  }

  const items = mode === "hour" ? HOURS : MINUTES;
  const selected = mode === "hour" ? hour : minute;

  return (
    <div className="w-60">
      <div className="mb-3 flex items-center justify-center gap-2 u-mono text-xl">
        <button
          type="button"
          onClick={() => onModeChange("hour")}
          className={mode === "hour" ? "text-ink" : "text-cocoa"}
        >
          {pad(hour)}
        </button>
        <span className="text-cocoa">:</span>
        <button
          type="button"
          onClick={() => onModeChange("minute")}
          className={mode === "minute" ? "text-ink" : "text-cocoa"}
        >
          {pad(minute)}
        </button>
      </div>
      <div className="relative mx-auto h-52 w-52 rounded-full border border-ink bg-oat">
        {items.map((n, i) => {
          const pos = polar(i, items.length, 40);
          const isSelected = n === selected;
          return (
            <button
              key={n}
              type="button"
              onClick={() => (mode === "hour" ? pickHour(n) : pickMinute(n))}
              className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full u-mono text-xs transition-colors ${
                isSelected ? "bg-ink text-oat" : "text-ink hover:bg-cream"
              }`}
              style={pos}
            >
              {mode === "hour" ? n : pad(n)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
