import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  Upload,
  FileText,
  Archive,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useProjectStore } from "@/stores/projectStore";
import {
  exportProjectMarkdown,
  exportAllProjectsMarkdown,
  exportBackup,
  pickBackupFile,
  performRestore,
  type RestorePreview,
} from "@/lib/backup";

export function ExportSection() {
  const { t } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const loadAll = useProjectStore((s) => s.loadAll);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(
    null
  );

  function flashOk(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  async function handleExportMdAll() {
    if (projects.length === 0) return;
    setBusy("md-all");
    setError(null);
    try {
      await exportAllProjectsMarkdown(projects);
      flashOk(t("settings.export.flashExported"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleExportMdOne(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setBusy(`md-${id}`);
    setError(null);
    try {
      await exportProjectMarkdown(p);
      flashOk(t("settings.export.flashExported"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleBackup() {
    setBusy("backup");
    setError(null);
    try {
      await exportBackup();
      flashOk(t("settings.export.flashBackupDone"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handlePickRestore() {
    setBusy("pick");
    setError(null);
    try {
      const preview = await pickBackupFile();
      if (preview) setRestorePreview(preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmRestore() {
    if (!restorePreview) return;
    setBusy("restore");
    setError(null);
    try {
      await performRestore(restorePreview);
      await loadAll();
      setRestorePreview(null);
      flashOk(t("settings.export.flashRestoreDone"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div>
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("settings.export.title")}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          {t("settings.export.subtitle")}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="flex-1 break-all">{error}</div>
          <button
            onClick={() => setError(null)}
            className="shrink-0 text-[var(--color-danger)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {flash && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-accent-2)]/40 bg-[var(--color-accent-2)]/10 px-3 py-2 text-xs text-[var(--color-accent-2)]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {flash}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <FileText className="h-3 w-3" />
          {t("settings.export.markdown")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportMdAll}
            disabled={projects.length === 0 || busy !== null}
          >
            {busy === "md-all" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            {t("settings.export.allProjects")}
          </Button>

          <select
            onChange={(e) => {
              if (e.target.value) handleExportMdOne(e.target.value);
              e.target.value = "";
            }}
            disabled={projects.length === 0 || busy !== null}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-xs text-[var(--color-strong)] focus:border-[var(--color-accent)] disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>
              {t("settings.export.selectProject")}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {projects.length === 0 && (
            <span className="text-[0.6rem] text-[var(--color-muted)]">
              {t("settings.export.noProjects")}
            </span>
          )}
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Archive className="h-3 w-3" />
          {t("settings.export.backupTitle")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleBackup}
            disabled={busy !== null}
          >
            {busy === "backup" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            {t("settings.export.backup")}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handlePickRestore}
            disabled={busy !== null}
          >
            {busy === "pick" ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            {t("settings.export.restore")}
          </Button>
        </div>
        <p className="text-[0.6rem] leading-relaxed text-[var(--color-muted)]">
          {t("settings.export.restoreWarning")}
        </p>
      </div>

      {restorePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
            <div className="flex items-start justify-between">
              <div className="text-sm font-medium text-[var(--color-strong)]">
                {t("settings.export.restoreConfirmTitle")}
              </div>
              <button
                onClick={() => setRestorePreview(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-strong)]"
                disabled={busy === "restore"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1 rounded-md border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 px-3 py-2 text-xs text-[var(--color-warn)]">
              <div className="font-medium">
                {t("settings.export.restoreConfirmWarn")}
              </div>
              <div className="text-[0.6rem]">
                {t("settings.export.restoreConfirmHint")}
              </div>
            </div>

            <div className="space-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3 text-xs text-[var(--color-muted)]">
              <div className="mb-1 text-[0.6rem] break-all">
                {t("settings.export.restoreFile", {
                  path: restorePreview.path,
                })}
              </div>
              <div className="text-[0.6rem]">
                {t("settings.export.restoreTime", {
                  time: restorePreview.summary.exported_at,
                })}
              </div>
              <div className="mt-2 space-y-0.5 text-[var(--color-strong)]">
                <div>
                  {t("settings.export.summaryProjects", {
                    n: restorePreview.summary.projects,
                  })}
                </div>
                <div>
                  {t("settings.export.summarySignals", {
                    n: restorePreview.summary.signals,
                  })}
                </div>
                <div>
                  {t("settings.export.summaryConversions", {
                    n: restorePreview.summary.conversions,
                  })}
                </div>
                <div>
                  {t("settings.export.summaryLessons", {
                    n: restorePreview.summary.lessons,
                  })}
                </div>
                <div>
                  {t("settings.export.summaryDecisions", {
                    n: restorePreview.summary.decision_logs,
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRestorePreview(null)}
                disabled={busy === "restore"}
              >
                {t("settings.export.restoreCancel")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleConfirmRestore}
                disabled={busy === "restore"}
              >
                {busy === "restore" ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {t("settings.export.restoring")}
                  </>
                ) : (
                  t("settings.export.restoreDo")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}