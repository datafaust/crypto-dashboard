export type FeatureTick = {
  symbol: string;
  ts: number;                  // ms epoch for minute start
  close: number;
  high_prev: number | null;
  low_prev: number | null;
  close_prev: number | null;
  price_1m_delta_bps: number | null;
  ema20: number | null;
  close_minus_ema_bps: number | null;
  atr14_1m_bps: number | null;
  bar_close_countdown_ms: number;
  predicted_volume?: number | null;
  pred_z?: number | null;                 // z-score
  pred_percentile_30d?: number | null;    // 0..1
};
