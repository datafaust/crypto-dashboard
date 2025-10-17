"use client";
import type { FeatureTick } from "@/types/features";

type Tone = "good" | "bad" | "warn" | "default";

function Badge({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  const toneClass =
    tone === "good"
      ? "bg-green-500/15 text-green-400"
      : tone === "bad"
      ? "bg-red-500/15 text-red-400"
      : tone === "warn"
      ? "bg-yellow-500/15 text-yellow-400"
      : "bg-zinc-500/15 text-zinc-300";
  return (
    <span className={`px-2 py-1 rounded-xl text-xs font-medium ${toneClass}`}>
      {label}: {value}
    </span>
  );
}

export default function SignalStrip({
  t,
  cfg,
}: {
  t: FeatureTick | null;
  cfg?: { z_threshold: number; percentile_min: number };
}) {
  if (!t) return null;

  const delta = t.price_1m_delta_bps ?? 0;
  const emaDiff = t.close_minus_ema_bps ?? 0;
  const sec = Math.floor((t.bar_close_countdown_ms ?? 0) / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const emaTone: Tone = emaDiff > 0 ? "good" : emaDiff < 0 ? "bad" : "default";
  const deltaTone: Tone =
    Math.abs(delta) >= 5 ? (delta > 0 ? "good" : "bad") : "default";

  const predZ = typeof t.pred_z === "number" ? t.pred_z : null;
  const pct = typeof t.pred_percentile_30d === "number" ? t.pred_percentile_30d : null; // 0..1
  const zTh = cfg?.z_threshold ?? 1.0;
  const pctMin = cfg?.percentile_min ?? 90.0;

  const energyPass =
    (predZ !== null && predZ >= zTh) ||
    (pct !== null && pct * 100 >= pctMin);

  return (
    <div className="w-full flex flex-wrap gap-2 items-center p-2 border rounded-xl border-zinc-800 bg-zinc-900/40">
      <Badge
        label="Energy z"
        value={predZ !== null ? predZ.toFixed(2) : "—"}
        tone={predZ !== null ? (predZ >= zTh ? "good" : "default") : "default"}
      />
      <Badge
        label="Percentile"
        value={pct !== null ? `${Math.round(pct * 100)}%` : "—"}
        tone={pct !== null ? (pct * 100 >= pctMin ? "good" : "default") : "default"}
      />
      <Badge label="Gate" value={energyPass ? "PASS" : "HOLD"} tone={energyPass ? "good" : "warn"} />

      <Badge label="Δbps" value={delta.toFixed(1)} tone={deltaTone} />
      <Badge label="EMA20" value={emaDiff >= 0 ? "Above" : "Below"} tone={emaTone} />
      <Badge label="ATR14 (bps)" value={(t.atr14_1m_bps ?? 0).toFixed(1)} />
      <Badge label="Close" value={t.close.toFixed(2)} />
      <Badge label="⏱" value={`${mm}:${ss}`} />
    </div>
  );
}
