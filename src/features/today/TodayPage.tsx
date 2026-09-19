import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  Newspaper,
  Loader2,
  Tag,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  listActionCards,
  listSignals,
  listConversions,
  updateActionCardDraft,
  updateProject,
  getSetting,
  reviewDecision,
  listFeedKeywords,
} from "@/lib/db";
import {
  CARD_TYPES,
  ensureActionCard,
  markCardDone,
  markCardSkipped,
  replaceCard,
} from "@/lib/actionCards";
import type { ActionCard, AiSettings, Signal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRecentFeeds, refreshFeeds } from "@/lib/feeds";
import {
  extractKeywords,
  addManualKeyword,
  removeKeyword,
  clearKeywords,
} from "@/lib/feeds/keywords";
import { renderEmotion } from "@/lib/emotion";
import type { EmotionScene } from "@/lib/emotion";
import { getDueReviews, type DueReview } from "@/lib/review";
import type { ProjectDataLite as MistakeData } from "@/lib/mistakes";
import { PERSONAS } from "@/lib/persona";
import { ActionCardView } from "./ActionCardView";
import { EmptyState } from "./EmptyState";
import { ColdStartPanel } from "./ColdStartPanel";
import { MistakeBanner } from "./MistakeBanner";

const DAY_MS = 24 * 60 * 60 * 1000;
const COLD_START_THRESHOLD = 5;

const PRIORITY: Record<string, number> = {
  [CARD_TYPES.PAYMENT_PREPARE]: 0,
  [CARD_TYPES.BURST_FOLLOWUP]: 1,
  [CARD_TYPES.SILENCE_REACTIVATE]: 2,
  [CARD_TYPES.DEPTH_DEEPEN]: 3,
};

const CARD_TO_SCENE: Record<string, EmotionScene> = {
  [CARD_TYPES.PAYMENT_PREPARE]: "payment_precursor",
  [CARD_TYPES.BURST_FOLLOWUP]: "signal_burst",
  [CARD_TYPES.SILENCE_REACTIVATE]: "channel_silence",
  [CARD_TYPES.DEPTH_DEEPEN]: "channel_revisit",
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

function buildMistakeData(
  signals: Signal[],
  conversionsCount: number,
  buildHours: number,
  distributionHours: number
): MistakeData {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * DAY;
  const fourteenDaysAgo = now - 14 * DAY;

  const lastSignal = signals[0];
  const firstSignal = signals[signals.length - 1];

  const channels = new Set<string>();
  for (const s of signals) {
    if (s.source) channels.add(s.source);
  }

  const withPayment = signals.filter(
    (s) => s.signal_type === "payment"
  ).length;

  const last7 = signals.filter(
    (s) => Date.parse(s.created_at) >= sevenDaysAgo
  ).length;
  const prev7 = signals.filter(
    (s) =>
      Date.parse(s.created_at) >= fourteenDaysAgo &&
      Date.parse(s.created_at) < sevenDaysAgo
  ).length;

  return {
    signalCount: signals.length,
    conversionCount: conversionsCount,
    buildHours,
    distributionHours,
    daysSinceLastSignal: lastSignal
      ? Math.floor((now - Date.parse(lastSignal.created_at)) / DAY)
      : 0,
    daysSinceFirstSignal: firstSignal
      ? Math.floor((now - Date.parse(firstSignal.created_at)) / DAY)
      : 0,
    channelsWithSignals: channels.size,
    channelsWithConversion: withPayment > 0 ? 1 : 0,
    signalsLast7Days: last7,
    signalsPrevious7Days: prev7,
  };
}

export function TodayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const loadAllProjects = useProjectStore((s) => s.loadAll);
  const aiSettings = useSettingsStore(
    (s) => (s as unknown as { ai?: AiSettings }).ai
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [cards, setCards] = useState<Map<string, ActionCard>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signalCounts, setSignalCounts] = useState<Map<string, number> | null>(
    null
  );
  const [feedGreeting, setFeedGreeting] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedResult, setFeedResult] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<
    {
      id: string;
      title: string;
      url: string;
      source: string;
      summary: string | null;
    }[]
  >([]);
  const [showKeywordPanel, setShowKeywordPanel] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [dueReview, setDueReview] = useState<{
    review: DueReview;
    title: string;
    body: string;
  } | null>(null);
  const [cardEmotions, setCardEmotions] = useState<
    Map<string, { title: string; body: string }>
  >(new Map());
  const [mistakeData, setMistakeData] = useState<MistakeData | null>(null);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (p) => p.status !== "archived" && p.status !== "frozen"
      ),
    [projects]
  );

  const keywordProjectId = useMemo(() => {
    if (selectedProjectId === "all") return "__all__";
    return selectedProjectId;
  }, [selectedProjectId]);

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

  const loadFeedGreeting = useCallback(async () => {
    console.log("[feed-debug] query projectId =", keywordProjectId);
    const enabled = await getSetting("feeds_enabled");
    setFeedEnabled(enabled === "true");
    if (enabled !== "true") return;
    const feeds = await getRecentFeeds(keywordProjectId, 3);
    console.log(
      "[feed-debug] got",
      feeds.length,
      "greeting items for",
      keywordProjectId
    );
    if (feeds.length === 0) {
      setFeedGreeting(null);
      setFeedItems([]);
      return;
    }
    const out = renderEmotion("feed_greeting", { feedCount: feeds.length });
    setFeedGreeting(out);
    const recent = await getRecentFeeds(keywordProjectId, 10);
    console.log(
      "[feed-debug] got",
      recent.length,
      "list items for",
      keywordProjectId
    );
    setFeedItems(
      recent.map((f) => ({
        id: f.id,
        title: f.title,
        url: f.url,
        source: f.source,
        summary: f.summary,
      }))
    );
  }, [keywordProjectId]);

  useEffect(() => {
    void loadFeedGreeting();
  }, [loadFeedGreeting]);

  const loadKeywords = useCallback(async () => {
    const list = await listFeedKeywords(keywordProjectId);
    const manual = list.map((k) => k.keyword);
    const auto =
      keywordProjectId === "__all__"
        ? []
        : await extractKeywords(keywordProjectId);
    const merged = [...new Set([...manual, ...auto])];
    console.log(
      "[feed-debug] keywords for",
      keywordProjectId,
      "=",
      merged
    );
    setKeywords(merged);
  }, [keywordProjectId]);

  useEffect(() => {
    void loadKeywords();
  }, [loadKeywords]);

  useEffect(() => {
    (async () => {
      const m = new Map<string, { title: string; body: string }>();

      for (const card of cards.values()) {
        const scene = CARD_TO_SCENE[card.card_type];
        if (!scene) continue;

        const signals = await listSignals(card.project_id);
        let ids: string[] = [];
        try {
          ids = JSON.parse(card.source_signals || "[]");
        } catch {
          ids = [];
        }
        const related = signals.filter((s) => ids.includes(s.id));
        if (related.length === 0) continue;

        const ctx: any = {};
        if (scene === "channel_revisit" || scene === "channel_silence") {
          const ch = related[0]?.source;
          if (ch) ctx.channel = ch;
          const last = related[0]?.created_at;
          if (last) {
            ctx.daysAgo = Math.floor(
              (Date.now() - Date.parse(last)) / DAY_MS
            );
          }
          ctx.lastSignalCount = related.length;
        }
        if (scene === "signal_burst") {
          ctx.channel = related[0]?.source ?? "某渠道";
          ctx.signalCount = related.length;
        }
        if (scene === "payment_precursor") {
          const last = related[0];
          let note = "";
          try {
            const d = JSON.parse(last?.data ?? "{}");
            note = d.note ?? "";
          } catch {
            // ignore
          }
          if (note) ctx.newDetail = note;
        }

        const out = renderEmotion(scene, ctx);
        if (out.title) m.set(card.id, out);
      }

      setCardEmotions(m);

      if (activeProjects.length > 0) {
        const p = activeProjects[0];
        const signals = await listSignals(p.id);
        const convs = await listConversions(p.id);
        setMistakeData(
          buildMistakeData(
            signals,
            convs.length,
            p.build_hours,
            p.distribution_hours
          )
        );
      }
    })();
  }, [cards, activeProjects]);

  const handleAddKeyword = async () => {
    const k = newKeyword.trim();
    if (!k) return;
    await addManualKeyword(keywordProjectId, k);
    setKeywords((prev) => [...new Set([...prev, k])]);
    setNewKeyword("");
  };

  const handleRemoveKeyword = async (k: string) => {
    await removeKeyword(keywordProjectId, k);
    setKeywords((prev) => prev.filter((x) => x !== k));
  };

  const handleClearKeywords = async () => {
    await clearKeywords(keywordProjectId);
    setKeywords([]);
  };

  const handleApplyPersona = async (words: string[]) => {
    for (const k of words) {
      await addManualKeyword(keywordProjectId, k);
    }
    setKeywords((prev) => [...new Set([...prev, ...words])]);
  };

  const handleFeedRefresh = async () => {
    if (feedRefreshing) return;
    setFeedRefreshing(true);
    setFeedResult("拉取中…");
    try {
      const ks = await extractKeywords(keywordProjectId);
      console.log(
        "[feed-debug] refresh with keywords =",
        ks,
        "project =",
        keywordProjectId
      );
      if (ks.length === 0) {
        setFeedResult("没有关键词。先加几个。");
        return;
      }
      const n = await refreshFeeds(keywordProjectId, ks, aiSettings);
      await loadFeedGreeting();
      setFeedResult(
        n > 0
          ? `拉到 ${n} 条新内容`
          : `没匹配到新内容（关键词：${ks.slice(0, 5).join("、")}）`
      );
    } catch (e: any) {
      setFeedResult(`失败：${e?.message ?? e}`);
    } finally {
      setFeedRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (activeProjects.length === 0) return;
      for (const p of activeProjects) {
        const dues = await getDueReviews(p.id);
        if (dues.length === 0) continue;
        const d = dues[0];
        const out = renderEmotion("review_due", {
          decisionBasis: d.decision.basis ?? "——",
        });
        setDueReview({ review: d, title: out.title, body: out.body });
        return;
      }
    })();
  }, [activeProjects]);

  const handleReviewResolve = async (
    outcome: "confirmed" | "reversed"
  ) => {
    if (!dueReview) return;
    await reviewDecision(dueReview.review.decision.id, outcome);
    setDueReview(null);
  };

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

  const hasDismissedProject = useMemo(() => {
    return activeProjects.some((p) => {
      const signals = signalCounts?.get(p.id) ?? 0;
      if (signals >= COLD_START_THRESHOLD) return false;
      return isDismissedOnly(p.mode_data);
    });
  }, [activeProjects, signalCounts]);

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
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[var(--color-strong)]">
          {t("today.title")}
        </h1>
        <div className="flex items-center gap-2">
          {feedEnabled && (
            <button
              onClick={() => setShowKeywordPanel((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm",
                "hover:bg-[var(--color-panel-2)]",
                showKeywordPanel && "bg-[var(--color-panel-2)]"
              )}
            >
              <Tag className="h-4 w-4" />
              看看外面
            </button>
          )}
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
        </div>
      </div>

      {showKeywordPanel && feedEnabled && (
        <div className="space-y-3 border-b border-[var(--color-border)] bg-[var(--color-panel-2)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--color-muted)]">
              加关键词，点「拉取」，去 GitHub 和 RSS 上找相关内容。
            </div>
            <button
              onClick={handleFeedRefresh}
              disabled={feedRefreshing}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white",
                "hover:opacity-90",
                feedRefreshing && "opacity-60"
              )}
            >
              {feedRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Newspaper className="h-4 w-4" />
              )}
              {feedRefreshing ? "拉取中…" : "拉取"}
            </button>
          </div>

          {feedResult && (
            <div className="text-sm text-[var(--color-accent-2)]">
              {feedResult}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <Sparkles className="h-3.5 w-3.5" />
              一键加推荐关键词
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPersona(p.keywords)}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-xs text-[var(--color-strong)] hover:border-[var(--color-accent)]"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-xs text-[var(--color-muted)]">
                当前关键词
              </div>
              {keywords.length > 0 && (
                <button
                  onClick={handleClearKeywords}
                  className="flex items-center gap-1 rounded border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)] hover:border-red-500 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                  清空
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {keywords.map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5"
                >
                  <button
                    onClick={() => handleRemoveKeyword(k)}
                    className="shrink-0 text-[var(--color-muted)] hover:text-red-500"
                    title="删除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="truncate text-sm text-[var(--color-strong)]">
                    {k}
                  </span>
                </div>
              ))}
            </div>

            {keywords.length === 0 && (
              <div className="text-sm text-[var(--color-muted)]">
                还没有关键词。点上面推荐，或下面手动加。
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddKeyword();
                }}
                placeholder="+ 加关键词"
                className="w-56 rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-base"
              />
              {newKeyword && (
                <button
                  onClick={handleAddKeyword}
                  className="rounded border border-[var(--color-border)] px-3 py-1.5 text-base"
                >
                  添加
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      <div className="flex-1 overflow-auto p-6">
        {dueReview && !showColdStart && (
          <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
            <div className="text-sm font-medium text-[var(--color-strong)]">
              {dueReview.title}
            </div>
            <div className="mt-1 whitespace-pre-line text-xs text-[var(--color-muted)]">
              {dueReview.body}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleReviewResolve("confirmed")}
                className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs text-white"
              >
                当时判断对了
              </button>
              <button
                onClick={() => handleReviewResolve("reversed")}
                className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-[var(--color-panel-2)]"
              >
                后来推翻了这个判断
              </button>
            </div>
          </div>
        )}

        {mistakeData && !showColdStart && (
          <MistakeBanner data={mistakeData} />
        )}

        {feedGreeting && !showColdStart && (
          <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
            <div className="text-sm font-medium text-[var(--color-strong)]">
              {feedGreeting.title}
            </div>
            <div className="mt-1 whitespace-pre-line text-xs text-[var(--color-muted)]">
              {feedGreeting.body}
            </div>
          </div>
        )}

        {feedItems.length > 0 && !showColdStart && (
          <div className="mx-auto mb-4 max-w-2xl space-y-2">
            {feedItems.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-[var(--color-strong)]">
                    {f.title}
                  </div>
                  <div className="shrink-0 text-[10px] uppercase text-[var(--color-muted)]">
                    {f.source}
                  </div>
                </div>
                {f.summary && (
                  <div className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                    {f.summary}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

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
                  emotion={cardEmotions.get(card.id)}
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