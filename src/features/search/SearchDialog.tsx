import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search as SearchIcon,
  Loader2,
  Package,
  Signal as SignalIcon,
  Lightbulb,
  GitBranch,
  DollarSign,
} from "lucide-react";
import { globalSearch, type SearchHit } from "@/lib/db";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const KIND_TONE: Record<SearchHit["kind"], "neutral" | "accent" | "success" | "warn" | "danger"> = {
  project: "accent",
  signal: "neutral",
  lesson: "success",
  decision: "warn",
  conversion: "danger",
};

const KIND_LABEL_KEY: Record<SearchHit["kind"], string> = {
  project: "search.kind.project",
  signal: "search.kind.signal",
  lesson: "search.kind.lesson",
  decision: "search.kind.decision",
  conversion: "search.kind.conversion",
};

const KIND_ICON: Record<SearchHit["kind"], typeof Package> = {
  project: Package,
  signal: SignalIcon,
  lesson: Lightbulb,
  decision: GitBranch,
  conversion: DollarSign,
};

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时重置 + focus
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // 防抖搜索
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await globalSearch(trimmed);
        if (cancelled) return;
        setResults(r);
        setActiveIndex(0);
      } catch (e) {
        console.error("[search] failed", e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  function handleSelect(hit: SearchHit) {
    navigate(`/project/${hit.project_id}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[activeIndex];
      if (hit) handleSelect(hit);
    }
  }

  const showEmpty = useMemo(
    () => !loading && query.trim() === "",
    [loading, query]
  );
  const showNoResult = useMemo(
    () => !loading && query.trim() !== "" && results.length === 0,
    [loading, query, results.length]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-24"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 输入框 */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent text-sm text-[var(--color-strong)] placeholder:text-[var(--color-muted)] outline-none"
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-muted)]" />
          )}
        </div>

        {/* 结果列表 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {showEmpty && (
            <div className="px-4 py-10 text-center text-xs text-[var(--color-muted)]">
              {t("search.empty")}
            </div>
          )}
          {showNoResult && (
            <div className="px-4 py-10 text-center text-xs text-[var(--color-muted)]">
              {t("search.noResults")}
            </div>
          )}
          {results.length > 0 && (
            <ul className="py-1">
              {results.map((hit, i) => {
                const Icon = KIND_ICON[hit.kind];
                const active = i === activeIndex;
                return (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <button
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => handleSelect(hit)}
                      className={
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors " +
                        (active
                          ? "bg-[var(--color-panel-2)]"
                          : "hover:bg-[var(--color-panel-2)]/60")
                      }
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge tone={KIND_TONE[hit.kind]}>
                            {t(KIND_LABEL_KEY[hit.kind])}
                          </Badge>
                          <span className="truncate text-xs font-medium text-[var(--color-strong)]">
                            {hit.title}
                          </span>
                        </div>
                        {hit.snippet && (
                          <div className="mt-1 line-clamp-1 text-[0.65rem] text-[var(--color-muted)]">
                            {hit.snippet}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[0.6rem] text-[var(--color-muted)]">
                          <span className="truncate">{hit.project_name}</span>
                          <span>·</span>
                          <span>{formatDate(hit.created_at)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 底部提示 */}
        <div className="border-t border-[var(--color-border)] px-4 py-2 text-[0.6rem] text-[var(--color-muted)]">
          {t("search.hint")}
        </div>
      </div>
    </div>
  );
}