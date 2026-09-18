import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check,
  SkipForward,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { ActionCard, AiSettings } from "@/lib/types";
import { listSignals, updateActionCardDraft } from "@/lib/db";
import { draftActionCard } from "@/lib/ai";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

interface Props {
  card: ActionCard;
  projectName: string;
  projectId: string;
  onDone: () => void;
  onSkip: () => void;
  onReplace: () => void;
  onDraftChange: (draft: string) => void;
}

export function ActionCardView({
  card,
  projectName,
  projectId,
  onDone,
  onSkip,
  onReplace,
  onDraftChange,
}: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(card.draft ?? "");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const aiSettings = useSettingsStore(
    (s) => (s as unknown as { ai?: AiSettings }).ai
  );

  useEffect(() => {
    setDraft(card.draft ?? "");
  }, [card.id, card.draft]);

  const wrap = async (fn: () => void | Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleBlur = () => {
    if ((card.draft ?? "") !== draft) {
      onDraftChange(draft);
    }
  };

  const handleDraft = async () => {
    if (drafting) return;
    if (!aiSettings?.api_key) {
      alert(t("today.draft.noApiKey"));
      return;
    }
    setDrafting(true);
    setDraft("");
    try {
      const ids: string[] = JSON.parse(card.source_signals || "[]");
      const all = await listSignals(projectId);
      const related = all.filter((s) => ids.includes(s.id));
      const context = related
        .map((s) => {
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(s.data || "{}");
          } catch {
            data = {};
          }
          return `- [${s.signal_type}] 来源：${s.source ?? "未知"}｜数据：${JSON.stringify(data)}`;
        })
        .join("\n");

      let acc = "";
      await draftActionCard({
        cardType: card.card_type,
        cardTitle: card.title,
        cardBody: card.body ?? "",
        signalsContext: context,
        settings: aiSettings,
        onDelta: (d) => {
          acc += d;
          setDraft(acc);
        },
      });

      if (acc) {
        await updateActionCardDraft(card.id, acc);
        onDraftChange(acc);
      }
    } catch (e) {
      console.error("[draftActionCard] failed", e);
      alert(String(e));
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      {/* 项目徽章 */}
      <div className="mb-3 flex items-center gap-2 text-xs">
        <Link
          to={`/project/${projectId}`}
          className="flex items-center gap-1 rounded-full bg-[var(--color-panel-2)] px-2 py-0.5 text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          <FolderOpen className="h-3 w-3" />
          {projectName}
        </Link>
        <span className="text-[var(--color-muted)]">· {t("today.title")}</span>
      </div>

      {/* 标题 */}
      <h2 className="mb-2 text-base font-semibold text-[var(--color-strong)]">
        {card.title}
      </h2>

      {/* 正文 */}
      {card.body && (
        <p className="mb-4 text-sm leading-relaxed text-[var(--color-muted)]">
          {card.body}
        </p>
      )}

      {/* 草稿区头部 */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          {t("today.draft.label")}
        </span>
        <button
          onClick={handleDraft}
          disabled={drafting || busy}
          className={cn(
            "flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs",
            "hover:bg-[var(--color-panel-2)]",
            (drafting || busy) && "opacity-60"
          )}
        >
          {drafting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {drafting ? t("today.draft.generating") : t("today.draft.generate")}
        </button>
      </div>

      {/* 草稿框 */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        disabled={drafting}
        placeholder={t("today.draft.placeholder")}
        rows={4}
        className={cn(
          "mb-4 min-h-[90px] w-full resize-none rounded-md border border-[var(--color-border)]",
          "bg-[var(--color-panel-2)] px-3 py-2 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]",
          drafting && "opacity-70"
        )}
      />

      {/* 操作 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => wrap(onDone)}
          disabled={busy || drafting}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
            "bg-[var(--color-accent)] text-white hover:opacity-90",
            (busy || drafting) && "opacity-60"
          )}
        >
          <Check className="h-4 w-4" />
          {t("today.done")}
        </button>
        <button
          onClick={() => wrap(onSkip)}
          disabled={busy || drafting}
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm",
            "hover:bg-[var(--color-panel-2)]",
            (busy || drafting) && "opacity-60"
          )}
        >
          <SkipForward className="h-4 w-4" />
          {t("today.skip")}
        </button>
        <button
          onClick={() => wrap(onReplace)}
          disabled={busy || drafting}
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm",
            "hover:bg-[var(--color-panel-2)]",
            (busy || drafting) && "opacity-60"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          {t("today.replace")}
        </button>
      </div>
    </div>
  );
}