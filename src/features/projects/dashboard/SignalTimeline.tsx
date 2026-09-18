import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelinePoint } from "./useDashboardData";

export const SignalTimeline = memo(function SignalTimeline({
  data,
}: {
  data: TimelinePoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="sigFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          interval="preserveStartEnd"
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          allowDecimals={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-panel)",
            border: "1px solid var(--color-border)",
            fontSize: 12,
            borderRadius: 6,
          }}
          labelStyle={{ color: "var(--color-muted)" }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#sigFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});