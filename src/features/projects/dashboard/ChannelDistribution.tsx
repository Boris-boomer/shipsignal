import { memo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChannelPoint } from "./useDashboardData";
import { ANIM_DURATION, CHART_COLORS, TOOLTIP_STYLE } from "./chartTheme";

export const ChannelDistribution = memo(function ChannelDistribution({
  data,
}: {
  data: ChannelPoint[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);

  // 只在占比 >= 5% 的扇区上显示标签，避免小扇区挤在一起
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } =
      props;
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="channel"
            cx="50%"
            cy="50%"
            outerRadius={78}
            innerRadius={48}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            animationDuration={ANIM_DURATION}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [
              `${value} 条 (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 中心总数 */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-semibold text-[var(--color-strong)]">
          {total}
        </div>
        <div className="text-[10px] text-[var(--color-muted)]">信号</div>
      </div>

      {/* 图例，带数值 */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {data.map((d, i) => (
          <div key={d.channel} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-[10px] text-[var(--color-muted)]">
              {d.channel}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-strong)]">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});