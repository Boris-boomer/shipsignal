import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TypePoint } from "./useDashboardData";

export const SignalTypeBar = memo(function SignalTypeBar({
  data,
}: {
  data: TypePoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 12, left: -20, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="type"
          tick={{ fontSize: 10, fill: "var(--color-muted)" }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
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
          cursor={{ fill: "var(--color-panel-2)" }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});