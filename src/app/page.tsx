// src/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import SymbolSelect from '@/components/SymbolSelect';
import Chart from '@/components/Chart';
import DecisionPanel from '@/components/DecisionPanel';
import { useEventSource } from '@/hooks/useEventSource';
import { useFeatureSSE } from '@/hooks/useFeatureSSE';
import TechCard from '@/components/TechCard';
import PriceChart from '@/components/PriceChart';

import {
  fetchSymbols,
  fetchAlignmentRange,
  fetchLatestOhlcv,
  fetchLatestPrediction,
  fetchStrategyConfig,
  fetchPriceRange,
  type AlignmentResponse,
  type LatestOhlcv,
  type LatestPrediction,
  type StrategyConfig,
  type PricePoint,
} from '@/lib/api-client';

import type { FeatureTick } from '@/types/features';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// --- helpers ---
function computeMape(
  points: { actual_volume: number | null; predicted_volume: number | null }[],
  lastN = 60
) {
  const tail = points.slice(-lastN);
  let sum = 0;
  let n = 0;
  for (const p of tail) {
    const a = p.actual_volume;
    const f = p.predicted_volume;
    if (typeof a === 'number' && a > 0 && typeof f === 'number') {
      sum += Math.abs((a - f) / a);
      n++;
    }
  }
  return n ? (sum / n) * 100 : null;
}

type LivePayload = {
  WINDOW_START?: string | number;
  ACTUAL_VOLUME?: number;
  PREDICTED_VOLUME?: number;
  CLOSE?: number | null;
  VOLUME?: number | null;
  TRADES?: number | null;
  MODEL_VERSION?: string;
};

function defaultOhlcv(symbol: string): LatestOhlcv {
  return {
    SYMBOL_VALUE: symbol,
    WINDOW_START: Date.now(),
    OPEN: 0,
    HIGH: 0,
    LOW: 0,
    CLOSE: 0,
    VOLUME: 0,
    VWAP: 0,
    TRADES: 0,
  };
}

function defaultPrediction(symbol: string): LatestPrediction {
  return {
    SYMBOL_VALUE: symbol,
    WINDOW_START: new Date().toISOString(),
    PREDICTED_VOLUME: 0,
    MODEL_VERSION: '',
  };
}

// Normalize any incoming timestamp to the exact minute ISO string
type TsLike = string | number | Date;
function normalizeMinute(ts: TsLike): string {
  let ms: number;
  if (ts instanceof Date) ms = ts.getTime();
  else if (typeof ts === 'number') ms = ts;
  else ms = Date.parse(ts);
  if (Number.isNaN(ms)) return '';
  const floored = Math.floor(ms / 60000) * 60000;
  return new Date(floored).toISOString();
}

export default function Page() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(120);

  const [chartData, setChartData] = useState<AlignmentResponse['points']>([]);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [latestOhlcv, setLatestOhlcv] = useState<LatestOhlcv | null>(null);
  const [latestPred, setLatestPred] = useState<LatestPrediction | null>(null);
  const [config, setConfig] = useState<StrategyConfig | null>(null);

  // derived metrics
  const mape = computeMape(chartData, minutes);
  const lastTs = chartData.length ? chartData[chartData.length - 1].timestamp : null;
  const freshnessSec =
    lastTs ? Math.max(0, Math.round((Date.now() - Date.parse(lastTs)) / 1000)) : null;

  // Load symbols on mount, set default
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchSymbols();
        setSymbols(s);
        setSymbol((prev) => prev ?? (s[0] ?? null));
      } catch (e) {
        console.error('[INIT] fetchSymbols error', e);
      }
    })();
  }, []);

  // Backfill on symbol/minutes change
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      try {
        const aligned = await fetchAlignmentRange(symbol, minutes);
        const normalized = aligned.points.map((p) => ({
          ...p,
          timestamp: normalizeMinute(p.timestamp),
        }));
        setChartData(normalized);

        const [ohlcv, pred, cfg, prices] = await Promise.all([
          fetchLatestOhlcv(symbol),
          fetchLatestPrediction(symbol),
          fetchStrategyConfig(symbol),
          fetchPriceRange(symbol, minutes),
        ]);
        setLatestOhlcv(ohlcv);
        setLatestPred(pred);
        setConfig(cfg);
        setPriceData(
          prices.map((p) => ({ ...p, timestamp: normalizeMinute(p.timestamp) }))
        );
      } catch (e) {
        console.error('[BACKFILL] error', e);
      }
    })();
  }, [symbol, minutes]);

  // Live SSE (actual vs predicted)
  const sseUrl = useMemo(
    () => (symbol ? `${API_BASE}/sse/stream?symbol=${encodeURIComponent(symbol)}` : null),
    [symbol]
  );
  const live = useEventSource<LivePayload>(sseUrl);

  useEffect(() => {
    if (!live || !symbol) return;

    const tsRaw = live.WINDOW_START;
    const timestamp = tsRaw ? normalizeMinute(tsRaw) : undefined;
    if (!timestamp) return;

    // Patch chart row
    const patch: Partial<{ timestamp: string; actual_volume: number; predicted_volume: number }> = {
      timestamp,
    };
    if (typeof live.ACTUAL_VOLUME === 'number') patch.actual_volume = live.ACTUAL_VOLUME;
    if (typeof live.PREDICTED_VOLUME === 'number') patch.predicted_volume = live.PREDICTED_VOLUME;

    if ('actual_volume' in patch || 'predicted_volume' in patch) {
      setChartData((prev) => {
        const next = [...prev];
        const idx = next.findIndex((p) => p.timestamp === timestamp);
        if (idx >= 0) next[idx] = { ...next[idx], ...patch };
        else next.push({ timestamp, actual_volume: null, predicted_volume: null, ...patch });
        if (next.length > 360) next.shift();
        next.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return next;
      });
    }

    // Update tiles
    if (live.WINDOW_START && typeof live.CLOSE === 'number') {
      setLatestOhlcv((prev) => {
        const base = prev ?? defaultOhlcv(symbol);
        return {
          ...base,
          WINDOW_START: Date.parse(String(live.WINDOW_START)),
          CLOSE: typeof live.CLOSE === 'number' ? live.CLOSE : base.CLOSE,
          VOLUME: typeof live.VOLUME === 'number' ? live.VOLUME : base.VOLUME,
          TRADES: typeof live.TRADES === 'number' ? live.TRADES : base.TRADES,
        };
      });
    }
    if (typeof live.PREDICTED_VOLUME === 'number' || typeof live.MODEL_VERSION === 'string') {
      setLatestPred((prev) => {
        const base = prev ?? defaultPrediction(symbol);
        return {
          ...base,
          PREDICTED_VOLUME:
            typeof live.PREDICTED_VOLUME === 'number'
              ? live.PREDICTED_VOLUME
              : base.PREDICTED_VOLUME,
          MODEL_VERSION:
            typeof live.MODEL_VERSION === 'string' ? live.MODEL_VERSION : base.MODEL_VERSION,
        };
      });
    }
  }, [live, symbol]);

  // Features SSE (for strip/levels/countdown)
  const features: FeatureTick | null = useFeatureSSE(symbol ?? '', API_BASE);

  // Arm handler (stub for now)
  function handleArm(side: 'LONG' | 'SHORT', px: number) {
    // Later: validate gates + stage order
    // eslint-disable-next-line no-console
    console.log('[ARM]', { symbol, side, px, features, config });
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Crypto Volume Nowcast</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Range</label>
          <select
            className="rounded-md bg-gray-900 border border-gray-700 px-2 py-1 text-sm"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
          >
            <option value={60}>60m</option>
            <option value={120}>120m</option>
            <option value={240}>240m</option>
          </select>
          <SymbolSelect symbols={symbols} value={symbol} onChange={setSymbol} />
        </div>
      </div>

      {/* Decision panel: strip + levels + tiles */}
      <DecisionPanel
        features={features}
        latestOhlcv={
          latestOhlcv
            ? {
                WINDOW_START: Number(latestOhlcv.WINDOW_START),
                CLOSE: latestOhlcv.CLOSE,
                VOLUME: latestOhlcv.VOLUME,
                TRADES: latestOhlcv.TRADES,
              }
            : null
        }
        latestPrediction={
          latestPred
            ? {
                PREDICTED_VOLUME: latestPred.PREDICTED_VOLUME,
                MODEL_VERSION: latestPred.MODEL_VERSION,
              }
            : null
        }
        onArm={handleArm}
        config={
          config
            ? { z_threshold: config.z_threshold, percentile_min: config.percentile_min }
            : undefined
        }
      />

      {/* Volume chart */}
      <div className="rounded-xl border border-gray-800 p-4">
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
          {mape !== null && (
            <span className="rounded-full border border-gray-700 px-2 py-0.5">
              MAPE ({minutes}m): <span className="text-gray-200">{mape.toFixed(1)}%</span>
            </span>
          )}
          {freshnessSec !== null && (
            <span
              className={`rounded-full px-2 py-0.5 border ${
                freshnessSec <= 5 ? 'border-green-700 text-green-300' : 'border-yellow-700 text-yellow-300'
              }`}
            >
              Live • {freshnessSec}s behind
            </span>
          )}
        </div>

        <div className="text-sm text-gray-400 mb-2">
          Actual vs Predicted Volume (last {minutes} mins)
        </div>
        <Chart data={chartData} actualColor="#22c55e" predictedColor="#f59e0b" syncId="main-sync" />
      </div>

      {/* Price chart (synced) */}
      <div className="rounded-xl border border-gray-800 p-4">
        <div className="text-sm text-gray-400 mb-2">
          Price (Close) — last {minutes} mins
        </div>
        <PriceChart data={priceData} syncId="main-sync" />
      </div>

      <div>
        <TechCard />
      </div>
    </main>
  );
}
