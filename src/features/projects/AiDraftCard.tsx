import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useSettingsStore } from "@/stores/settingsStore";
import { draftEntity, extractJson, type DraftEntityType } from "@/lib/ai";

interface AiDraftCardProps {
  entityType: DraftEntityType;
  context: string;
  onConfirm: (draft: Record<string, unknown>) => Promise<void>;
  onClose?: () => void;
}

type Phase = "input" | "drafting" | "review" | "saving";

export function AiDraftCard({
  entityType,
  context,
  onConfirm,
  onClose,
}: AiDraftCardProps) {
  const { t } = useTranslation();
  const aiSettings = useSettingsStore((s) => s.ai);
  const [phase, setPhase] = useState<Phase>("input");
  const [rawText, setRawText] = useState("");
  const [streamOutput, setStreamOutput] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [streamOutput]);

  async function handleGenerate() {
    const text = rawText.trim();
    if (!text) return;

    if (!aiSettings.api_key.trim()) {
      setError(t("aidraft.noApiKey"));
      return;
    }

    setPhase("drafting");
    setStreamOutput("");
    setDraft(null);
    setError(null);

    try {
      const raw = await draftEntity({
        entityType,
        rawText: text,
        context,
        settings: aiSettings,
        onDelta: (delta) => setStreamOutput((s) => s + delta),
      });

      const parsed = extractJson(raw);
      if (!parsed) {
        setError(t("aidraft.parseFail"));
        setPhase("input");
        return;
      }

      setDraft(parsed);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("input");
    }
  }

  async function handleConfirm() {
    if (!draft) return;
    setPhase("saving");
    try {
      await onConfirm(draft);
      handleReset();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("review");
    }
  }

  function handleReset() {
    setPhase("input");
    setRawText("");
    setStreamOutput("");
    setDraft(null);
    setError(null);
  }

  return (
    <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-panel-2)]/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]">
          <Sparkles size="0.75rem" />
          {t("aidraft.title", { entity: t(entityLabelKey(entityType)) })}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-strong)]"
          >
            <X size="0.875rem" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-2 py-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {phase === "input" && (
        <>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t(placeholderKey(entityType))}
            rows={4}
            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-strong)] outline-none focus:border-[var(--color-accent)]"
          />
          <div className="mt-2 flex justify-end">
            <Button onClick={handleGenerate} disabled={!rawText.trim()}>
              <Sparkles size="0.875rem" className="mr-1" />
              {t("aidraft.action.generate")}
            </Button>
          </div>
        </>
      )}

      {phase === "drafting" && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Loader2 size="0.75rem" className="animate-spin" />
            {t("aidraft.drafting")}
          </div>
          <div
            ref={streamRef}
            className="max-h-32 overflow-auto whitespace-pre-wrap text-[0.6rem] leading-relaxed text-[var(--color-muted)]/70"
          >
            {streamOutput || "…"}
          </div>
        </div>
      )}

      {phase === "review" && draft && (
        <>
          <div className="space-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-xs">
            {Object.entries(draft).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
                <div className="text-[var(--color-muted)]">{k}</div>
                <div className="whitespace-pre-wrap text-[var(--color-strong)]">
                  {formatValue(v)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={handleReset}>
              <X size="0.875rem" className="mr-1" />
              {t("aidraft.action.reset")}
            </Button>
            <Button onClick={handleConfirm}>
              <Check size="0.875rem" className="mr-1" />
              {t("aidraft.action.confirm")}
            </Button>
          </div>
        </>
      )}

      {phase === "saving" && (
        <div className="flex items-center justify-center py-4 text-xs text-[var(--color-muted)]">
          <Loader2 size="0.875rem" className="mr-2 animate-spin" />
          {t("aidraft.saving")}
        </div>
      )}
    </div>
  );
}

function entityLabelKey(et: DraftEntityType): string {
  switch (et) {
    case "signal":
      return "entity.signal";
    case "conversion":
      return "entity.conversion";
    case "lesson":
      return "entity.lesson";
    case "decision":
      return "entity.decision";
  }
}

function placeholderKey(et: DraftEntityType): string {
  switch (et) {
    case "signal":
      return "aidraft.placeholder.signal";
    case "conversion":
      return "aidraft.placeholder.conversion";
    case "lesson":
      return "aidraft.placeholder.lesson";
    case "decision":
      return "aidraft.placeholder.decision";
  }
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v || "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  return JSON.stringify(v, null, 2);
}