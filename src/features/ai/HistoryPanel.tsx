import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  History as HistoryIcon,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useProjectStore } from "@/stores/projectStore";
import {
  listAiInteractions,
  deleteAiInteraction,
} from "@/lib/db";
import type { AiInteraction } from "@/lib/types";

const PURPOSE_KEY: Record<string, string> = {
  general: "ai.purpose.general",
  signal_summary: "ai.purpose.signal_summary",
  channel_summary: "ai.purpose.channel_summary",
  distribution_draft: "ai.purpose.distribution_draft",
  lesson_summary: "ai.purpose.lesson_summary",
  structured_draft: "ai.purpose.structured_draft",
  draft_signal: "ai.purpose.draft_signal",
  draft_conversion: "ai.purpose.draft_conversion",
  draft_lesson: "ai.purpose.draft_lesson",
  draft_decision: "ai.purpose.draft_decision",
};

export function HistoryPanel() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [items, setItems] = useState<AiInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const list = await listAiInteractions(filterProjectId || null);
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProjectId]);

  async function handleDelete(id: string) {
    if (!confirm(t("history.confirm.delete"))) return;
    try {
      await deleteAiInteraction(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function projectName(id: string | null): string {
    if (!id) return t("history.project.none");
    const p = projects.find((x) => x.id === id);
    return p ? p.name : t("history.project.deleted");
  }

  function purposeLabel(purpose: string | null): string {
    if (!purpose) return "—";
    const key = PURPOSE_KEY[purpose];
    return key ? t(key) : purpose;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-3">
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
        >
          <option value="">{t("history.filter.all")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size="0.875rem" className="animate-spin" />
          ) : (
            <RefreshCw size="0.875rem" />
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]">
        {loading && items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted)]">
            {t("history.loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[var(--color-muted)]">
            <HistoryIcon size="1.75rem" className="mb-2 opacity-40" />
            <div>{t("history.empty.title")}</div>
            <div className="mt-1 text-xs">
              {t("history.empty.description")}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((it) => {
              const expanded = expandedId === it.id;
              return (
                <li key={it.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() =>
                        setExpandedId(expanded ? null : it.id)
                      }
                      className="mt-0.5 text-[var(--color-muted)] hover:text-[var(--color-strong)]"
                    >
                      {expanded ? (
                        <ChevronDown size="0.875rem" />
                      ) : (
                        <ChevronRight size="0.875rem" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6rem] text-[var(--color-muted)]">
                        <span>{formatTime(it.created_at)}</span>
                        <span>·</span>
                        <span>{purposeLabel(it.purpose)}</span>
                        <span>·</span>
                        <span className="truncate">
                          {projectName(it.project_id)}
                        </span>
                        {it.model && (
                          <>
                            <span>·</span>
                            <span className="truncate">{it.model}</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedId(expanded ? null : it.id)
                        }
                        className="mt-1 block w-full text-left"
                      >
                        <div className="truncate text-xs text-[var(--color-strong)]">
                          {it.prompt
                            ? truncate(it.prompt, 80)
                            : t("history.prompt.none")}
                        </div>
                        {!expanded && (
                          <div className="mt-0.5 truncate text-[0.65rem] text-[var(--color-muted)]">
                            {it.response
                              ? truncate(it.response, 120)
                              : t("history.response.none")}
                          </div>
                        )}
                      </button>

                      {expanded && (
                        <div className="mt-2 space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3">
                          <div>
                            <div className="mb-1 text-[0.6rem] font-medium text-[var(--color-accent)]">
                              {t("history.role.user")}
                            </div>
                            <div className="whitespace-pre-wrap text-xs text-[var(--color-strong)]">
                              {it.prompt ?? "—"}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-[0.6rem] font-medium text-[var(--color-accent-2)]">
                              AI
                            </div>
                            <div className="whitespace-pre-wrap text-xs text-[var(--color-strong)]">
                              {it.response ?? "—"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(it.id)}
                      className="mt-0.5 shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
                      title={t("history.delete")}
                    >
                      <Trash2 size="0.875rem" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="text-[0.6rem] text-[var(--color-muted)]">
        {t("history.footer.total", { n: items.length })}
        {filterProjectId
          ? t("history.footer.filtered")
          : t("history.footer.recent")}
      </div>
    </div>
  );
}

/* ---------------- 工具 ---------------- */

function truncate(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}