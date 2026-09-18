import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Rocket,
  Check,
  RefreshCw,
  Loader2,
  BookOpen,
  Zap,
  Eye,
  Sparkles,
  Star,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { updateProject } from "@/lib/db";
import {
  createAttempt,
  countAttempts,
  markPublished,
  updateAttemptDraft,
} from "@/lib/coldStart";
import { pickProgressMessage } from "@/lib/coldStartQuotes";
import { pickCases, type ColdStartCase } from "@/lib/coldStartCases";
import { buildProjectContext } from "@/lib/aiContext";
import {
  streamChat,
  reviewDraft,
  rateDraft,
  type RateDraftResult,
} from "@/lib/ai";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

type Step =
  | "menu"
  | "case"
  | "quick"
  | "mirror"
  | "publish"
  | "feedback";

interface Props {
  project: Project;
  onComplete: () => void;
}

interface AiCfg {
  api_base: string;
  api_key: string;
  model: string;
  temperature: number;
}

const ANGLES = [
  "从「为什么我要做这个」开始。",
  "从「我遇到的一个具体小问题」开始。",
  "从「做这个的时候踩的一个坑」开始。",
  "从「一个具体的使用场景」开始。",
  "从「自己用了几天的真实感受」开始。",
  "从「一个朋友/用户的一句话」开始。",
  "从「和现有方案的一个对比」开始。",
  "从「一个我没想到的小细节」开始。",
  "从「做这件事花了我多久」开始。",
  "从「为什么我不想用现成方案」开始。",
  "从「一次失败的尝试」开始。",
  "从「一个反对意见或质疑」开始。",
];

function pickAngle(): string {
  const idx = Math.floor(Math.random() * ANGLES.length);
  return ANGLES[idx];
}

export function ColdStartPanel({ project, onComplete }: Props) {
  const { t } = useTranslation();
  const aiSettings = useSettingsStore(
    (s) => (s as unknown as { ai?: AiCfg }).ai
  );

  const [step, setStep] = useState<Step>("menu");
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cases, setCases] = useState<ColdStartCase[]>([]);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  /* ---- AI 反馈状态（不再用 ratingLoading，避免卡死） ---- */
  const [rating, setRating] = useState<RateDraftResult | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  /* ---- 从 aiSettings 抽出基本类型，作为 effect 依赖 ---- */
  const apiKey = aiSettings?.api_key ?? "";
  const apiBase = aiSettings?.api_base ?? "";
  const modelName = aiSettings?.model ?? "";
  const temperature = aiSettings?.temperature ?? 0.4;

  const publishStars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 100) / 14 + 3}%`,
        delay: `${i * 0.06}s`,
        emoji: ["✨", "⭐", "🌟"][i % 3],
      })),
    []
  );

  useEffect(() => {
    (async () => {
      const count = await countAttempts(project.id);
      setTotalAttempts(count);
    })();
  }, [project.id]);

  const refreshCases = useCallback(() => {
    setCases(pickCases(3));
    setExpandedCase(null);
  }, []);

  const enterCase = () => {
    if (cases.length === 0) refreshCases();
    setStep("case");
  };

  const ensureAttempt = async (): Promise<string | null> => {
    if (attemptId) return attemptId;
    try {
      const a = await createAttempt({
        project_id: project.id,
        track: null,
        pain: null,
        action: null,
        draft: "",
      });
      setAttemptId(a.id);
      return a.id;
    } catch (e) {
      console.error("[coldStart] create attempt failed", e);
      return null;
    }
  };

  const handleQuick = () => {
    setStep("quick");
  };

  const handleQuickGenerate = async () => {
    if (!apiKey) {
      setDraftError(t("coldStart.panel.noApiKey"));
      return;
    }
    setDrafting(true);
    setDraft("");
    setDraftError(null);

    const id = await ensureAttempt();

    try {
      let projectContext = "";
      try {
        projectContext = await buildProjectContext(project);
      } catch (e) {
        console.warn("[coldStart] buildProjectContext failed", e);
      }

      const angle = pickAngle();

      const messages = [
        {
          role: "system" as const,
          content: `你在帮一个独立开发者写一段社交平台内容。

【这一次的切入角度】
${angle}
必须按这个角度写。不要换。

【风格】
1. 第一人称。"我做了 X" / "最近在弄 X"
2. 平静、真诚，像开发者在朋友圈发帖
3. 具体场景，不要空话
4. 不承诺效果，不编造数字
5. 不出现营销词：超好用、强烈推荐、省时省力、必备、神器、快来试试
6. 不用客套称呼：您、亲、小伙伴、大家
7. 结尾最多 1 个标签，或干脆不加
8. 长度 80-120 字，语言跟随用户界面语言
9. 只输出正文，不要标题、不要解释、不要 markdown 标记

【如果用得上项目上下文】
信号来源、用户反馈、决策、学到的东西——优先用。
如果上下文是空的，就用你自己的语言组织，但保持具体，不要空泛。

【风格参考】
"写了个小工具，帮自己把散落各处的用户反馈整合到一块。以前用 Notion 手动搬，现在点一下就行。还没开源，先自己用几天看看。"`,
        },
        {
          role: "user" as const,
          content: `【项目名称】
${project.name}

【项目描述】
${project.description || "（无）"}

【用户补充】
${prompt || "（无）"}

【项目上下文】
${projectContext || "（暂无信号、决策、学习记录）"}

按上面指定的角度，写一段可以发的内容。`,
        },
      ];

      let acc = "";
      const handle = streamChat(
        {
          messages,
          purpose: "cold_start_draft",
          projectId: project.id,
          apiBase,
          apiKey,
          model: modelName,
          temperature: 1.0,
        },
        {
          onDelta: (d) => {
            acc += d;
            setDraft(acc);
          },
          onError: (msg) => setDraftError(msg),
        }
      );
      await handle.promise;
      if (acc && id) await updateAttemptDraft(id, acc);
      if (!acc && !draftError) setDraftError(t("coldStart.draft.empty"));
    } catch (e) {
      console.error(e);
      setDraftError(String(e));
    } finally {
      setDrafting(false);
    }
  };

  const handleMirror = () => {
    setStep("mirror");
    setDraft("");
    setReviewText("");
    setDraftError(null);
  };

  const handleReview = async () => {
    if (!apiKey) {
      setDraftError(t("coldStart.panel.noApiKey"));
      return;
    }
    if (!draft.trim()) return;

    setReviewing(true);
    setReviewText("");
    setDraftError(null);

    const id = await ensureAttempt();
    if (id) await updateAttemptDraft(id, draft);

    try {
      let projectContext = "";
      try {
        projectContext = await buildProjectContext(project);
      } catch (e) {
        console.warn("[coldStart] buildProjectContext failed", e);
      }

      let acc = "";
      await reviewDraft({
        draft,
        context: projectContext,
        settings: {
          api_base: apiBase,
          api_key: apiKey,
          model: modelName,
          temperature,
        },
        onDelta: (d) => {
          acc += d;
          setReviewText(acc);
        },
      });
      if (!acc && !draftError) setDraftError(t("coldStart.draft.empty"));
    } catch (e) {
      console.error(e);
      setDraftError(String(e));
    } finally {
      setReviewing(false);
    }
  };

  const goPublish = async () => {
    if (!draft.trim()) return;
    setStep("publish");
    if (attemptId) await markPublished(attemptId);
    setTimeout(() => {
      setStep("feedback");
    }, 2400);
  };

  /* ---- 进入 feedback 时让 AI 打分 ---- */
  useEffect(() => {
    if (step !== "feedback") return;
    if (rating) return;

    if (!apiKey) {
      setRateError(t("coldStart.panel.noApiKey"));
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setRateError(t("coldStart.feedback.timeout"));
      }
    }, 15000);

    (async () => {
      try {
        let projectContext = "";
        try {
          projectContext = await buildProjectContext(project);
        } catch {
          // ignore
        }

        const result = await rateDraft({
          draft,
          projectName: project.name,
          projectContext,
          settings: {
            api_base: apiBase,
            api_key: apiKey,
            model: modelName,
            temperature,
          },
        });

        if (cancelled) return;
        clearTimeout(timeoutId);
        setRating(result);

        const count = await countAttempts(project.id);
        if (!cancelled) setTotalAttempts(count);
      } catch (e) {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setRateError(String(e));
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    rating,
    apiKey,
    apiBase,
    modelName,
    temperature,
    draft,
    project.id,
    project.name,
  ]);

  const handleRetry = () => {
    setDraft("");
    setPrompt("");
    setReviewText("");
    setDraftError(null);
    setRating(null);
    setRateError(null);
    setAttemptId(null);
    setStep("menu");
  };

  const handleFinish = async (permanent: boolean = false) => {
    try {
      const md = JSON.parse(project.mode_data || "{}");
      if (permanent) {
        md.coldStartSeen = true;
      } else {
        md.coldStartDismissedAt = new Date().toISOString();
      }
      await updateProject(project.id, { mode_data: JSON.stringify(md) });
    } catch {
      // ignore
    }
    onComplete();
  };

  /* ---------------- 渲染 ---------------- */

  const renderMenu = () => (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted)]">
        {t("coldStart.menu.question")}
      </p>

      <button
        onClick={enterCase}
        className="flex w-full items-start gap-3 rounded-md border border-[var(--color-border)] p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-panel-2)]"
      >
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-strong)]">
            {t("coldStart.menu.case.title")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("coldStart.menu.case.desc")}
          </p>
        </div>
      </button>

      <button
        onClick={handleQuick}
        className="flex w-full items-start gap-3 rounded-md border border-[var(--color-border)] p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-panel-2)]"
      >
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-strong)]">
            {t("coldStart.menu.quick.title")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("coldStart.menu.quick.desc")}
          </p>
        </div>
      </button>

      <button
        onClick={handleMirror}
        className="flex w-full items-start gap-3 rounded-md border border-[var(--color-border)] p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-panel-2)]"
      >
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-strong)]">
            {t("coldStart.menu.mirror.title")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("coldStart.menu.mirror.desc")}
          </p>
        </div>
      </button>

      <div className="pt-2">
        <button
          onClick={() => handleFinish(false)}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          {t("coldStart.panel.dismiss")}
        </button>
      </div>
    </div>
  );

  const renderCase = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          {t("coldStart.case.hint")}
        </p>
        <button
          onClick={refreshCases}
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("coldStart.case.refresh")}
        </button>
      </div>

      <div className="space-y-2">
        {cases.map((c) => {
          const expanded = expandedCase === c.id;
          return (
            <div
              key={c.id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]"
            >
              <button
                onClick={() => setExpandedCase(expanded ? null : c.id)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--color-panel)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                    {c.source}
                  </span>
                  <span className="line-clamp-1 text-xs text-[var(--color-strong)]">
                    {c.content.slice(0, 30)}…
                  </span>
                </div>
              </button>
              {expanded && (
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-strong)]">
                    {c.content}
                  </p>
                  <p className="mt-3 border-l-2 border-[var(--color-accent)] pl-2 text-[11px] italic text-[var(--color-muted)]">
                    {c.whyItWorks}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-[var(--color-strong)]">
          {t("coldStart.case.writeYours")}
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder={t("coldStart.case.placeholder")}
          className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setStep("menu")}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          {t("coldStart.back")}
        </button>
        <button
          onClick={goPublish}
          disabled={!draft.trim()}
          className={cn(
            "flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90",
            !draft.trim() && "opacity-50"
          )}
        >
          <Check className="h-4 w-4" />
          {t("coldStart.draft.published")}
        </button>
      </div>
    </div>
  );

  const renderQuick = () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        {t("coldStart.quick.hint")}
      </p>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t("coldStart.quick.placeholder")}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />

      <p className="text-[11px] text-[var(--color-muted)]">
        {t("coldStart.quick.tip")}
      </p>

      {draftError && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {draftError}
        </div>
      )}

      {!draft && !drafting && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("menu")}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
          >
            {t("coldStart.back")}
          </button>
          <button
            onClick={handleQuickGenerate}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            {t("coldStart.quick.generate")}
          </button>
        </div>
      )}

      {(drafting || draft) && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-muted)]">
              {drafting ? t("coldStart.draft.writing") : t("coldStart.draft.label")}
            </span>
            {!drafting && (
              <button
                onClick={handleQuickGenerate}
                className="flex items-center gap-1 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-strong)]"
              >
                <RefreshCw className="h-3 w-3" />
                {t("coldStart.quick.regenerate")}
              </button>
            )}
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (attemptId && draft) void updateAttemptDraft(attemptId, draft);
            }}
            disabled={drafting}
            rows={5}
            className={cn(
              "w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]",
              drafting && "opacity-70"
            )}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDraft("");
                setStep("menu");
              }}
              disabled={drafting}
              className={cn(
                "text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]",
                drafting && "opacity-50"
              )}
            >
              {t("coldStart.back")}
            </button>
            <button
              onClick={goPublish}
              disabled={drafting || !draft.trim()}
              className={cn(
                "flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90",
                (drafting || !draft.trim()) && "opacity-50"
              )}
            >
              <Check className="h-4 w-4" />
              {t("coldStart.draft.published")}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderMirror = () => (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        {t("coldStart.mirror.hint")}
      </p>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        placeholder={t("coldStart.mirror.placeholder")}
        className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />

      {draftError && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {draftError}
        </div>
      )}

      {reviewText && (
        <div className="rounded-md border-l-2 border-[var(--color-accent)] bg-[var(--color-panel-2)] px-3 py-2">
          <p className="text-xs italic text-[var(--color-strong)]">
            {reviewText}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setReviewText("");
            setStep("menu");
          }}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          {t("coldStart.back")}
        </button>

        {!reviewText ? (
          <button
            onClick={handleReview}
            disabled={reviewing || !draft.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-panel-2)]",
              (reviewing || !draft.trim()) && "opacity-50"
            )}
          >
            {reviewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {reviewing ? t("coldStart.mirror.reviewing") : t("coldStart.mirror.review")}
          </button>
        ) : (
          <button
            onClick={goPublish}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            <Check className="h-4 w-4" />
            {t("coldStart.draft.published")}
          </button>
        )}
      </div>
    </div>
  );

  const renderPublish = () => (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-6 overflow-hidden py-16 text-center">
      {publishStars.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-0 text-base"
          style={{
            left: s.left,
            animation: `star-fall 1.8s ease-in ${s.delay} forwards`,
            opacity: 0,
          }}
        >
          {s.emoji}
        </span>
      ))}

      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/20"
        style={{ animation: "rocket-up 2.2s ease-out forwards" }}
      >
        <Rocket className="h-8 w-8 text-[var(--color-accent)]" />
      </div>

      <p
        className="text-base font-medium text-[var(--color-strong)]"
        style={{ animation: "text-fade-in 2.2s ease-out forwards", opacity: 0 }}
      >
        {t("coldStart.publish.done")}
      </p>
    </div>
  );

  const renderFeedback = () => {
    if (rateError) {
      return (
        <div className="space-y-5 py-6">
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
            {rateError}
          </div>
          <p className="text-center text-xs text-[var(--color-muted)]">
            {t("coldStart.feedback.fallbackHint")}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              {t("coldStart.retry.again")}
            </button>
            <button
              onClick={() => handleFinish(true)}
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-panel-2)]"
            >
              {t("coldStart.retry.done")}
            </button>
          </div>
        </div>
      );
    }

    if (!rating) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-muted)]">
            {t("coldStart.feedback.reading")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => {
            const active = s <= rating.score;
            return (
              <Star
                key={s}
                className={cn(
                  "h-7 w-7",
                  active
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-[var(--color-border)]"
                )}
              />
            );
          })}
        </div>

        <p className="text-center text-2xl font-semibold text-[var(--color-strong)]">
          {rating.score}
          <span className="ml-1 text-sm font-normal text-[var(--color-muted)]">
            / 5
          </span>
        </p>

        {rating.recognition && (
          <div className="rounded-md border-l-2 border-[var(--color-accent)] bg-[var(--color-panel-2)] px-4 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
              {t("coldStart.feedback.recognition")}
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-strong)]">
              {rating.recognition}
            </p>
          </div>
        )}

        {rating.direction && (
          <div className="rounded-md border-l-2 border-[var(--color-border)] bg-[var(--color-panel-2)] px-4 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
              {t("coldStart.feedback.direction")}
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-strong)]">
              {rating.direction}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-[var(--color-muted)]">
          {pickProgressMessage(totalAttempts)}
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            {t("coldStart.retry.again")}
          </button>
          <button
            onClick={() => handleFinish(true)}
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-panel-2)]"
          >
            {t("coldStart.retry.done")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-panel-2)]">
          <Rocket className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-[var(--color-strong)]">
            {t("coldStart.panel.title", { name: project.name })}
          </h2>
          {totalAttempts > 0 && (
            <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">
              {t("coldStart.panel.attempts", { n: totalAttempts })}
            </p>
          )}
        </div>
      </div>

      {step === "menu" && renderMenu()}
      {step === "case" && renderCase()}
      {step === "quick" && renderQuick()}
      {step === "mirror" && renderMirror()}
      {step === "publish" && renderPublish()}
      {step === "feedback" && renderFeedback()}
    </div>
  );
}