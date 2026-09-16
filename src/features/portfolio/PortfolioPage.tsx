import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Anchor, Archive, Package, Snowflake, Activity } from "lucide-react";
import type { Project, ProjectStats, ProjectStatus } from "@/lib/types";
import { useProjectStore } from "@/stores/projectStore";
import { listProjectStats } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Group = "active" | "archived" | "frozen";

const GROUP_LABEL_KEY: Record<Group, string> = {
  active: "portfolio.group.active",
  archived: "portfolio.group.archived",
  frozen: "portfolio.group.frozen",
};

const GROUP_DESC_KEY: Record<Group, string> = {
  active: "portfolio.group.activeDesc",
  archived: "portfolio.group.archivedDesc",
  frozen: "portfolio.group.frozenDesc",
};

const MODE_KEY: Record<string, string> = {
  validate_first: "portfolio.mode.validateFirst",
  build_first: "portfolio.mode.buildFirst",
  portfolio: "portfolio.mode.portfolio",
};

const STATUS_KEY: Record<ProjectStatus, string> = {
  planning: "portfolio.status.planning",
  building: "portfolio.status.building",
  launched: "portfolio.status.launched",
  converting: "portfolio.status.converting",
  active: "portfolio.status.active",
  archived: "portfolio.status.archived",
  frozen: "portfolio.status.frozen",
};

const ACTIVE_STATUSES: ProjectStatus[] = [
  "planning",
  "building",
  "launched",
  "converting",
  "active",
];

function groupOf(status: ProjectStatus): Group {
  if (status === "archived") return "archived";
  if (status === "frozen") return "frozen";
  if (ACTIVE_STATUSES.includes(status)) return "active";
  return "active";
}

export function PortfolioPage() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const loadAll = useProjectStore((s) => s.loadAll);
  const [stats, setStats] = useState<Map<string, ProjectStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (projects.length === 0) {
      loadAll().catch(console.error);
    }
  }, [projects.length, loadAll]);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    listProjectStats()
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, ProjectStats>();
        for (const r of rows) map.set(r.project_id, r);
        setStats(map);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projects.length]);

  const grouped = useMemo(() => {
    const g: Record<Group, Project[]> = {
      active: [],
      archived: [],
      frozen: [],
    };
    for (const p of projects) {
      g[groupOf(p.status)].push(p);
    }
    return g;
  }, [projects]);

  const total = projects.length;

  if (projects.length === 0 && !loadingStats) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-strong)]">
            {t("portfolio.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("portfolio.subtitle")}
          </p>
        </div>
        <EmptyState
          title={t("portfolio.empty.title")}
          description={t("portfolio.empty.description")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-strong)]">
          {t("portfolio.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("portfolio.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label={t("portfolio.stat.total")}
          value={total}
          icon={<Package size="0.875rem" />}
          tone="neutral"
        />
        <StatCard
          label={t("portfolio.stat.active")}
          value={grouped.active.length}
          icon={<Activity size="0.875rem" />}
          tone="accent"
        />
        <StatCard
          label={t("portfolio.stat.archived")}
          value={grouped.archived.length}
          icon={<Anchor size="0.875rem" />}
          tone="success"
        />
        <StatCard
          label={t("portfolio.stat.frozen")}
          value={grouped.frozen.length}
          icon={<Snowflake size="0.875rem" />}
          tone="warn"
        />
      </div>

      {(["active", "archived", "frozen"] as Group[]).map((group) => {
        if (grouped[group].length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-[var(--color-strong)]">
                  {t(GROUP_LABEL_KEY[group])}
                </h3>
                <Badge tone="neutral">{grouped[group].length}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {t(GROUP_DESC_KEY[group])}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {grouped[group].map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  stats={stats.get(p.id)}
                  group={group}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ProjectCard({
  project,
  stats,
  group,
}: {
  project: Project;
  stats?: ProjectStats;
  group: Group;
}) {
  const { t } = useTranslation();
  const signalCount = stats?.signals ?? 0;
  const lessonCount = stats?.lessons ?? 0;

  const modeKey = MODE_KEY[project.mode];
  const statusKey = STATUS_KEY[project.status];

  return (
    <Link to={`/project/${project.id}`} className="block">
      <Card className="h-full p-4 transition-colors hover:border-[var(--color-accent)]/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[var(--color-strong)]">
              {project.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="accent">
                {modeKey ? t(modeKey) : project.mode}
              </Badge>
              <Badge tone="neutral">
                {statusKey ? t(statusKey) : project.status}
              </Badge>
              {project.entry && (
                <Badge tone="neutral">
                  {t("portfolio.card.entryBadge", { entry: project.entry })}
                </Badge>
              )}
            </div>
          </div>
          {group === "archived" && (
            <Archive
              size="1rem"
              className="mt-0.5 shrink-0 text-[var(--color-muted)]"
            />
          )}
        </div>

        {project.description && (
          <div className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">
            {project.description}
          </div>
        )}

        {group === "archived" && project.archive_reason && (
          <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-strong)]">
              {t("portfolio.card.archiveReason")}
            </span>
            {project.archive_reason}
          </div>
        )}

        {group === "archived" && project.sunset_conditions && (
          <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2 text-[0.6rem] text-[var(--color-muted)]">
            <span className="text-[var(--color-muted)]">
              {t("portfolio.card.sunset")}
            </span>
            <span className="line-clamp-2">{project.sunset_conditions}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-3">
            <span>{t("portfolio.card.signals", { n: signalCount })}</span>
            <span>{t("portfolio.card.lessons", { n: lessonCount })}</span>
          </div>
          <span>{formatDate(project.updated_at)}</span>
        </div>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "neutral" | "accent" | "success" | "warn";
}) {
  const color =
    tone === "accent"
      ? "text-[var(--color-accent)]"
      : tone === "success"
      ? "text-[var(--color-accent-2)]"
      : tone === "warn"
      ? "text-[var(--color-warn)]"
      : "text-[var(--color-strong)]";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </Card>
  );
}