import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Sparkles, Pencil, Trash2 } from "lucide-react";
import type { Lesson, LessonType } from "@/lib/types";
import { useLessonStore } from "@/stores/lessonStore";
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

const typeTone: Record<LessonType, "success" | "danger" | "accent"> = {
  validated: "success",
  invalidated: "danger",
  discovered: "accent",
};

const typeLabelKey: Record<LessonType, string> = {
  validated: "lessons.type.validated",
  invalidated: "lessons.type.invalidated",
  discovered: "lessons.type.discovered",
};

export function LessonsPanel({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { lessons, loading, load, add, update, remove } = useLessonStore();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState<Lesson | null>(null);

  useEffect(() => {
    load(projectId).catch(console.error);
  }, [projectId, load]);

  const grouped = useMemo(() => {
    const groups: Record<LessonType, typeof lessons> = {
      validated: [],
      invalidated: [],
      discovered: [],
    };
    for (const l of lessons) {
      groups[l.lesson_type].push(l);
    }
    return groups;
  }, [lessons]);

  const aiContext = useMemo(() => {
    if (lessons.length === 0) return "（暂无已有学习信号）";
    return lessons
      .slice(0, 5)
      .map((l) => `- [${l.lesson_type}] ${l.description}`)
      .join("\n");
  }, [lessons]);

  async function handleUpdate(input: {
    lesson_type: LessonType;
    description: string;
    applicable_to?: string[];
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
          title={t("lessons.card.title")}
          description={t("lessons.card.description")}
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
                {t("lessons.action.aiDraft")}
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
                  ? t("lessons.action.collapse")
                  : t("lessons.action.new")}
              </Button>
            </div>
          }
        />
        {open && (
          <LessonForm
            onSubmit={async (input) => {
              await add({ ...input, project_id: projectId });
              setOpen(false);
            }}
          />
        )}
        {aiOpen && (
          <CardBody className="border-t border-[var(--color-border)]">
            <AiDraftCard
              entityType="lesson"
              context={aiContext}
              onClose={() => setAiOpen(false)}
              onConfirm={async (draft) => {
                const input = normalizeLessonDraft(draft, projectId);
                await add(input);
                setAiOpen(false);
              }}
            />
          </CardBody>
        )}
      </Card>

      {loading && lessons.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)]">
          {t("common.loading")}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          title={t("lessons.empty.title")}
          description={t("lessons.empty.description")}
        />
      ) : (
        <div className="space-y-4">
          {(Object.keys(grouped) as LessonType[]).map((type) =>
            grouped[type].length === 0 ? null : (
              <div key={type}>
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={typeTone[type]}>{t(typeLabelKey[type])}</Badge>
                  <span className="text-xs text-[var(--color-muted)]">
                    {t("lessons.count", { n: grouped[type].length })}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[type].map((l) => (
                    <Card key={l.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-[var(--color-strong)]">
                            {l.description}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-muted)]">
                            {formatDate(l.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditing(l)}
                            className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-panel-2)] hover:text-[var(--color-strong)]"
                            title={t("common.edit")}
                          >
                            <Pencil size="0.75rem" />
                          </button>
                          <button
                            onClick={() => setDeleting(l)}
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
              </div>
            )
          )}
        </div>
      )}

      {editing && (
        <EditLessonDialog
          lesson={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("lessons.delete.title")}
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

function normalizeLessonDraft(
  draft: Record<string, unknown>,
  projectId: string
): {
  project_id: string;
  lesson_type: LessonType;
  description: string;
  applicable_to: string[];
} {
  const rawType = draft.lesson_type;
  const lesson_type: LessonType =
    rawType === "validated" ||
    rawType === "invalidated" ||
    rawType === "discovered"
      ? rawType
      : "discovered";

  const description =
    typeof draft.description === "string" ? draft.description.trim() : "";

  let applicable_to: string[] = [];
  const rawApplicable = draft.applicable_to;
  if (Array.isArray(rawApplicable)) {
    applicable_to = rawApplicable
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
  } else if (typeof rawApplicable === "string" && rawApplicable.trim()) {
    applicable_to = rawApplicable
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return { project_id: projectId, lesson_type, description, applicable_to };
}

function parseApplicable(json: string): string {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string").join(", ");
    }
  } catch {
    // ignore
  }
  return "";
}

function LessonForm({
  onSubmit,
}: {
  onSubmit: (input: {
    lesson_type: LessonType;
    description: string;
    applicable_to: string[];
  }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<LessonType>("validated");
  const [description, setDescription] = useState("");
  const [applicable, setApplicable] = useState("");
  const [saving, setSaving] = useState(false);

  async function handle() {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        lesson_type: type,
        description,
        applicable_to: applicable
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setDescription("");
      setApplicable("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CardBody className="space-y-3 border-t border-[var(--color-border)]">
      <Field label={t("lessons.form.type")}>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as LessonType)}
        >
          <option value="validated">{t("lessons.type.validated")}</option>
          <option value="invalidated">{t("lessons.type.invalidated")}</option>
          <option value="discovered">{t("lessons.type.discovered")}</option>
        </Select>
      </Field>
      <Field label={t("lessons.form.description")}>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t("lessons.form.descriptionPlaceholder")}
        />
      </Field>
      <Field label={t("lessons.form.applicableTo")}>
        <Input
          value={applicable}
          onChange={(e) => setApplicable(e.target.value)}
          placeholder={t("lessons.form.applicablePlaceholder")}
        />
      </Field>
      <div className="flex justify-end">
        <Button onClick={handle} disabled={saving || !description.trim()}>
          {saving ? t("common.saving") : t("lessons.form.save")}
        </Button>
      </div>
    </CardBody>
  );
}

/* ---------------- 编辑对话框 ---------------- */

function EditLessonDialog({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: Lesson;
  onSave: (input: {
    lesson_type: LessonType;
    description: string;
    applicable_to?: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<LessonType>(lesson.lesson_type);
  const [description, setDescription] = useState(lesson.description);
  const [applicable, setApplicable] = useState(
    parseApplicable(lesson.applicable_to)
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await onSave({
        lesson_type: type,
        description: description.trim(),
        applicable_to: applicable
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("lessons.edit.title")}
        </div>

        <Field label={t("lessons.form.type")}>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as LessonType)}
          >
            <option value="validated">{t("lessons.type.validated")}</option>
            <option value="invalidated">
              {t("lessons.type.invalidated")}
            </option>
            <option value="discovered">{t("lessons.type.discovered")}</option>
          </Select>
        </Field>
        <Field label={t("lessons.form.description")}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t("lessons.form.descriptionPlaceholder")}
          />
        </Field>
        <Field label={t("lessons.form.applicableTo")}>
          <Input
            value={applicable}
            onChange={(e) => setApplicable(e.target.value)}
            placeholder={t("lessons.form.applicablePlaceholder")}
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
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !description.trim()}
          >
            {saving ? t("lessons.edit.saving") : t("lessons.edit.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}