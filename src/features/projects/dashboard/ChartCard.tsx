import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  height?: number;
  empty?: boolean;
  emptyText?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  height = 220,
  empty,
  emptyText = "暂无数据",
  children,
}: Props) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="mb-3">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ height }}>
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted)]">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}