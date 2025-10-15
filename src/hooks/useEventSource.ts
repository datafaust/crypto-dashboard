'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Typed SSE hook.
 * Usage: const live = useEventSource<LivePayload>(url)
 */
export function useEventSource<T = unknown>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data) as T;
        setData(parsed);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url]);

  return data;
}



// import { useEffect, useRef, useState } from 'react';

// type SSEData = Record<string, any> | null;

// export function useEventSource(url: string | null) {
//   const [data, setData] = useState<SSEData>(null);
//   const esRef = useRef<EventSource | null>(null);

//   useEffect(() => {
//     if (!url) return;

//     // Clean up any existing connection
//     if (esRef.current) {
//       esRef.current.close();
//       esRef.current = null;
//     }

//     const es = new EventSource(url, { withCredentials: false });
//     esRef.current = es;

//     es.onmessage = (evt) => {
//       try {
//         const parsed = JSON.parse(evt.data);
//         setData(parsed);
//       } catch {
//         // Ignore malformed events
//       }
//     };

//     es.onerror = () => {
//       // Let browser handle backoff; close so effect can recreate on re-render
//       es.close();
//       esRef.current = null;
//       // Optional: trigger a re-connect after a small delay by changing url state higher up
//     };

//     return () => {
//       es.close();
//       esRef.current = null;
//     };
//   }, [url]);

//   return data;
// }
