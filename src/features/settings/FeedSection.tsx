import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { getSetting, setSetting, clearAllFeeds } from "@/lib/db";
import { RssSourceManager } from "./RssSourceManager";

export function FeedSection() {
  const [enabled, setEnabled] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await getSetting("feeds_enabled");
      setEnabled(v === "true");
    })();
  }, []);

  const toggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    await setSetting("feeds_enabled", next ? "true" : "false");
  };

  const handleClear = async () => {
    if (!confirm("清空所有外部信息？关键词保留，只清拉下来的内容。")) return;
    setClearing(true);
    try {
      await clearAllFeeds();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[var(--color-strong)]">
            外部资讯
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">
            开启后，今日页顶部会多出「关键词」和「看看外面」按钮。默认关闭。
          </div>
        </div>
        <button
          onClick={toggleEnabled}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
            enabled
              ? "bg-[var(--color-accent)] text-white"
              : "border border-[var(--color-border)] text-[var(--color-muted)]"
          }`}
        >
          {enabled ? "已开启" : "已关闭"}
        </button>
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          <RssSourceManager />

          <div className="border-t border-[var(--color-border)] pt-4">
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] hover:border-red-500 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearing ? "清理中…" : "清空所有外部数据"}
            </button>
            {done && (
              <span className="ml-3 text-xs text-[var(--color-accent-2)]">
                已清空
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}