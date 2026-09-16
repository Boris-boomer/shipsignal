import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  Trash2,
  Sparkles,
  Square,
  Loader2,
  Play,
} from "lucide-react";
import { Button, Field, Select, Tabs } from "@/components/ui";
import { useAiStore, type ChatMessage } from "@/stores/aiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProjectStore } from "@/stores/projectStore";
import type { AiPurpose } from "@/lib/types";
import { HistoryPanel } from "./HistoryPanel";

const PURPOSE_OPTIONS: { value: AiPurpose; labelKey: string }[] = [
  { value: "general", labelKey: "ai.purpose.general" },
  { value: "signal_summary", labelKey: "ai.purpose.signal_summary" },
  { value: "channel_summary", labelKey: "ai.purpose.channel_summary" },
  { value: "distribution_draft", labelKey: "ai.purpose.distribution_draft" },
  { value: "lesson_summary", labelKey: "ai.purpose.lesson_summary" },
];

type TabKey = "chat" | "history";

export function AiPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>("chat");
  const loadUiPrefs = useAiStore((s) => s.loadUiPrefs);

  useEffect(() => {
    void loadUiPrefs();
  }, [loadUiPrefs]);

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-strong)]">
            {t("ai.title")}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("ai.subtitle")}
          </p>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "chat", label: t("ai.tab.chat") },
          { value: "history", label: t("ai.tab.history") },
        ]}
      />

      {tab === "chat" ? <ChatPanel /> : <HistoryPanel />}
    </div>
  );
}

/* ---------------- 对话面板 ---------------- */

function ChatPanel() {
  const { t } = useTranslation();
  const messages = useAiStore((s) => s.messages);
  const streaming = useAiStore((s) => s.streaming);
  const cancelling = useAiStore((s) => s.cancelling);
  const error = useAiStore((s) => s.error);
  const purpose = useAiStore((s) => s.purpose);
  const projectId = useAiStore((s) => s.projectId);
  const setPurpose = useAiStore((s) => s.setPurpose);
  const setProjectId = useAiStore((s) => s.setProjectId);
  const send = useAiStore((s) => s.send);
  const continueGeneration = useAiStore((s) => s.continueGeneration);
  const cancel = useAiStore((s) => s.cancel);
  const clear = useAiStore((s) => s.clear);

  const projects = useProjectStore((s) => s.projects);
  const apiKey = useSettingsStore((s) => s.ai.api_key);

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    await send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const noKey = !apiKey.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3">
          <Field label={t("ai.field.purpose")}>
            <Select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as AiPurpose)}
            >
              {PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("ai.field.project")}>
            <Select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
            >
              <option value="">{t("ai.field.project.none")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button
          variant="ghost"
          onClick={clear}
          disabled={messages.length === 0 || streaming}
          className="mt-4 shrink-0"
        >
          <Trash2 size="0.875rem" className="mr-1" />
          {t("ai.clear")}
        </Button>
      </div>

      {noKey && (
        <div className="rounded-md border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 px-3 py-2 text-xs text-[var(--color-warn)]">
          {t("ai.noApiKey")}
        </div>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]">
        <div
          ref={scrollRef}
          className="h-full space-y-3 overflow-y-auto p-4"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[var(--color-muted)]">
              <Sparkles size="1.75rem" className="mb-2 opacity-40" />
              <div>{t("ai.empty")}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              isLast={i === messages.length - 1}
              streaming={streaming}
              onContinue={continueGeneration}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("ai.input.placeholder")}
          rows={3}
          disabled={streaming}
          className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-strong)] outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
        />
        {streaming ? (
          <Button
            variant="secondary"
            onClick={cancel}
            disabled={cancelling}
            className="h-[76px] px-4"
            title={cancelling ? t("ai.cancel.stopping") : t("ai.cancel.title")}
          >
            {cancelling ? (
              <Loader2 size="1rem" className="animate-spin" />
            ) : (
              <Square size="1rem" />
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || noKey}
            className="h-[76px] px-4"
          >
            <Send size="1rem" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- 消息气泡 ---------------- */

function MessageBubble({
  message,
  isLast,
  streaming,
  onContinue,
}: {
  message: ChatMessage;
  isLast: boolean;
  streaming: boolean;
  onContinue: (id: string) => void;
}) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const isError = message.role === "error";

  const cls = isUser
    ? "bg-[var(--color-accent)]/20 text-[var(--color-strong)]"
    : isError
    ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/40"
    : "bg-[var(--color-panel)] text-[var(--color-strong)] border border-[var(--color-border)]";

  const showContinue =
    message.role === "assistant" &&
    message.interrupted === true &&
    !message.streaming &&
    !streaming &&
    isLast;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[80%] flex-col ${
          isUser ? "items-end" : "items-start"
        } gap-1.5`}
      >
        <div
          className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${cls}`}
        >
          {message.content || (message.streaming ? "…" : "")}
          {message.streaming && message.content && (
            <span className="ml-0.5 inline-block animate-pulse">▍</span>
          )}
        </div>
        {showContinue && (
          <button
            onClick={() => onContinue(message.id)}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1 text-[0.65rem] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-strong)]"
            title={t("ai.continue.title")}
          >
            <Play size={10} />
            {t("ai.continue")}
          </button>
        )}
      </div>
    </div>
  );
}