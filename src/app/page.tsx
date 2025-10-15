'use client';

import { useEffect, useMemo, useState } from 'react';
import SymbolSelect from '@/components/SymbolSelect';
import Chart from '@/components/Chart';
import LivePanel from '@/components/LivePanel';
import { useEventSource } from '@/hooks/useEventSource';
import {
  fetchSymbols,
  fetchAlignmentRange,
  fetchLatestOhlcv,
  fetchLatestPrediction,
  type AlignmentResponse,
  type LatestOhlcv,
  type LatestPrediction,
} from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// --- helpers & types ---
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
  WINDOW_START?: string;       // ISO
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

export default function Page() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string | null>(null);

  const [minutes, setMinutes] = useState<number>(120);

  const [chartData, setChartData] = useState<AlignmentResponse['points']>([]);
  const [latestOhlcv, setLatestOhlcv] = useState<LatestOhlcv | null>(null);
  const [latestPred, setLatestPred] = useState<LatestPrediction | null>(null);

  // derived metrics
  const mape60 = computeMape(chartData, 60);
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
        console.error(e);
      }
    })();
  }, []);

  // When symbol/minutes change: backfill chart + latest tiles
  useEffect(() => {
    if (!symbol) return;
    (async () => {
      try {
        const aligned = await fetchAlignmentRange(symbol, minutes);
        setChartData(aligned.points);

        const [ohlcv, pred] = await Promise.all([
          fetchLatestOhlcv(symbol),
          fetchLatestPrediction(symbol),
        ]);
        setLatestOhlcv(ohlcv);
        setLatestPred(pred);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [symbol, minutes]);

  // SSE stream (joined OHLCV + prediction per your API)
  const sseUrl = useMemo(
    () => (symbol ? `${API_BASE}/sse/stream?symbol=${encodeURIComponent(symbol)}` : null),
    [symbol]
  );
  const live = useEventSource<LivePayload>(sseUrl);

  // When SSE arrives, patch the last point and tile values
  useEffect(() => {
    if (!live || !symbol) return;

    const timestamp = live.WINDOW_START ? String(live.WINDOW_START) : undefined;
    const actual = typeof live.ACTUAL_VOLUME === 'number' ? live.ACTUAL_VOLUME : null;
    const predicted = typeof live.PREDICTED_VOLUME === 'number' ? live.PREDICTED_VOLUME : null;

    if (timestamp) {
      setChartData((prev) => {
        const next = [...prev];
        const idx = next.findIndex((p) => p.timestamp === timestamp);
        const newPoint = { timestamp, actual_volume: actual, predicted_volume: predicted };
        if (idx >= 0) next[idx] = { ...next[idx], ...newPoint };
        else next.push(newPoint);
        if (next.length > 360) next.shift(); // ring buffer
        return next;
      });
    }

    // Update tiles if fields are present
    if (live.WINDOW_START && typeof live.CLOSE === 'number') {
      setLatestOhlcv((prev) => {
        const base = prev ?? defaultOhlcv(symbol);
        return {
          ...base,
          WINDOW_START: Date.parse(live.WINDOW_START as string),
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

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header with range selector and symbol picker */}
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

      <LivePanel latestOhlcv={latestOhlcv} latestPrediction={latestPred} />

      <div className="rounded-xl border border-gray-800 p-4">
        {/* Status row */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
          {mape60 !== null && (
            <span className="rounded-full border border-gray-700 px-2 py-0.5">
              MAPE (60m): <span className="text-gray-200">{mape60.toFixed(1)}%</span>
            </span>
          )}
          {freshnessSec !== null && (
            <span
              className={`rounded-full px-2 py-0.5 border ${
                freshnessSec <= 5
                  ? 'border-green-700 text-green-300'
                  : 'border-yellow-700 text-yellow-300'
              }`}
            >
              Live • {freshnessSec}s behind
            </span>
          )}
        </div>

        <div className="text-sm text-gray-400 mb-2">
          Actual vs Predicted Volume (last {minutes} mins)
        </div>
        <Chart
          data={chartData}
          actualColor="#22c55e"      // green-500
          predictedColor="#f59e0b"   // amber-500
        />
      </div>
    </main>
  );
}
