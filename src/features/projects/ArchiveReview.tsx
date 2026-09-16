import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Sunset,
  Save,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { useProjectStore } from "@/stores/projectStore";
import { useLessonStore } from "@/stores/lessonStore";
import { useSignalStore } from "@/stores/signalStore";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Textarea,
} from "@/components/ui";

export function ArchiveReview({ project }: { project: Project }) {
  const { t } = useTranslation();
  const updateProject = useProjectStore((s) => s.update);
  const lessons = useLessonStore((s) => s.lessons);
  const loadLessons = useLessonStore((s) => s.load);
  const signals = useSignalStore((s) => s.signals);
  const loadSignals = useSignalStore((s) => s.load);

  const [reason, setReason] = useState(project.archive_reason ?? "");
  const [saving, setSaving] = useState(false);

  const [sunset, setSunset] = useState(project.sunset_conditions ?? "");
  const [savingSunset, setSavingSunset] = useState(false);
  const [sunsetSaved, setSunsetSaved] = useState(false);

  useEffect(() => {
    loadLessons(project.id).catch(console.error);
    loadSignals(project.id).catch(console.error);
  }, [project.id, loadLessons, loadSignals]);

  useEffect(() => {
    setReason(project.archive_reason ?? "");
    setSunset(project.sunset_conditions ?? "");
  }, [project.id, project.archive_reason, project.sunset_conditions]);

  const checks = useMemo(() => {
    const paymentSignals = signals.filter((s) => {
      try {
        return JSON.parse(s.data || "{}").payment_signal_present === true;
      } catch {
        return false;
      }
    }).length;

    return [
      {
        key: "criteria",
        label: t("archive.check.criteria"),
        passed: !!project.completion_criteria?.trim(),
        hint: t("archive.check.criteriaHint"),
      },
      {
        key: "lessons",
        label: t("archive.check.lessons"),
        passed: lessons.length >= 3,
        hint: t("archive.check.lessonsHint", { n: lessons.length }),
      },
      {
        key: "signals",
        label: t("archive.check.payment"),
        passed: paymentSignals > 0 || signals.length > 0,
        hint: t("archive.check.paymentHint"),
      },
    ];
  }, [project, lessons, signals, t]);

  const allPassed = checks.every((c) => c.passed);

  async function handleArchive() {
    setSaving(true);
    try {
      await updateProject(project.id, {
        status: "archived",
        archive_reason: reason,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnarchive() {
    setSaving(true);
    try {
      await updateProject(project.id, { status: "converting" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSunset() {
    setSavingSunset(true);
    try {
      await updateProject(project.id, {
        sunset_conditions: sunset.trim() || null,
      });
      setSunsetSaved(true);
      setTimeout(() => setSunsetSaved(false), 1500);
    } finally {
      setSavingSunset(false);
    }
  }

  if (project.status === "archived") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader
            title={t("archive.archived.title")}
            description={
              project.archive_reason || t("archive.archived.noReason")
            }
            actions={
              <Button size="sm" variant="secondary" onClick={handleUnarchive}>
                {t("archive.archived.restore")}
              </Button>
            }
          />
          <CardBody className="space-y-2 text-xs text-[var(--color-muted)]">
            <div>
              {t("archive.archived.archivedAt", {
                time: project.updated_at
                  ? new Date(project.updated_at).toLocaleString()
                  : "—",
              })}
            </div>
            <div>
              {t("archive.archived.lessonsCount", { n: lessons.length })}
            </div>
          </CardBody>
        </Card>

        <SunsetCard
          value={sunset}
          onChange={setSunset}
          onSave={handleSaveSunset}
          saving={savingSunset}
          saved={sunsetSaved}
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SunsetCard
        value={sunset}
        onChange={setSunset}
        onSave={handleSaveSunset}
        saving={savingSunset}
        saved={sunsetSaved}
      />

      <Card>
        <CardHeader
          title={t("archive.card.title")}
          description={t("archive.card.description")}
        />
        <CardBody className="space-y-3">
          {checks.map((c) => (
            <div
              key={c.key}
              className="flex items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3"
            >
              {c.passed ? (
                <CheckCircle2
                  size="1rem"
                  className="mt-0.5 text-[var(--color-accent-2)]"
                />
              ) : (
                <AlertTriangle
                  size="1rem"
                  className="mt-0.5 text-[var(--color-warn)]"
                />
              )}
              <div>
                <div className="text-sm text-[var(--color-strong)]">{c.label}</div>
                <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {c.hint}
                </div>
              </div>
            </div>
          ))}

          <Field label={t("archive.reason")}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t("archive.reasonPlaceholder")}
            />
          </Field>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--color-muted)]">
              {allPassed ? (
                <Badge tone="success">{t("archive.ready")}</Badge>
              ) : (
                <Badge tone="warn">{t("archive.notReady")}</Badge>
              )}
            </div>
            <Button
              variant="danger"
              onClick={handleArchive}
              disabled={saving}
            >
              <Archive size="0.875rem" />
              {saving
                ? t("archive.action.archiving")
                : t("archive.action.archive")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SunsetCard({
  value,
  onChange,
  onSave,
  saving,
  saved,
  readOnly = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader
        title={t("archive.sunset.title")}
        description={t("archive.sunset.description")}
      />
      <CardBody className="space-y-3">
        {readOnly ? (
          value.trim() ? (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-sm whitespace-pre-wrap text-[var(--color-strong)]">
              {value}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-muted)]">
              {t("archive.sunset.empty")}
            </div>
          )
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3 text-xs text-[var(--color-muted)]">
              <Sunset size="0.875rem" className="mt-0.5 shrink-0" />
              <div>
                <div className="text-[var(--color-strong)]">
                  {t("archive.sunset.example")}
                </div>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>{t("archive.sunset.example1")}</li>
                  <li>{t("archive.sunset.example2")}</li>
                  <li>{t("archive.sunset.example3")}</li>
                </ul>
              </div>
            </div>

            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              placeholder={t("archive.sunset.placeholder")}
            />

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span className="text-xs text-[var(--color-accent-2)]">
                  {t("common.saved")}
                </span>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={onSave}
                disabled={saving}
              >
                <Save size="0.75rem" className="mr-1" />
                {saving
                  ? t("common.saving")
                  : t("archive.sunset.save")}
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}