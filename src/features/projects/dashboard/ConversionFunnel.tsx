import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelPoint } from "./useDashboardData";
import {
  ANIM_DURATION,
  AXIS_TICK,
  GRID_STROKE,
  TOOLTIP_STYLE,
} from "./chartTheme";

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4"];

export const ConversionFunnel = memo(function ConversionFunnel({
  data,
}: {
  data: FunnelPoint[];
}) {
  const total = data[0]?.value ?? 0;
  const withRate = data.map((d, i) => ({
    ...d,
    rate:
      i === 0 || total === 0 ? null : `${((d.value / total) * 100).toFixed(0)}%`,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={withRate}
        layout="vertical"
        margin={{ top: 10, right: 24, left: 24, bottom: 0 }}
        barCategoryGap="30%"
      >
        <defs>
          {FUNNEL_COLORS.map((c, i) => (
            <linearGradient
              key={i}
              id={`funGrad${i}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={c} stopOpacity={0.95} />
              <stop offset="100%" stopColor={c} stopOpacity={0.65} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="2 4"
          stroke={GRID_STROKE}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          width={72}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
          formatter={(value: number) => [`${value} 条`, ""]}
        />
        <Bar
          dataKey="value"
          radius={[0, 8, 8, 0]}
          animationDuration={ANIM_DURATION}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#funGrad${i})`} />
          ))}
          <LabelList
            dataKey="value"
            position="insideRight"
            offset={8}
            style={{
              fontSize: 12,
              fill: "#fff",
              fontWeight: 600,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});