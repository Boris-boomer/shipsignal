import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Sparkles, Upload, Pencil, Trash2 } from "lucide-react";
import type { Conversion } from "@/lib/types";
import { useConversionStore } from "@/stores/conversionStore";
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
import { formatDate } from "@/lib/utils";
import { money } from "@/lib/format";
import { AiDraftCard } from "./AiDraftCard";
import { ImportDrawer, type ImportResult } from "./ImportDrawer";

export function ConversionsPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { conversions, loading, load, add, update, remove } =
    useConversionStore();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Conversion | null>(null);
  const [deleting, setDeleting] = useState<Conversion | null>(null);

  useEffect(() => {
    load(projectId).catch(console.error);
  }, [projectId, load]);

  const total = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const c of conversions) {
      if (c.amount == null) continue;
      grouped.set(c.currency, (grouped.get(c.currency) ?? 0) + c.amount);
    }
    return grouped;
  }, [conversions]);

  const aiContext = useMemo(() => {
    if (conversions.length === 0) return "（暂无已有转化记录）";
    return conversions
      .slice(0, 5)
      .map(
        (c) =>
          `- ${c.user_segment ?? "未知客群"}｜${c.monetization_form ?? "未标注"}｜${c.currency} ${c.amount ?? 0}`
      )
      .join("\n");
  }, [conversions]);

  function openOnly(which: "form" | "ai" | "import") {
    setOpen(which === "form" ? !open : false);
    setAiOpen(which === "ai" ? !aiOpen : false);
    setImportOpen(which === "import" ? !importOpen : false);
  }

  async function handleImport(items: unknown[]): Promise<ImportResult> {
    let succeeded = 0;
    const failed: { index: number; error: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        await add(items[i] as Omit<Conversion, "id" | "created_at">);
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

  async function handleUpdate(input: {
    user_segment: string | null;
    monetization_form: string | null;
    amount: number | null;
    currency: string;
    recurring: number;
    notes: string | null;
  }) {
    if (!editing) return;
    await update(editing.id, projectId, input);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await remove(deleting.id);
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-xs text-[var(--color-muted)]">
          {t("conversions.total")}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          {total.size === 0 ? (
            <span className="text-2xl font-semibold text-[var(--color-strong)]">—</span>
          ) : (
            Array.from(total.entries()).map(([cur, amt]) => (
              <span
                key={cur}
                className="text-2xl font-semibold text-[var(--color-accent-2)]"
              >
                {money(amt, cur)}
              </span>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t("conversions.card.title")}
          description={t("conversions.card.description")}
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={aiOpen ? "secondary" : "ghost"}
                onClick={() => openOnly("ai")}
              >
                <Sparkles size="0.75rem" />
                {t("conversions.action.aiDraft")}
              </Button>
              <Button
                size="sm"
                variant={importOpen ? "secondary" : "ghost"}
                onClick={() => openOnly("import")}
              >
                <Upload size="0.75rem" />
                {t("conversions.action.import")}
              </Button>
              <Button
                size="sm"
                variant={open ? "secondary" : "primary"}
                onClick={() => openOnly("form")}
              >
                <Plus size="0.75rem" />
                {open
                  ? t("conversions.action.collapse")
                  : t("conversions.action.new")}
              </Button>
            </div>
          }
        />
        {open && (
          <ConversionForm
            onSubmit={async (input) => {
              await add({ ...input, project_id: projectId });
              setOpen(false);
            }}
          />
        )}
        {aiOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <AiDraftCard
              entityType="conversion"
              context={aiContext}
              onClose={() => setAiOpen(false)}
              onConfirm={async (draft) => {
                const input = normalizeConversionDraft(draft, projectId);
                await add(input);
                setAiOpen(false);
              }}
            />
          </CardBody>
        )}
        {importOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <ImportDrawer
              entityType="conversion"
              projectId={projectId}
              onImport={handleImport}
              onClose={() => setImportOpen(false)}
            />
          </CardBody>
        )}
      </Card>

      {loading && conversions.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)]">
          {t("common.loading")}
        </div>
      ) : conversions.length === 0 ? (
        <EmptyState
          title={t("conversions.empty.title")}
          description={t("conversions.empty.description")}
        />
      ) : (
        <div className="space-y-2">
          {conversions.map((c) => (
            <Card key={c.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-strong)]">
                    {money(c.amount, c.currency)}
                    {c.recurring ? (
                      <span className="ml-2 text-xs text-[var(--color-muted)]">
                        {t("conversions.row.recurring")}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">
                    {c.user_segment ?? t("conversions.row.unknownSegment")} ·{" "}
                    {c.monetization_form ?? t("conversions.row.unknownForm")} ·{" "}
                    {formatDate(c.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge tone="success">{t("conversions.row.paid")}</Badge>
                  <button
                    onClick={() => setEditing(c)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
                    title={t("common.edit")}
                  >
                    <Pencil size="0.75rem" />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    title={t("common.delete")}
                  >
                    <Trash2 size="0.75rem" />
                  </button>
                </div>
              </div>
              {c.notes && (
                <div className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2 text-xs text-[var(--color-strong)]">
                  {c.notes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditConversionDialog
          conversion={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("conversions.delete.title")}
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

/* ---------------- 工具 ---------------- */

const MONETIZATION_FORM_MAP: Record<string, string> = {
  一次性买断: "one_time",
  买断: "one_time",
  一次性: "one_time",
  订阅: "subscription",
  持续付费: "subscription",
  "API 授权": "api_license",
  API授权: "api_license",
  定制开发: "custom_development",
  定制: "custom_development",
  源码授权: "source_license",
  源码: "source_license",
  其他: "other",
};

function normalizeMonetizationForm(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const s = v.trim();
  if (
    s === "one_time" ||
    s === "subscription" ||
    s === "api_license" ||
    s === "custom_development" ||
    s === "source_license" ||
    s === "other"
  ) {
    return s;
  }
  return MONETIZATION_FORM_MAP[s] ?? "other";
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeConversionDraft(
  draft: Record<string, unknown>,
  projectId: string
): {
  project_id: string;
  user_segment: string | null;
  monetization_form: string | null;
  amount: number | null;
  currency: string;
  recurring: number;
  notes: string | null;
} {
  const user_segment =
    typeof draft.user_segment === "string" && draft.user_segment.trim()
      ? draft.user_segment.trim()
      : null;

  const monetization_form = normalizeMonetizationForm(draft.monetization_form);
  const amount = parseAmount(draft.amount);

  let currency = "USD";
  if (typeof draft.currency === "string" && draft.currency.trim()) {
    const c = draft.currency.trim().toUpperCase();
    currency = c.length === 3 ? c : "USD";
  }

  let recurring = 0;
  if (draft.recurring === true || draft.recurring === 1) {
    recurring = 1;
  } else if (typeof draft.recurring === "number" && draft.recurring > 0) {
    recurring = 1;
  } else if (typeof draft.recurring === "string") {
    const s = draft.recurring.toLowerCase();
    if (s === "true" || s === "yes" || s === "1" || s.includes("订阅")) {
      recurring = 1;
    }
  }

  const notes =
    typeof draft.notes === "string" && draft.notes.trim()
      ? draft.notes.trim()
      : null;

  return {
    project_id: projectId,
    user_segment,
    monetization_form,
    amount,
    currency,
    recurring,
    notes,
  };
}

function ConversionForm({
  onSubmit,
}: {
  onSubmit: (input: {
    user_segment: string | null;
    monetization_form: string | null;
    amount: number | null;
    currency: string;
    recurring: number;
    notes: string | null;
  }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [segment, setSegment] = useState("");
  const [form, setForm] = useState("one_time");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handle() {
    setSaving(true);
    try {
      await onSubmit({
        user_segment: segment || null,
        monetization_form: form,
        amount: amount ? Number(amount) : null,
        currency,
        recurring: recurring ? 1 : 0,
        notes: notes || null,
      });
      setSegment("");
      setAmount("");
      setNotes("");
      setRecurring(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardBody className="space-y-3 border-t border-[var(--color-border)]">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("conversions.form.segment")}>
          <Input
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            placeholder={t("conversions.form.segmentPlaceholder")}
          />
        </Field>
        <Field label={t("conversions.form.monetizationForm")}>
          <Select value={form} onChange={(e) => setForm(e.target.value)}>
            <option value="one_time">{t("conversions.form.oneTime")}</option>
            <option value="subscription">
              {t("conversions.form.subscription")}
            </option>
            <option value="api_license">
              {t("conversions.form.apiLicense")}
            </option>
            <option value="custom_development">
              {t("conversions.form.customDev")}
            </option>
            <option value="source_license">
              {t("conversions.form.sourceLicense")}
            </option>
            <option value="other">{t("conversions.form.other")}</option>
          </Select>
        </Field>
        <Field label={t("conversions.form.amount")}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder={t("conversions.form.amountPlaceholder")}
          />
        </Field>
        <Field label={t("conversions.form.currency")}>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
        {t("conversions.form.recurring")}
      </label>

      <Field label={t("conversions.form.notes")}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </Field>

      <div className="flex justify-end">
        <Button onClick={handle} disabled={saving}>
          {saving ? t("common.saving") : t("conversions.form.save")}
        </Button>
      </div>
    </CardBody>
  );
}

/* ---------------- 编辑对话框 ---------------- */

function EditConversionDialog({
  conversion,
  onSave,
  onCancel,
}: {
  conversion: Conversion;
  onSave: (input: {
    user_segment: string | null;
    monetization_form: string | null;
    amount: number | null;
    currency: string;
    recurring: number;
    notes: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [segment, setSegment] = useState(conversion.user_segment ?? "");
  const [form, setForm] = useState(conversion.monetization_form ?? "one_time");
  const [amount, setAmount] = useState(
    conversion.amount != null ? String(conversion.amount) : ""
  );
  const [currency, setCurrency] = useState(conversion.currency || "USD");
  const [recurring, setRecurring] = useState(conversion.recurring === 1);
  const [notes, setNotes] = useState(conversion.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        user_segment: segment.trim() || null,
        monetization_form: form,
        amount: amount ? Number(amount) : null,
        currency,
        recurring: recurring ? 1 : 0,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("conversions.edit.title")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("conversions.form.segment")}>
            <Input
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder={t("conversions.form.segmentPlaceholder")}
            />
          </Field>
          <Field label={t("conversions.form.monetizationForm")}>
            <Select value={form} onChange={(e) => setForm(e.target.value)}>
              <option value="one_time">{t("conversions.form.oneTime")}</option>
              <option value="subscription">
                {t("conversions.form.subscription")}
              </option>
              <option value="api_license">
                {t("conversions.form.apiLicense")}
              </option>
              <option value="custom_development">
                {t("conversions.form.customDev")}
              </option>
              <option value="source_license">
                {t("conversions.form.sourceLicense")}
              </option>
              <option value="other">{t("conversions.form.other")}</option>
            </Select>
          </Field>
          <Field label={t("conversions.form.amount")}>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={t("conversions.form.amountPlaceholder")}
            />
          </Field>
          <Field label={t("conversions.form.currency")}>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
            </Select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          {t("conversions.form.recurring")}
        </label>

        <Field label={t("conversions.form.notes")}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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
            {saving
              ? t("conversions.edit.saving")
              : t("conversions.edit.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}