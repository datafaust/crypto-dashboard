// src/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export type SymbolList = string[];

export type AlignmentPoint = {
  timestamp: string;               // ISO string
  actual_volume: number | null;
  predicted_volume: number | null;
};

export type AlignmentResponse = {
  points: AlignmentPoint[];
};

export type LatestOhlcv = {
  SYMBOL_VALUE: string;
  WINDOW_START: number;            // epoch ms
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  VOLUME: number;
  VWAP: number;
  TRADES: number;
};

export type LatestPrediction = {
  SYMBOL_VALUE: string;
  WINDOW_START: string;            // timestamp (postgres)
  PREDICTED_VOLUME: number;
  MODEL_VERSION: string;
};

async function mustOk(res: Response) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body}`);
  }
  return res;
}

export async function fetchSymbols(): Promise<SymbolList> {
  const res = await fetch(`${API_BASE}/api/symbols`, { cache: 'no-store' });
  await mustOk(res);
  return res.json();
}

export async function fetchAlignmentRange(symbol: string, minutes = 120): Promise<AlignmentResponse> {
  const res = await fetch(
    `${API_BASE}/api/alignment/range?symbol=${encodeURIComponent(symbol)}&minutes=${minutes}`,
    { cache: 'no-store' }
  );
  await mustOk(res);
  const rows = await res.json(); // array of { window_start, actual_volume, predicted_volume }
  const points: AlignmentPoint[] = (rows ?? []).map((r: any) => ({
    timestamp: r?.window_start ? String(r.window_start) : '',
    actual_volume: r?.actual_volume ?? null,
    predicted_volume: r?.predicted_volume ?? null,
  }));
  return { points };
}

export async function fetchLatestOhlcv(symbol: string): Promise<LatestOhlcv> {
  const res = await fetch(`${API_BASE}/api/ohlcv/latest?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
  await mustOk(res);
  return res.json();
}

export async function fetchLatestPrediction(symbol: string): Promise<LatestPrediction> {
  const res = await fetch(`${API_BASE}/api/predictions/latest?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
  await mustOk(res);
  return res.json();
}
