//src/components/LevelsCard.tsx
"use client";
import type { FeatureTick } from "@/types/features";

export default function LevelsCard({ t, tickSize = 0.01, onArm }: {
  t: FeatureTick | null;
  tickSize?: number;
  onArm?: (side: "LONG"|"SHORT", px: number) => void;
}) {
  if (!t) return null;
  const h = t.high_prev ?? null;
  const l = t.low_prev ?? null;

  const armLongPx  = h != null ? +(h + tickSize).toFixed(4) : null;
  const armShortPx = l != null ? +(l - tickSize).toFixed(4) : null;

  return (
    <div className="rounded-2xl border border-zinc-800 p-3 bg-zinc-900/40">
      <div className="text-sm text-zinc-400 mb-2">Prior Minute Levels</div>
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">H(-1)</span>
          <span className="text-lg">{h?.toFixed(4) ?? "—"}</span>
        </div>
        <button
          disabled={armLongPx == null}
          onClick={() => armLongPx && onArm?.("LONG", armLongPx)}
          className="rounded-xl px-3 py-2 text-sm bg-emerald-600/20 text-emerald-300 border border-emerald-700/30 disabled:opacity-50"
        >
          Arm Long @ {armLongPx ?? "—"}
        </button>

        <div className="flex flex-col">
          <span className="text-xs text-zinc-400">L(-1)</span>
          <span className="text-lg">{l?.toFixed(4) ?? "—"}</span>
        </div>
        <button
          disabled={armShortPx == null}
          onClick={() => armShortPx && onArm?.("SHORT", armShortPx)}
          className="rounded-xl px-3 py-2 text-sm bg-rose-600/20 text-rose-300 border border-rose-700/30 disabled:opacity-50"
        >
          Arm Short @ {armShortPx ?? "—"}
        </button>
      </div>
    </div>
  );
}
