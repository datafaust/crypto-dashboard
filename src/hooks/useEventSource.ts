import { useEffect, useRef, useState } from 'react';

type SSEData = Record<string, any> | null;

export function useEventSource(url: string | null) {
  const [data, setData] = useState<SSEData>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        setData(parsed);
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      // Let browser handle backoff; close so effect can recreate on re-render
      es.close();
      esRef.current = null;
      // Optional: trigger a re-connect after a small delay by changing url state higher up
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url]);

  return data;
}
