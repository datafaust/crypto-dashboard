// src/hooks/useFeatureSSE.ts
"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureTick } from "@/types/features";

export function useFeatureSSE(symbol: string, apiBase = process.env.NEXT_PUBLIC_API_BASE!) {
  const [data, setData] = useState<FeatureTick | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const url = `${apiBase}/sse/features?symbol=${encodeURIComponent(symbol)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as FeatureTick;
        setData(payload);
      } catch { /* ignore malformed frames */ }
    };

    es.onerror = () => {
      // Don’t close; allow browser’s built-in retry.
      // Optional: console.debug("SSE error; browser will retry…");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [symbol, apiBase]);

  return data;
}
