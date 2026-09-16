import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, X, Check, Sparkles } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import type { Mode } from "@/lib/types";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  MODE_SCHEMAS,
  readField,
  writeField,
  hasAnyData,
  countFilled,
  type ModeSchemaDef,
} from "@/lib/modeData";
import { draftModeData } from "@/lib/ai";

interface ModeDataFormProps {
  mode: Mode;
  value: string;
  context: string;
  onSave: (next: string) => Promise<void>;
}

export function ModeDataForm({
  mode,
  value,
  context,
  onSave,
}: ModeDataFormProps) {
  const { t } = useTranslation();
  const schema = MODE_SCHEMAS[mode];
  const aiSettings = useSettingsStore((s) => s.ai);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiRaw, setAiRaw] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const hasData = hasAnyData(value);
  const { filled, total } = countFilled(value, schema);
  const busy = saving || aiDrafting;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      setAiError(null);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
    setAiError(null);
  }

  async function handleAiDraft() {
    if (aiDrafting) return;

    if (!aiSettings.api_key.trim()) {
      setAiError(t("mode.noApiKey"));
      setEditing(true);
      return;
    }

    if (!editing) setEditing(true);
    setAiDrafting(true);
    setAiRaw("");
    setAiError(null);

    try {
      const raw = await draftModeData({
        mode,
        schema,
        currentData: draft,
        context,
        settings: aiSettings,
        onDelta: (delta) => setAiRaw((r) => r + delta),
      });

      const parsed = extractJson(raw);
      if (!parsed) {
        setAiError(t("mode.aiParseError"));
        return;
      }

      const merged = mergeModeData(draft, parsed, schema);
      setDraft(merged);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiDrafting(false);
      setAiRaw("");
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <div className="text-sm font-medium text-[var(--color-strong)]">
            {t("mode.title")}
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("mode.filled", { filled, total })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleAiDraft} disabled={busy}>
            <Sparkles size="0.875rem" className="mr-1" />
            {aiDrafting ? t("mode.action.drafting") : t("mode.action.aiDraft")}
          </Button>
          {!editing ? (
            <Button
              variant="ghost"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil size="0.875rem" className="mr-1" />
              {hasData ? t("mode.action.edit") : t("mode.action.add")}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={busy}>
                <X size="0.875rem" className="mr-1" />
                {t("mode.action.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={busy}>
                <Check size="0.875rem" className="mr-1" />
                {saving ? t("mode.action.saving") : t("mode.action.save")}
              </Button>
            </>
          )}
        </div>
      </div>

      <CardBody>
        {aiError && (
          <div className="mb-3 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
            {aiError}
          </div>
        )}

        {aiDrafting && (
          <div className="mb-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2">
            <div className="mb-1 text-xs text-[var(--color-muted)]">
              {t("mode.aiDrafting")}
            </div>
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-[0.6rem] leading-relaxed text-[var(--color-muted)]/70">
              {aiRaw || "…"}
            </pre>
          </div>
        )}

        {!editing && !hasData && (
          <div className="py-4 text-center text-sm text-[var(--color-muted)]">
            {t("mode.empty")}
          </div>
        )}

        {!editing && hasData && (
          <div className="space-y-5">
            {schema.sections.map((section) => {
              const sectionFilled = section.fields.some((f) =>
                readField(value, `${section.key}.${f.key}`).trim()
              );
              if (!sectionFilled) return null;
              return (
                <div key={section.key}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    {t(section.titleKey)}
                  </div>
                  <dl className="space-y-2">
                    {section.fields.map((field) => {
                      const v = readField(value, `${section.key}.${field.key}`);
                      if (!v.trim()) return null;
                      return (
                        <div
                          key={field.key}
                          className="grid grid-cols-[140px_1fr] gap-3 text-sm"
                        >
                          <dt className="text-[var(--color-muted)]">
                            {t(field.labelKey)}
                          </dt>
                          <dd className="whitespace-pre-wrap text-[var(--color-strong)]">
                            {v}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              );
            })}
          </div>
        )}

        {editing && (
          <div className="space-y-6">
            {schema.sections.map((section) => (
              <div key={section.key}>
                <div className="mb-1 text-sm font-medium text-[var(--color-strong)]">
                  {t(section.titleKey)}
                </div>
                {section.descriptionKey && (
                  <div className="mb-3 text-xs text-[var(--color-muted)]">
                    {t(section.descriptionKey)}
                  </div>
                )}
                <div className="space-y-3">
                  {section.fields.map((field) => {
                    const path = `${section.key}.${field.key}`;
                    const v = readField(draft, path);
                    return (
                      <div key={field.key}>
                        <label className="mb-1 flex items-baseline gap-2">
                          <span className="text-xs text-[var(--color-muted)]">
                            {t(field.labelKey)}
                          </span>
                          {field.hintKey && (
                            <span className="text-[0.6rem] text-[var(--color-muted)]/70">
                              {t(field.hintKey)}
                            </span>
                          )}
                        </label>
                        {field.multiline ? (
                          <textarea
                            value={v}
                            onChange={(e) =>
                              setDraft(writeField(draft, path, e.target.value))
                            }
                            placeholder={
                              field.placeholderKey
                                ? t(field.placeholderKey)
                                : undefined
                            }
                            rows={4}
                            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] outline-none focus:border-[var(--color-accent)]"
                          />
                        ) : (
                          <input
                            value={v}
                            onChange={(e) =>
                              setDraft(writeField(draft, path, e.target.value))
                            }
                            placeholder={
                              field.placeholderKey
                                ? t(field.placeholderKey)
                                : undefined
                            }
                            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] outline-none focus:border-[var(--color-accent)]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function extractJson(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) text = codeBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function mergeModeData(
  current: string,
  ai: Record<string, unknown>,
  schema: ModeSchemaDef
): string {
  let cur: Record<string, unknown>;
  try {
    const parsed = JSON.parse(current || "{}");
    cur =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? { ...(parsed as Record<string, unknown>) }
        : {};
  } catch {
    cur = {};
  }

  for (const section of schema.sections) {
    const aiSection = ai[section.key];
    if (
      !aiSection ||
      typeof aiSection !== "object" ||
      Array.isArray(aiSection)
    ) {
      continue;
    }
    const curSection =
      cur[section.key] &&
      typeof cur[section.key] === "object" &&
      !Array.isArray(cur[section.key])
        ? { ...(cur[section.key] as Record<string, unknown>) }
        : {};
    for (const field of section.fields) {
      const v = (aiSection as Record<string, unknown>)[field.key];
      if (typeof v === "string" && v.trim()) {
        curSection[field.key] = v;
      }
    }
    cur[section.key] = curSection;
  }

  return JSON.stringify(cur);
}