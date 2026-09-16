import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "@/stores/projectStore";
import { Plus, Package, ArrowRight } from "lucide-react";

export function DashboardPage() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const loading = useProjectStore((s) => s.loading);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-strong)]">
            {t("dashboard.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("dashboard.projectCount", { n: projects.length })}
          </p>
        </div>
        <Link
          to="/onboarding"
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white"
        >
          <Plus size="0.875rem" />
          {t("dashboard.newProject")}
        </Link>
      </div>

      {loading && projects.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)]">
          {t("common.loading")}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] py-16">
          <Package size="1.75rem" className="text-[var(--color-muted)]" />
          <div className="mt-3 text-sm text-[var(--color-strong)]">
            {t("dashboard.empty.title")}
          </div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            {t("dashboard.empty.description")}
          </div>
          <Link
            to="/onboarding"
            className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-strong)] hover:border-[var(--color-accent)]"
          >
            {t("dashboard.empty.action")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 transition-colors hover:border-[var(--color-accent)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--color-strong)]">
                    {p.name}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">
                    {p.mode} · {p.status}
                  </div>
                </div>
                <ArrowRight
                  size="1rem"
                  className="text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-accent)]"
                />
              </div>
              {p.description && (
                <p className="mt-3 line-clamp-2 text-xs text-[var(--color-muted)]">
                  {p.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}