import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, AlertCircle, Loader2, X } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { Tabs, Badge, Button } from "@/components/ui";
import { OverviewPanel } from "./OverviewPanel";
import { SignalsPanel } from "./SignalsPanel";
import { DecisionsPanel } from "./DecisionsPanel";
import { ConversionsPanel } from "./ConversionsPanel";
import { LessonsPanel } from "./LessonsPanel";
import { ArchiveReview } from "./ArchiveReview";
import { ShareButton } from "./ShareButton";
import { useSignalStore } from "@/stores/signalStore";
import { useDecisionStore } from "@/stores/decisionStore";
import { useConversionStore } from "@/stores/conversionStore";
import { useLessonStore } from "@/stores/lessonStore";
import type { ProjectStatus } from "@/lib/types";

type Tab =
  | "overview"
  | "signals"
  | "decisions"
  | "conversions"
  | "lessons"
  | "archive";

const MODE_KEY: Record<string, string> = {
  validate_first: "portfolio.mode.validateFirst",
  build_first: "portfolio.mode.buildFirst",
  portfolio: "portfolio.mode.portfolio",
};

const STATUS_KEY: Record<ProjectStatus, string> = {
  planning: "portfolio.status.planning",
  building: "portfolio.status.building",
  launched: "portfolio.status.launched",
  converting: "portfolio.status.converting",
  active: "portfolio.status.active",
  archived: "portfolio.status.archived",
  frozen: "portfolio.status.frozen",
};

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { current, loadOne, remove } = useProjectStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const signalCount = useSignalStore((s) => s.signals.length);
  const decisionCount = useDecisionStore((s) => s.decisions.length);
  const conversionCount = useConversionStore((s) => s.conversions.length);
  const lessonCount = useLessonStore((s) => s.lessons.length);

  const loadSignals = useSignalStore((s) => s.load);
  const loadDecisions = useDecisionStore((s) => s.load);
  const loadConversions = useConversionStore((s) => s.load);
  const loadLessons = useLessonStore((s) => s.load);

  useEffect(() => {
    if (!id) return;
    loadOne(id).catch(console.error);
  }, [id, loadOne]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      loadSignals(id),
      loadDecisions(id),
      loadConversions(id),
      loadLessons(id),
    ]).catch(console.error);
  }, [id, loadSignals, loadDecisions, loadConversions, loadLessons]);

  async function handleConfirmDelete() {
    if (!current) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove(current.id);
      navigate("/");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  if (!current) {
    return (
      <div className="text-sm text-[var(--color-muted)]">
        {t("common.loading")}
      </div>
    );
  }

  const totalRecords =
    signalCount + decisionCount + conversionCount + lessonCount;

  const modeKey = MODE_KEY[current.mode];
  const statusKey = STATUS_KEY[current.status];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-strong)]">
            {current.name}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Badge tone="accent">
              {modeKey ? t(modeKey) : current.mode}
            </Badge>
            <Badge tone="neutral">
              {statusKey ? t(statusKey) : current.status}
            </Badge>
            {current.entry && (
              <Badge tone="neutral">
                {t("project.entryBadge", { entry: current.entry })}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton projectId={current.id} />
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size="0.75rem" className="mr-1" />
            {t("project.delete")}
          </Button>
        </div>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: t("project.tab.overview") },
          {
            value: "signals",
            label: t("project.tab.signals"),
            count: signalCount,
          },
          {
            value: "decisions",
            label: t("project.tab.decisions"),
            count: decisionCount,
          },
          {
            value: "conversions",
            label: t("project.tab.conversions"),
            count: conversionCount,
          },
          {
            value: "lessons",
            label: t("project.tab.lessons"),
            count: lessonCount,
          },
          { value: "archive", label: t("project.tab.archive") },
        ]}
      />

      <div className="pt-2">
        {tab === "overview" && <OverviewPanel project={current} />}
        {tab === "signals" && <SignalsPanel projectId={current.id} />}
        {tab === "decisions" && <DecisionsPanel projectId={current.id} />}
        {tab === "conversions" && <ConversionsPanel projectId={current.id} />}
        {tab === "lessons" && <LessonsPanel projectId={current.id} />}
        {tab === "archive" && <ArchiveReview project={current} />}
      </div>

      {confirmOpen && (
        <DeleteConfirmModal
          projectName={current.name}
          totalRecords={totalRecords}
          deleting={deleting}
          error={deleteError}
          onCancel={() => {
            if (deleting) return;
            setConfirmOpen(false);
            setDeleteError(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  projectName,
  totalRecords,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  totalRecords: number;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const matched = input.trim() === projectName;

  const recordCountStr =
    totalRecords > 0
      ? t("project.deleteModal.recordCount", { n: totalRecords })
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle
              size="1rem"
              className="text-[var(--color-danger)]"
            />
            <div className="text-sm font-medium text-[var(--color-strong)]">
              {t("project.deleteModal.title")}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--color-muted)] hover:text-[var(--color-strong)]"
            disabled={deleting}
          >
            <X size="0.875rem" />
          </button>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
          <div className="font-medium">
            {t("project.deleteModal.warning")}
          </div>
          <div className="text-[0.6rem] leading-relaxed">
            {t("project.deleteModal.body", {
              name: projectName,
              recordCount: recordCountStr,
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[0.6rem] text-[var(--color-muted)]">
            {t("project.deleteModal.confirmLabelPrefix")}{" "}
            <span className="font-mono text-[var(--color-strong)]">
              {projectName}
            </span>{" "}
            {t("project.deleteModal.confirmLabelSuffix")}
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={projectName}
            autoFocus
            disabled={deleting}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-danger)] disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={deleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={onConfirm}
            disabled={!matched || deleting}
          >
            {deleting ? (
              <>
                <Loader2 size="0.75rem" className="mr-1 animate-spin" />
                {t("project.deleteModal.deleting")}
              </>
            ) : (
              t("project.deleteModal.confirm")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}