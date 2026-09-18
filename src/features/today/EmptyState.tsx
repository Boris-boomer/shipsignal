import { useTranslation } from "react-i18next";
import { Sparkles, RefreshCw, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onRefresh: () => void;
  refreshing: boolean;
  onRecord: () => void;
  onRestartColdStart?: () => void;
}

export function EmptyState({
  onRefresh,
  refreshing,
  onRecord,
  onRestartColdStart,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-panel-2)]">
        <Sparkles className="h-6 w-6 text-[var(--color-muted)]" />
      </div>
      <h2 className="mb-2 text-base font-semibold text-[var(--color-strong)]">
        {t("today.empty.title")}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {t("today.empty.hint")}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onRecord}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:opacity-90"
        >
          {t("today.empty.cta")}
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm",
            "hover:bg-[var(--color-panel-2)]",
            refreshing && "opacity-60"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          {t("today.refresh")}
        </button>
      </div>

      {onRestartColdStart && (
        <button
          onClick={onRestartColdStart}
          className="mt-6 flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          <Rocket className="h-3.5 w-3.5" />
          {t("today.empty.restartColdStart")}
        </button>
      )}
    </div>
  );
}