'use client';

type Props = {
  symbols: string[];
  value: string | null;
  onChange: (s: string) => void;
};

export default function SymbolSelect({ symbols, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400">Symbol</label>
      <select
        className="rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {symbols.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
