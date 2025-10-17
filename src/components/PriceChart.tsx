'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';

export type PriceChartPoint = { timestamp: string; close: number };

export default function PriceChart({
  data,
  height = 220,
  stroke = '#60a5fa', // blue-400
  syncId = 'main-sync',
}: {
  data: PriceChartPoint[];
  height?: number;
  stroke?: string;
  syncId?: string;
}) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} syncId={syncId}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) => dayjs(v).format('HH:mm')}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v) => v.toLocaleString()}
          />
          {/* <Tooltip
            labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm')}
            formatter={(val) => [Number(val).toLocaleString(), 'Close']}
          /> */}
          <Tooltip
  labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm')}
            formatter={(val) => [Number(val).toLocaleString(), 'Close']}
  // 👇 style it
  contentStyle={{
    background: 'rgba(17, 24, 39, 0.95)', // bg-gray-900/95
    border: '1px solid #374151',           // border-gray-700
    borderRadius: 12,
    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
    color: '#e5e7eb',                      // text-gray-200
  }}
  labelStyle={{ color: '#9ca3af' }}        // text-gray-400
  itemStyle={{ color: '#e5e7eb' }}         // text-gray-200
/>
          <Line
            type="monotone"
            dataKey="close"
            name="Close"
            dot={false}
            strokeWidth={2}
            stroke={stroke}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
