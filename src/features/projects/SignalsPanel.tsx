import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Upload,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  Confidence,
  Signal,
  SignalInput,
  Verifiability,
} from "@/lib/types";
import { useSignalStore } from "@/stores/signalStore";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { confidenceLabelKey, confidenceTone } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import { AiDraftCard } from "./AiDraftCard";
import { ImportDrawer, type ImportResult } from "./ImportDrawer";

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asNumberish(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.length > 0) return v;
  return "—";
}

export function SignalsPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { signals, loading, load, add, update, remove, override } =
    useSignalStore();
  const [formOpen, setFormOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Signal | null>(null);
  const [deleting, setDeleting] = useState<Signal | null>(null);

  useEffect(() => {
    load(projectId).catch(console.error);
  }, [projectId, load]);

  const summary = useMemo(() => {
    const total = signals.length;
    const withPayment = signals.filter((s) => {
      try {
        return (
          (JSON.parse(s.data || "{}") as Record<string, unknown>)
            .payment_signal_present === true
        );
      } catch {
        return false;
      }
    }).length;
    const lowConf = signals.filter(
      (s) => s.suggested_confidence === "low"
    ).length;
    return { total, withPayment, lowConf };
  }, [signals]);

  const aiContext = useMemo(() => {
    if (signals.length === 0) return "（暂无已有信号）";
    return signals
      .slice(0, 5)
      .map((s) => {
        const conf =
          s.developer_confidence ?? s.suggested_confidence ?? "未评估";
        return `- [${s.signal_type}] 来源：${s.source ?? "未知"}｜可信度：${conf}`;
      })
      .join("\n");
  }, [signals]);

  function openOnly(which: "form" | "ai" | "import") {
    setFormOpen(which === "form" ? !formOpen : false);
    setAiOpen(which === "ai" ? !aiOpen : false);
    setImportOpen(which === "import" ? !importOpen : false);
  }

  async function handleImport(items: unknown[]): Promise<ImportResult> {
    let succeeded = 0;
    const failed: { index: number; error: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        await add(items[i] as SignalInput);
        succeeded++;
      } catch (e) {
        failed.push({
          index: i + 1,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return { succeeded, failed };
  }

  async function handleUpdate(input: SignalInput) {
    if (!editing) return;
    await update(editing.id, input);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await remove(deleting.id);
    setDeleting(null);
    if (expanded === deleting.id) setExpanded(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("signals.stat.total")} value={summary.total} />
        <StatCard
          label={t("signals.stat.withPayment")}
          value={summary.withPayment}
          tone="success"
        />
        <StatCard
          label={t("signals.stat.lowConf")}
          value={summary.lowConf}
          tone="warn"
        />
      </div>

      <Card>
        <CardHeader
          title={t("signals.card.title")}
          description={t("signals.card.description")}
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={aiOpen ? "secondary" : "ghost"}
                onClick={() => openOnly("ai")}
              >
                <Sparkles size="0.75rem" />
                {t("signals.action.aiDraft")}
              </Button>
              <Button
                size="sm"
                variant={importOpen ? "secondary" : "ghost"}
                onClick={() => openOnly("import")}
              >
                <Upload size="0.75rem" />
                {t("signals.action.import")}
              </Button>
              <Button
                size="sm"
                variant={formOpen ? "secondary" : "primary"}
                onClick={() => openOnly("form")}
              >
                <Plus size="0.75rem" />
                {formOpen
                  ? t("signals.action.collapse")
                  : t("signals.action.record")}
              </Button>
            </div>
          }
        />

        {formOpen && (
          <SignalForm
            onSubmit={async (input) => {
              await add({ ...input, project_id: projectId });
              setFormOpen(false);
            }}
          />
        )}

        {aiOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <AiDraftCard
              entityType="signal"
              context={aiContext}
              onClose={() => setAiOpen(false)}
              onConfirm={async (draft) => {
                const input = normalizeSignalDraft(draft, projectId);
                await add(input);
                setAiOpen(false);
              }}
            />
          </CardBody>
        )}

        {importOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <ImportDrawer
              entityType="signal"
              projectId={projectId}
              onImport={handleImport}
              onClose={() => setImportOpen(false)}
            />
          </CardBody>
        )}
      </Card>

      {loading && signals.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)]">
          {t("common.loading")}
        </div>
      ) : signals.length === 0 ? (
        <EmptyState
          title={t("signals.empty.title")}
          description={t("signals.empty.description")}
        />
      ) : (
        <div className="space-y-2">
          {signals.map((s) => (
            <SignalRow
              key={s.id}
              signal={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded((v) => (v === s.id ? null : s.id))}
              onOverride={override}
              onEdit={() => setEditing(s)}
              onDelete={() => setDeleting(s)}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditSignalDialog
          signal={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("signals.delete.title")}
          description={t("common.deleteConfirmBody")}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/* ---------------- 新增表单 ---------------- */

function normalizeSignalDraft(
  draft: Record<string, unknown>,
  projectId: string
): SignalInput {
  const signalType =
    typeof draft.signal_type === "string" && draft.signal_type
      ? draft.signal_type
      : "other";

  const source =
    typeof draft.source === "string" && draft.source ? draft.source : null;

  const rawVerifiability = draft.source_verifiability;
  const verifiability: Verifiability =
    rawVerifiability === "high" ||
    rawVerifiability === "medium" ||
    rawVerifiability === "low"
      ? rawVerifiability
      : "medium";

  const payment = draft.payment_signal_present === true;

  const rawData =
    draft.data && typeof draft.data === "object" && !Array.isArray(draft.data)
      ? { ...(draft.data as Record<string, unknown>) }
      : {};

  const notes = typeof draft.notes === "string" ? draft.notes : "";
  if (notes) rawData.notes = notes;
  rawData.payment_signal_present = payment;

  return {
    project_id: projectId,
    signal_type: signalType,
    source,
    source_verifiability: verifiability,
    payment_signal_present: payment,
    anomaly_flags: [],
    data: rawData,
  };
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warn";
}) {
  const color =
    tone === "success"
      ? "text-[var(--color-accent-2)]"
      : tone === "warn"
      ? "text-[var(--color-warn)]"
      : "text-[var(--color-strong)]";
  return (
    <Card className="p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </Card>
  );
}

function SignalForm({
  onSubmit,
}: {
  onSubmit: (input: {
    signal_type: string;
    source?: string;
    source_verifiability: Verifiability;
    payment_signal_present: boolean;
    anomaly_flags: string[];
    data: Record<string, unknown>;
  }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [signalType, setSignalType] = useState("click");
  const [source, setSource] = useState("");
  const [verifiability, setVerifiability] = useState<Verifiability>("medium");
  const [payment, setPayment] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handle() {
    setSaving(true);
    try {
      await onSubmit({
        signal_type: signalType,
        source: source || undefined,
        source_verifiability: verifiability,
        payment_signal_present: payment,
        anomaly_flags: [],
        data: {
          value: value ? Number(value) : undefined,
          notes: notes || undefined,
          payment_signal_present: payment,
        },
      });
      setSource("");
      setValue("");
      setNotes("");
      setPayment(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardBody className="space-y-3 border-t border-[var(--color-border)]">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("signals.form.signalType")}>
          <Select
            value={signalType}
            onChange={(e) => setSignalType(e.target.value)}
          >
            <option value="view">{t("signals.type.view")}</option>
            <option value="click">{t("signals.type.click")}</option>
            <option value="signup">{t("signals.type.signup")}</option>
            <option value="reply">{t("signals.type.reply")}</option>
            <option value="payment">{t("signals.type.payment")}</option>
            <option value="churn">{t("signals.type.churn")}</option>
            <option value="other">{t("signals.type.other")}</option>
          </Select>
        </Field>
        <Field label={t("signals.form.source")}>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={t("signals.form.sourcePlaceholder")}
          />
        </Field>
        <Field label={t("signals.form.verifiability")}>
          <Select
            value={verifiability}
            onChange={(e) => setVerifiability(e.target.value as Verifiability)}
          >
            <option value="high">{t("signals.verifiability.high")}</option>
            <option value="medium">{t("signals.verifiability.medium")}</option>
            <option value="low">{t("signals.verifiability.low")}</option>
          </Select>
        </Field>
        <Field label={t("signals.form.value")}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("signals.form.valuePlaceholder")}
            inputMode="numeric"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={payment}
          onChange={(e) => setPayment(e.target.checked)}
        />
        {t("signals.form.paymentCheckbox")}
      </label>

      <Field label={t("signals.form.notes")}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t("signals.form.notesPlaceholder")}
        />
      </Field>

      <div className="flex justify-end">
        <Button onClick={handle} disabled={saving}>
          {saving ? t("common.saving") : t("signals.form.save")}
        </Button>
      </div>
    </CardBody>
  );
}

/* ---------------- 编辑对话框 ---------------- */

function parseSignalForEdit(signal: Signal): {
  signal_type: string;
  source: string;
  verifiability: Verifiability;
  payment: boolean;
  value: string;
  notes: string;
} {
  let data: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(signal.data || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>;
    }
  } catch {
    // ignore
  }

  const value =
    typeof data.value === "number"
      ? String(data.value)
      : typeof data.value === "string"
      ? data.value
      : "";

  const notes = typeof data.notes === "string" ? data.notes : "";

  const payment = data.payment_signal_present === true;

  const verifiability: Verifiability =
    signal.source_verifiability === "high" ||
    signal.source_verifiability === "medium" ||
    signal.source_verifiability === "low"
      ? signal.source_verifiability
      : "medium";

  return {
    signal_type: signal.signal_type,
    source: signal.source ?? "",
    verifiability,
    payment,
    value,
    notes,
  };
}

function EditSignalDialog({
  signal,
  onSave,
  onCancel,
}: {
  signal: Signal;
  onSave: (input: SignalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const initial = useMemo(() => parseSignalForEdit(signal), [signal]);

  const [signalType, setSignalType] = useState(initial.signal_type);
  const [source, setSource] = useState(initial.source);
  const [verifiability, setVerifiability] = useState<Verifiability>(
    initial.verifiability
  );
  const [payment, setPayment] = useState(initial.payment);
  const [value, setValue] = useState(initial.value);
  const [notes, setNotes] = useState(initial.notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        project_id: signal.project_id,
        signal_type: signalType,
        source: source || null,
        source_verifiability: verifiability,
        payment_signal_present: payment,
        anomaly_flags: [],
        data: {
          value: value ? Number(value) : undefined,
          notes: notes || undefined,
          payment_signal_present: payment,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("signals.edit.title")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("signals.form.signalType")}>
            <Select
              value={signalType}
              onChange={(e) => setSignalType(e.target.value)}
            >
              <option value="view">{t("signals.type.view")}</option>
              <option value="click">{t("signals.type.click")}</option>
              <option value="signup">{t("signals.type.signup")}</option>
              <option value="reply">{t("signals.type.reply")}</option>
              <option value="payment">{t("signals.type.payment")}</option>
              <option value="churn">{t("signals.type.churn")}</option>
              <option value="other">{t("signals.type.other")}</option>
            </Select>
          </Field>
          <Field label={t("signals.form.source")}>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t("signals.form.sourcePlaceholder")}
            />
          </Field>
          <Field label={t("signals.form.verifiability")}>
            <Select
              value={verifiability}
              onChange={(e) =>
                setVerifiability(e.target.value as Verifiability)
              }
            >
              <option value="high">{t("signals.verifiability.high")}</option>
              <option value="medium">
                {t("signals.verifiability.medium")}
              </option>
              <option value="low">{t("signals.verifiability.low")}</option>
            </Select>
          </Field>
          <Field label={t("signals.form.value")}>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("signals.form.valuePlaceholder")}
              inputMode="numeric"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={payment}
            onChange={(e) => setPayment(e.target.checked)}
          />
          {t("signals.form.paymentCheckbox")}
        </label>

        <Field label={t("signals.form.notes")}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("signals.form.notesPlaceholder")}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t("signals.edit.saving") : t("signals.edit.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 信号行 ---------------- */

function SignalRow({
  signal,
  expanded,
  onToggle,
  onOverride,
  onEdit,
  onDelete,
}: {
  signal: Signal;
  expanded: boolean;
  onToggle: () => void;
  onOverride: (
    id: string,
    c: Confidence | "ignored",
    reason: string,
    impact: string
  ) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const data = useMemo<Record<string, unknown>>(() => {
    try {
      return JSON.parse(signal.data || "{}") as Record<string, unknown>;
    } catch {
      return {};
    }
  }, [signal.data]);

  const anomalyFlags = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(signal.anomaly_flags || "[]");
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }, [signal.anomaly_flags]);

  const finalConfidence: Confidence =
    (signal.developer_confidence ??
      signal.suggested_confidence ??
      "low") as Confidence;

  const notes = asString(data.notes);
  const valueLabel = asNumberish(data.value);

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <div
          className="flex flex-1 cursor-pointer items-center gap-3"
          onClick={onToggle}
        >
          <Badge tone="accent">{signal.signal_type}</Badge>
          <div className="text-sm text-[var(--color-strong)]">{valueLabel}</div>
          <div className="text-xs text-[var(--color-muted)]">
            {signal.source ?? t("common.noSource")} ·{" "}
            {formatDate(signal.created_at)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {anomalyFlags.length > 0 && (
            <Badge tone="danger">
              <ShieldAlert size="0.625rem" />
              {t("signals.row.anomaly")}
            </Badge>
          )}
          <Badge tone={confidenceTone(finalConfidence)}>
            {t(confidenceLabelKey(finalConfidence))}
          </Badge>
          {signal.developer_confidence && (
            <Badge tone="neutral">{t("signals.row.overridden")}</Badge>
          )}
          <button
            onClick={onEdit}
            className="rounded-md p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
            title={t("common.edit")}
          >
            <Pencil size="0.75rem" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
            title={t("common.delete")}
          >
            <Trash2 size="0.75rem" />
          </button>
          <button
            onClick={onToggle}
            className="rounded-md p-1 text-[var(--color-muted)] hover:text-[var(--color-strong)]"
          >
            {expanded ? (
              <ChevronUp size="0.875rem" />
            ) : (
              <ChevronDown size="0.875rem" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-[var(--color-border)] px-4 py-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[var(--color-muted)]">
                {t("signals.detail.autoSuggested")}
              </div>
              <div className="mt-0.5 text-[var(--color-strong)]">
                {signal.suggested_confidence ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[var(--color-muted)]">
                {t("signals.detail.sourceVerifiability")}
              </div>
              <div className="mt-0.5 text-[var(--color-strong)]">
                {signal.source_verifiability ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[var(--color-muted)]">
                {t("signals.detail.developerOverride")}
              </div>
              <div className="mt-0.5 text-[var(--color-strong)]">
                {signal.developer_confidence ??
                  t("signals.detail.notOverridden")}
              </div>
            </div>
          </div>

          {notes && (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-xs text-[var(--color-strong)]">
              {notes}
            </div>
          )}

          {signal.override_reason && (
            <div className="text-xs text-[var(--color-muted)]">
              {t("signals.detail.overrideReason", {
                reason: signal.override_reason,
              })}
            </div>
          )}

          <OverrideForm
            initial={signal.developer_confidence ?? undefined}
            onSubmit={(c, reason, impact) =>
              onOverride(signal.id, c, reason, impact)
            }
          />
        </div>
      )}
    </Card>
  );
}

function OverrideForm({
  initial,
  onSubmit,
}: {
  initial?: Confidence | "ignored";
  onSubmit: (
    c: Confidence | "ignored",
    reason: string,
    impact: string
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [confidence, setConfidence] = useState<Confidence | "ignored">(
    initial ?? "medium"
  );
  const [reason, setReason] = useState("");
  const [impact, setImpact] = useState("");
  const [saving, setSaving] = useState(false);

  async function handle() {
    setSaving(true);
    try {
      await onSubmit(confidence, reason, impact);
      setReason("");
      setImpact("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3">
      <div className="text-xs font-medium text-[var(--color-strong)]">
        {t("signals.override.title")}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={confidence}
          onChange={(e) =>
            setConfidence(e.target.value as Confidence | "ignored")
          }
          className="col-span-1"
        >
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
          <option value="ignored">ignored</option>
        </Select>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("signals.override.reasonPlaceholder")}
          className="col-span-2"
        />
      </div>
      <Input
        value={impact}
        onChange={(e) => setImpact(e.target.value)}
        placeholder={t("signals.override.impactPlaceholder")}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handle} disabled={saving}>
          {saving ? t("common.saving") : t("signals.override.save")}
        </Button>
      </div>
    </div>
  );
}