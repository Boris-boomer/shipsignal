import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check, RotateCcw, Sparkles, Pencil, Trash2 } from "lucide-react";
import type { Confidence, DecisionLog, DecisionOutcome } from "@/lib/types";
import { useDecisionStore } from "@/stores/decisionStore";
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
import { AiDraftCard } from "./AiDraftCard";

export function DecisionsPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { decisions, loading, load, add, update, remove, review } =
    useDecisionStore();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<DecisionLog | null>(null);
  const [deleting, setDeleting] = useState<DecisionLog | null>(null);

  useEffect(() => {
    load(projectId).catch(console.error);
  }, [projectId, load]);

  const aiContext = useMemo(() => {
    if (decisions.length === 0) return "（暂无已有决策）";
    return decisions
      .slice(0, 5)
      .map((d) => `- ${d.decision}（${d.outcome}）`)
      .join("\n");
  }, [decisions]);

  async function handleUpdate(input: {
    decision: string;
    basis?: string | null;
    confidence?: Confidence | null;
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
      <Card>
        <CardHeader
          title={t("decisions.card.title")}
          description={t("decisions.card.description")}
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={aiOpen ? "secondary" : "ghost"}
                onClick={() => {
                  setAiOpen((v) => !v);
                  if (!aiOpen) setOpen(false);
                }}
              >
                <Sparkles size="0.75rem" />
                {t("decisions.action.aiDraft")}
              </Button>
              <Button
                size="sm"
                variant={open ? "secondary" : "primary"}
                onClick={() => {
                  setOpen((v) => !v);
                  if (!open) setAiOpen(false);
                }}
              >
                <Plus size="0.75rem" />
                {open
                  ? t("decisions.action.collapse")
                  : t("decisions.action.new")}
              </Button>
            </div>
          }
        />
        {open && (
          <DecisionForm
            onSubmit={async (input) => {
              await add({ ...input, project_id: projectId });
              setOpen(false);
            }}
          />
        )}
        {aiOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <AiDraftCard
              entityType="decision"
              context={aiContext}
              onClose={() => setAiOpen(false)}
              onConfirm={async (draft) => {
                const input = normalizeDecisionDraft(draft, projectId);
                await add(input);
                setAiOpen(false);
              }}
            />
          </CardBody>
        )}
      </Card>

      {loading && decisions.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)]">
          {t("common.loading")}
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          title={t("decisions.empty.title")}
          description={t("decisions.empty.description")}
        />
      ) : (
        <div className="space-y-2">
          {decisions.map((d) => (
            <Card key={d.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-strong)]">{d.decision}</div>
                  {d.basis && (
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      {t("decisions.row.basis", { basis: d.basis })}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <span>{formatDate(d.created_at)}</span>
                    {d.confidence && (
                      <Badge tone="neutral">
                        {t("decisions.row.confidence", {
                          level: d.confidence,
                        })}
                      </Badge>
                    )}
                    <OutcomeBadge outcome={d.outcome} />
                  </div>
                </div>
                <div className="flex gap-1">
                  {d.outcome === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => review(d.id, "confirmed")}
                      >
                        <Check size="0.75rem" />
                        {t("decisions.action.verify")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => review(d.id, "reversed")}
                      >
                        <RotateCcw size="0.75rem" />
                        {t("decisions.action.reverse")}
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setEditing(d)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
                    title={t("common.edit")}
                  >
                    <Pencil size="0.75rem" />
                  </button>
                  <button
                    onClick={() => setDeleting(d)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    title={t("common.delete")}
                  >
                    <Trash2 size="0.75rem" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditDecisionDialog
          decision={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("decisions.delete.title")}
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

function normalizeDecisionDraft(
  draft: Record<string, unknown>,
  projectId: string
): {
  project_id: string;
  decision: string;
  basis: string | null;
  confidence: Confidence | null;
} {
  const decision =
    typeof draft.decision === "string" ? draft.decision.trim() : "";
  const basis =
    typeof draft.basis === "string" && draft.basis.trim()
      ? draft.basis.trim()
      : null;

  const rawConf = draft.confidence;
  const confidence: Confidence | null =
    rawConf === "high" || rawConf === "medium" || rawConf === "low"
      ? rawConf
      : null;

  return { project_id: projectId, decision, basis, confidence };
}

function OutcomeBadge({ outcome }: { outcome: DecisionOutcome }) {
  const { t } = useTranslation();
  if (outcome === "confirmed")
    return <Badge tone="success">{t("decisions.row.outcome.confirmed")}</Badge>;
  if (outcome === "reversed")
    return <Badge tone="danger">{t("decisions.row.outcome.reversed")}</Badge>;
  return <Badge tone="warn">{t("decisions.row.outcome.pending")}</Badge>;
}

function DecisionForm({
  onSubmit,
}: {
  onSubmit: (input: {
    decision: string;
    basis: string;
    confidence: Confidence;
  }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [decision, setDecision] = useState("");
  const [basis, setBasis] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("medium");
  const [saving, setSaving] = useState(false);

  async function handle() {
    if (!decision.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ decision, basis, confidence });
      setDecision("");
      setBasis("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardBody className="space-y-3 border-t border-[var(--color-border)]">
      <Field label={t("decisions.form.decision")}>
        <Input
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder={t("decisions.form.decisionPlaceholder")}
        />
      </Field>
      <Field label={t("decisions.form.basis")}>
        <Textarea
          value={basis}
          onChange={(e) => setBasis(e.target.value)}
          rows={3}
          placeholder={t("decisions.form.basisPlaceholder")}
        />
      </Field>
      <Field label={t("decisions.form.confidence")}>
        <Select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as Confidence)}
        >
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button onClick={handle} disabled={saving || !decision.trim()}>
          {saving ? t("common.saving") : t("decisions.form.save")}
        </Button>
      </div>
    </CardBody>
  );
}

/* ---------------- 编辑对话框 ---------------- */

function EditDecisionDialog({
  decision,
  onSave,
  onCancel,
}: {
  decision: DecisionLog;
  onSave: (input: {
    decision: string;
    basis?: string | null;
    confidence?: Confidence | null;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [decisionText, setDecisionText] = useState(decision.decision);
  const [basis, setBasis] = useState(decision.basis ?? "");
  const [confidence, setConfidence] = useState<Confidence | "">(
    decision.confidence ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!decisionText.trim()) return;
    setSaving(true);
    try {
      await onSave({
        decision: decisionText.trim(),
        basis: basis.trim() || null,
        confidence: confidence || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("decisions.edit.title")}
        </div>

        <Field label={t("decisions.form.decision")}>
          <Input
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            placeholder={t("decisions.form.decisionPlaceholder")}
          />
        </Field>
        <Field label={t("decisions.form.basis")}>
          <Textarea
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            rows={3}
            placeholder={t("decisions.form.basisPlaceholder")}
          />
        </Field>
        <Field label={t("decisions.form.confidence")}>
          <Select
            value={confidence}
            onChange={(e) =>
              setConfidence(e.target.value as Confidence | "")
            }
          >
            <option value="">—</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </Select>
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
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !decisionText.trim()}
          >
            {saving ? t("decisions.edit.saving") : t("decisions.edit.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}