import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { downloadProjectCard, type ShareData } from "@/lib/share";
import {
  listSignals,
  listConversions,
  listLessons,
  listDecisions,
  getProject,
} from "@/lib/db";

interface Props {
  projectId: string;
}

export function ShareButton({ projectId }: Props) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const project = await getProject(projectId);
      if (!project) return;

      const [signals, conversions, lessons, decisions] = await Promise.all([
        listSignals(projectId),
        listConversions(projectId),
        listLessons(projectId),
        listDecisions(projectId),
      ]);

      const incomeByCurrency: Record<string, number> = {};
      for (const c of conversions) {
        if (c.amount != null) {
          incomeByCurrency[c.currency] =
            (incomeByCurrency[c.currency] ?? 0) + c.amount;
        }
      }
      const incomeText = Object.entries(incomeByCurrency)
        .map(([cur, amt]) => `${cur} ${amt}`)
        .join(" / ");

      const daysActive = Math.max(
        1,
        Math.floor(
          (Date.now() - Date.parse(project.created_at)) /
            (24 * 60 * 60 * 1000)
        )
      );

      const isDark = document.documentElement.classList.contains("dark");

      const data: ShareData = {
        projectName: project.name,
        description: project.description ?? undefined,
        signalCount: signals.length,
        decisionCount: decisions.length,
        conversionCount: conversions.length,
        lessonCount: lessons.length,
        daysActive,
        incomeText: incomeText || undefined,
      };

      await downloadProjectCard(data, {
        theme: isDark ? "dark" : "light",
      });
    } catch (e) {
      console.error("[share] failed", e);
      alert(`导出失败：${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel-2)] disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {busy ? "生成中…" : "导出卡片"}
    </button>
  );
}