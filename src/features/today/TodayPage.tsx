import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import {
  listActionCards,
  listSignals,
  updateActionCardDraft,
  updateProject,
} from "@/lib/db";
import {
  CARD_TYPES,
  ensureActionCard,
  markCardDone,
  markCardSkipped,
  replaceCard,
} from "@/lib/actionCards";
import type { ActionCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActionCardView } from "./ActionCardView";
import { EmptyState } from "./EmptyState";
import { ColdStartPanel } from "./ColdStartPanel";

const DAY_MS = 24 * 60 * 60 * 1000;
const COLD_START_THRESHOLD = 5;

const PRIORITY: Record<string, number> = {
  [CARD_TYPES.PAYMENT_PREPARE]: 0,
  [CARD_TYPES.BURST_FOLLOWUP]: 1,
  [CARD_TYPES.SILENCE_REACTIVATE]: 2,
  [CARD_TYPES.DEPTH_DEEPEN]: 3,
};

function isRecent(iso: string): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t) && Date.now() - t < DAY_MS;
}

function hasSeenColdStart(modeData: string): boolean {
  try {
    const md = JSON.parse(modeData || "{}");
    if (md.coldStartSeen === true) return true;
    if (md.coldStartDismissedAt) {
      const t = Date.parse(md.coldStartDismissedAt);
      if (Number.isFinite(t) && Date.now() - t < DAY_MS) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isDismissedOnly(modeData: string): boolean {
  try {
    const md = JSON.parse(modeData || "{}");
    return !!md.coldStartDismissedAt && !md.coldStartSeen;
  } catch {
    return false;
  }
}

export function TodayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const loadAllProjects = useProjectStore((s) => s.loadAll);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [cards, setCards] = useState<Map<string, ActionCard>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signalCounts, setSignalCounts] = useState<Map<string, number> | null>(
    null
  );

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (p) => p.status !== "archived" && p.status !== "frozen"
      ),
    [projects]
  );

  /* ---- 读数据 ---- */
  const loadExisting = useCallback(async () => {
    setLoading(true);
    try {
      const next = new Map<string, ActionCard>();
      const counts = new Map<string, number>();
      for (const p of activeProjects) {
        const list = await listActionCards(p.id);
        const pending = list.find(
          (c) => c.status === "pending" && isRecent(c.created_at)
        );
        if (pending) next.set(p.id, pending);
        const signals = await listSignals(p.id);
        counts.set(p.id, signals.length);
      }
      setCards(next);
      setSignalCounts(counts);
    } finally {
      setLoading(false);
    }
  }, [activeProjects]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  /* ---- 刷新（全量计算） ---- */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = new Map<string, ActionCard>();
      const counts = new Map<string, number>();
      for (const p of activeProjects) {
        const card = await ensureActionCard(p.id);
        if (card) next.set(p.id, card);
        const signals = await listSignals(p.id);
        counts.set(p.id, signals.length);
      }
      setCards(next);
      setSignalCounts(counts);
    } finally {
      setRefreshing(false);
    }
  }, [activeProjects]);

  /* ---- 当前显示哪张卡 ---- */
  const visibleCards = useMemo(() => {
    if (selectedProjectId === "all") {
      const all = Array.from(cards.values());
      all.sort((a, b) => {
        const pa = PRIORITY[a.card_type] ?? 99;
        const pb = PRIORITY[b.card_type] ?? 99;
        if (pa !== pb) return pa - pb;
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      });
      return all.slice(0, 1);
    }
    const c = cards.get(selectedProjectId);
    return c ? [c] : [];
  }, [cards, selectedProjectId]);

  /* ---- 当前是否显示冷启动 ---- */
  const coldStartProject = useMemo(() => {
    if (!signalCounts) return null;

    if (selectedProjectId === "all") {
      for (const p of activeProjects) {
        const signals = signalCounts.get(p.id) ?? 0;
        if (signals >= COLD_START_THRESHOLD) continue;
        if (hasSeenColdStart(p.mode_data)) continue;
        return p;
      }
      return null;
    }

    const p = activeProjects.find((x) => x.id === selectedProjectId);
    if (!p) return null;
    const signals = signalCounts.get(p.id) ?? 0;
    if (signals >= COLD_START_THRESHOLD) return null;
    if (hasSeenColdStart(p.mode_data)) return null;
    return p;
  }, [activeProjects, signalCounts, selectedProjectId]);

  const showColdStart = !loading && coldStartProject !== null;

  /* ---- 是否有「被暂时跳过」的项目，可让用户恢复 ---- */
  const hasDismissedProject = useMemo(() => {
    return activeProjects.some((p) => {
      const signals = signalCounts?.get(p.id) ?? 0;
      if (signals >= COLD_START_THRESHOLD) return false;
      return isDismissedOnly(p.mode_data);
    });
  }, [activeProjects, signalCounts]);

  /* ---- 重新显示冷启动 ---- */
  const handleRestartColdStart = async () => {
    for (const p of activeProjects) {
      const signals = signalCounts?.get(p.id) ?? 0;
      if (signals >= COLD_START_THRESHOLD) continue;
      if (!isDismissedOnly(p.mode_data)) continue;
      try {
        const md = JSON.parse(p.mode_data || "{}");
        delete md.coldStartDismissedAt;
        await updateProject(p.id, { mode_data: JSON.stringify(md) });
      } catch {
        // ignore
      }
    }
    await loadAllProjects();
  };

  /* ---- 卡片操作 ---- */
  const removeCardFromState = (card: ActionCard) => {
    setCards((prev) => {
      const next = new Map(prev);
      if (next.get(card.project_id)?.id === card.id) {
        next.delete(card.project_id);
      }
      return next;
    });
  };

  const handleDone = async (card: ActionCard) => {
    await markCardDone(card.id);
    removeCardFromState(card);
  };

  const handleSkip = async (card: ActionCard) => {
    await markCardSkipped(card.id);
    removeCardFromState(card);
  };

  const handleReplace = async (card: ActionCard) => {
    const newCard = await replaceCard(card.id);
    setCards((prev) => {
      const next = new Map(prev);
      if (newCard) {
        next.set(card.project_id, newCard);
      } else {
        next.delete(card.project_id);
      }
      return next;
    });
  };

  const handleDraftChange = async (card: ActionCard, draft: string) => {
    await updateActionCardDraft(card.id, draft);
    setCards((prev) => {
      const next = new Map(prev);
      next.set(card.project_id, { ...card, draft });
      return next;
    });
  };

  const handleRecord = () => {
    if (activeProjects.length > 0) {
      navigate(`/project/${activeProjects[0].id}`);
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[var(--color-strong)]">
          {t("today.title")}
        </h1>
        {!showColdStart && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm",
              "hover:bg-[var(--color-panel-2)]",
              refreshing && "opacity-60"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? t("today.refreshing") : t("today.refresh")}
          </button>
        )}
      </div>

      {/* 项目筛选 */}
      {activeProjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--color-border)] px-6 py-2">
          <button
            onClick={() => setSelectedProjectId("all")}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs",
              selectedProjectId === "all"
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-panel-2)] text-[var(--color-muted)] hover:text-[var(--color-strong)]"
            )}
          >
            {t("today.filter.all")}
          </button>
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                selectedProjectId === p.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-panel-2)] text-[var(--color-muted)] hover:text-[var(--color-strong)]"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-sm text-[var(--color-muted)]">…</div>
        ) : showColdStart && coldStartProject ? (
          <ColdStartPanel
            project={coldStartProject}
            onComplete={async () => {
              await loadAllProjects();
              void loadExisting();
            }}
          />
        ) : visibleCards.length === 0 ? (
          <EmptyState
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onRecord={handleRecord}
            onRestartColdStart={
              hasDismissedProject ? handleRestartColdStart : undefined
            }
          />
        ) : (
          <div className="mx-auto max-w-2xl">
            {visibleCards.map((card) => {
              const project = projects.find((p) => p.id === card.project_id);
              return (
                <ActionCardView
                  key={card.id}
                  card={card}
                  projectName={project?.name ?? ""}
                  projectId={card.project_id}
                  onDone={() => handleDone(card)}
                  onSkip={() => handleSkip(card)}
                  onReplace={() => handleReplace(card)}
                  onDraftChange={(d) => handleDraftChange(card, d)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}