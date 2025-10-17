//src/components/TechCard.tsx
'use client';

import { useState } from 'react';

const items = [
  { label: 'Kafka', href: 'https://kafka.apache.org/' },
  { label: 'ksqlDB', href: 'https://ksqldb.io/' },
  { label: 'Schema Registry (Avro)', href: 'https://docs.confluent.io/platform/current/schema-registry/index.html' },
  { label: 'Postgres', href: 'https://www.postgresql.org/' },
  { label: 'FastAPI + SSE', href: 'https://fastapi.tiangolo.com/advanced/custom-response/#server-sent-events' },
  { label: 'Next.js + Recharts', href: 'https://nextjs.org/' },
];

export default function TechCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-gray-700"
        aria-expanded={open}
      >
        <span className="font-medium">Powered by</span>
        <span className="text-xs text-gray-500">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <ul className="grid gap-2 text-sm">
            {items.map(({ label, href }) => (
              <li key={label} className="flex items-center justify-between">
                <span className="text-gray-400">{label}</span>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-300 underline hover:no-underline"
                >
                  docs
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-3 text-xs text-gray-500">
            Binance WS → Kafka → ksqlDB → Postgres → FastAPI (SSE) → Next.js (Recharts)
          </div>
        </div>
      )}
    </div>
  );
}
