"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  displayDate: string;
  sales: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload: { displayDate: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg">
        <p className="text-sm text-slate-500 mb-1">{payload[0].payload.displayDate}</p>
        <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
          {payload[0].value} ج.م
        </p>
      </div>
    );
  }
  return null;
}

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-[300px] w-full mt-4" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => `${value}`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
            activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
