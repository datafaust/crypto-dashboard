'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import dayjs from 'dayjs';

export type ChartPoint = {
  timestamp: string;          // ISO
  actual_volume: number | null;
  predicted_volume: number | null;
};

type Props = {
  data: ChartPoint[];
  height?: number;
  // optional overrides
  actualColor?: string;       // e.g., '#06b6d4'
  predictedColor?: string;    // e.g., '#8b5cf6'
};

export default function Chart({
  data,
  height = 360,
  actualColor = '#06b6d4',     // cyan-500
  predictedColor = '#8b5cf6',  // violet-500
}: Props) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) => dayjs(v).format('HH:mm')}
            minTickGap={24}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm')}
            formatter={(val, name) => [val as number, name === 'actual_volume' ? 'Actual' : 'Predicted']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual_volume"
            name="Actual"
            dot={false}
            strokeWidth={2}
            stroke={actualColor}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="predicted_volume"
            name="Predicted"
            dot={false}
            strokeWidth={2}
            stroke={predictedColor}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
