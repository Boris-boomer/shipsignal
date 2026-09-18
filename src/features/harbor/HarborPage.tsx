import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  Lightbulb,
  Signal as SignalIcon,
  TrendingUp,
  Calendar,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { useProjectStore } from "@/stores/projectStore";
import { listHarborStats, type HarborStats } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui";

export function HarborPage() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const loadAll = useProjectStore((s) => s.loadAll);
  const [stats, setStats] = useState<Map<string, HarborStats>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projects.length === 0) loadAll().catch(console.error);
  }, [projects.length, loadAll]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listHarborStats()
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, HarborStats>();
        for (const r of rows) map.set(r.project_id, r);
        setStats(map);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projects.length]);

  const archived = useMemo(
    () => projects.filter((p) => p.status === "archived"),
    [projects]
  );

  const totals = useMemo(() => {
    const total = { signals: 0, lessons: 0 };
    const income: Record<string, number> = {};
    for (const p of archived) {
      const s = stats.get(p.id);
      if (!s) continue;
      total.signals += s.signals;
      total.lessons += s.lessons;
      for (const [cur, amt] of Object.entries(s.income_by_currency)) {
        income[cur] = (income[cur] ?? 0) + amt;
      }
    }
    return { ...total, income };
  }, [archived, stats]);

  if (!loading && archived.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-strong)]">{t("harbor.title")}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("harbor.subtitle")}
          </p>
        </div>
        <EmptyState
          title={t("harbor.empty.title")}
          description={t("harbor.empty.description")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-strong)]">{t("harbor.title")}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("harbor.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label={t("harbor.stat.products")}
          icon={<Anchor size="0.875rem" />}
          tone="success"
        >
          <div className="text-2xl font-semibold text-[var(--color-accent-2)]">
            {archived.length}
          </div>
        </StatCard>

        <StatCard
          label={t("harbor.stat.signals")}
          icon={<SignalIcon size="0.875rem" />}
        >
          <div className="text-2xl font-semibold text-[var(--color-strong)]">
            {totals.signals}
          </div>
        </StatCard>

        <StatCard
          label={t("harbor.stat.lessons")}
          icon={<Lightbulb size="0.875rem" />}
        >
          <div className="text-2xl font-semibold text-[var(--color-strong)]">
            {totals.lessons}
          </div>
        </StatCard>

        <IncomeStat income={totals.income} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {archived.map((p) => (
          <HarborCard key={p.id} project={p} stats={stats.get(p.id)} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- 子组件 ---------------- */

function StatCard({
  label,
  icon,
  tone,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  tone?: "success";
  children: React.ReactNode;
}) {
  const toneCls =
    tone === "success"
      ? "text-[var(--color-accent-2)]"
      : "text-[var(--color-muted)]";
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-1.5 text-xs ${toneCls}`}>
        {icon}
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </Card>
  );
}

function IncomeStat({ income }: { income: Record<string, number> }) {
  const { t } = useTranslation();
  const entries = Object.entries(income).filter(([, v]) => v > 0);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <TrendingUp size="0.875rem" />
        {t("harbor.stat.income")}
      </div>
      <div className="mt-1">
        {entries.length === 0 ? (
          <div className="text-2xl font-semibold text-[var(--color-muted)]">
            —
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries.map(([cur, amt]) => (
              <div
                key={cur}
                className="text-lg font-semibold leading-tight text-[var(--color-accent-2)]"
              >
                {cur} {formatNumber(amt)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function HarborCard({
  project,
  stats,
}: {
  project: Project;
  stats?: HarborStats;
}) {
  const { t } = useTranslation();
  const incomeEntries = Object.entries(
    stats?.income_by_currency ?? {}
  ).filter(([, v]) => v > 0);

  const lifespanDays = daysBetween(project.created_at, project.updated_at);

  return (
    <Link to={`/project/${project.id}`} className="block">
      <Card className="h-full p-4 transition-colors hover:border-[var(--color-accent-2)]/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--color-strong)]">
              {project.name}
            </div>
            {project.description && (
              <div className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                {project.description}
              </div>
            )}
          </div>
          <Anchor
            size="1rem"
            className="mt-0.5 shrink-0 text-[var(--color-accent-2)]"
          />
        </div>

        {project.archive_reason && (
          <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-2 text-[0.65rem]">
            <span className="text-[var(--color-muted)]">
              {t("harbor.card.archiveReason")}
            </span>
            <span className="text-[var(--color-strong)]">{project.archive_reason}</span>
          </div>
        )}

        {project.sunset_conditions && (
          <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-2 text-[0.65rem]">
            <span className="text-[var(--color-muted)]">
              {t("harbor.card.sunset")}
            </span>
            <span className="line-clamp-2 text-[var(--color-muted)]">
              {project.sunset_conditions}
            </span>
          </div>
        )}

        <div className="mt-3 grid grid-cols-4 gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/30 p-2 text-center">
          <MiniStat label={t("entity.signal")} value={stats?.signals ?? 0} />
          <MiniStat
            label={t("entity.conversion")}
            value={stats?.conversions ?? 0}
          />
          <MiniStat label={t("entity.lesson")} value={stats?.lessons ?? 0} />
          <MiniStat
            label={t("entity.decision")}
            value={stats?.decision_logs ?? 0}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-[var(--color-accent-2)]">
            {incomeEntries.length === 0 ? (
              <span className="text-[var(--color-muted)]">
                {t("harbor.card.noIncome")}
              </span>
            ) : (
              <span>
                {incomeEntries.map(([cur, amt], i) => (
                  <span key={cur}>
                    {i > 0 && " · "}
                    {cur} {formatNumber(amt)}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[var(--color-muted)]">
            <Calendar size={11} />
            <span>{t("harbor.card.days", { n: lifespanDays })}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-sm font-semibold text-[var(--color-strong)]">{value}</div>
      <div className="text-[0.6rem] text-[var(--color-muted)]">{label}</div>
    </div>
  );
}

/* ---------------- 工具 ---------------- */

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function daysBetween(a: string, b: string): number {
  try {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (isNaN(da) || isNaN(db)) return 0;
    const diff = Math.max(0, db - da);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}