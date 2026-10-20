"use client";

import { useEffect, useRef } from "react";

const START_HOUR = 8;
const END_HOUR = 21; // hasta 21:45
const STEP_MIN = 15;

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    for (let m = 0; m < 60; m += STEP_MIN) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const SLOTS = buildSlots();

export function TimeListPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="max-h-60 w-32 overflow-y-auto border border-ink bg-oat">
      {SLOTS.map((t) => (
        <button
          key={t}
          type="button"
          ref={t === value ? selectedRef : undefined}
          onClick={() => onChange(t)}
          className={`u-mono block w-full px-3 py-2 text-left text-sm ${
            t === value ? "bg-ink text-oat" : "hover:bg-cream"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
