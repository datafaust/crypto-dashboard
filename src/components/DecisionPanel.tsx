// src/components/DecisionPanel.tsx
"use client";
import SignalStrip from "@/components/SignalStrip";
import LevelsCard from "@/components/LevelsCard";
import type { FeatureTick } from "@/types/features";

type Props = {
  features: FeatureTick | null;
  latestOhlcv: {
    WINDOW_START: number; // ms
    CLOSE: number;
    VOLUME: number;
    TRADES: number;
  } | null;
  latestPrediction: {
    PREDICTED_VOLUME: number;
    MODEL_VERSION: string;
  } | null;
  onArm?: (side: "LONG" | "SHORT", px: number) => void;
  // NEW: pass thresholds down so the strip can show PASS/HOLD
  config?: { z_threshold: number; percentile_min: number };
};

export default function DecisionPanel({
  features,
  latestOhlcv,
  latestPrediction,
  onArm,
  config,
}: Props) {
  return (
    <div className="space-y-3">
      <SignalStrip t={features} cfg={config} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LevelsCard t={features} onArm={onArm} />
        </div>

        <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-900/40">
          <div className="text-xs text-zinc-400 mb-1">Last Minute (OHLCV)</div>
          {latestOhlcv ? (
            <div className="space-y-1">
              <div className="text-2xl font-semibold">
                ${latestOhlcv.CLOSE.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">
                Volume: {latestOhlcv.VOLUME.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">
                Trades: {latestOhlcv.TRADES.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Loading…</div>
          )}

          <div className="mt-4 border-t border-zinc-800 pt-3">
            <div className="text-xs text-zinc-400 mb-1">Prediction</div>
            {latestPrediction ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  {latestPrediction.PREDICTED_VOLUME.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Model: {latestPrediction.MODEL_VERSION || "—"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500">Loading…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
