'use client';

import dayjs from 'dayjs';

type Props = {
  latestOhlcv: {
    WINDOW_START: number; // epoch ms
    CLOSE: number;
    VOLUME: number;
    TRADES: number;
  } | null;
  latestPrediction: {
    PREDICTED_VOLUME: number;
    MODEL_VERSION: string;
  } | null;
};

export default function LivePanel({ latestOhlcv, latestPrediction }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-gray-800 p-4">
        <div className="text-xs text-gray-400 mb-1">Last Minute (OHLCV)</div>
        {latestOhlcv ? (
          <div className="space-y-1">
            <div className="text-sm text-gray-300">
              {dayjs(latestOhlcv.WINDOW_START).format('YYYY-MM-DD HH:mm')}
            </div>
            <div className="text-2xl font-semibold">${latestOhlcv.CLOSE.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Volume: {latestOhlcv.VOLUME.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Trades: {latestOhlcv.TRADES.toLocaleString()}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading…</div>
        )}
      </div>

      <div className="rounded-xl border border-gray-800 p-4">
        <div className="text-xs text-gray-400 mb-1">Prediction</div>
        {latestPrediction ? (
          <div className="space-y-1">
            <div className="text-2xl font-semibold">{latestPrediction.PREDICTED_VOLUME.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Model: {latestPrediction.MODEL_VERSION}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Loading…</div>
        )}
      </div>
    </div>
  );
}
