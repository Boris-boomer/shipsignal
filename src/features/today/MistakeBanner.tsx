import { useEffect, useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { detectMistakes, type Mistake, type ProjectDataLite } from "@/lib/mistakes";

interface Props {
  data: ProjectDataLite;
  onDismiss?: () => void;
}

export function MistakeBanner({ data, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [mistake, setMistake] = useState<Mistake | null>(null);

  useEffect(() => {
    const all = detectMistakes(data);
    if (all.length === 0) return;
    const top = all.find((m) => m.severity === "warn") ?? all[0];
    setMistake(top);
  }, [data]);

  if (!mistake || dismissed) return null;

  const isWarn = mistake.severity === "warn";
  const Icon = isWarn ? AlertTriangle : Info;

  return (
    <div
      className={`mx-auto mb-4 max-w-2xl rounded-xl border p-4 ${
        isWarn
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-[var(--color-border)] bg-[var(--color-panel)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            isWarn ? "text-amber-500" : "text-[var(--color-muted)]"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[var(--color-strong)]">
            {mistake.title}
          </div>
          <div className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            {mistake.reason}
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-strong)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}