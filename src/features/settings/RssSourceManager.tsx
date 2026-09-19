import { useEffect, useState } from "react";
import {
  listRssSources,
  addRssSource,
  deleteRssSource,
  setRssSourceEnabled,
  type RssSource,
} from "@/lib/db";

export function RssSourceManager() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const list = await listRssSources();
    setSources(list);
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleAdd = async () => {
    setError(null);
    const u = url.trim();
    const l = label.trim() || u;
    if (!u) return;
    if (!/^https?:\/\//.test(u)) {
      setError("URL 要以 http:// 或 https:// 开头");
      return;
    }
    try {
      await addRssSource(u, l);
      setUrl("");
      setLabel("");
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "添加失败");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRssSource(id);
    await reload();
  };

  const handleToggle = async (s: RssSource) => {
    await setRssSourceEnabled(s.id, !s.enabled);
    await reload();
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3">
      <div className="text-xs font-medium text-[var(--color-strong)]">
        自定义 RSS 源
      </div>
      <div className="mt-0.5 text-[10px] text-[var(--color-muted)]">
        添加任何 RSS / Atom 订阅地址，抓取内容会参与关键词匹配。
      </div>

      {sources.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-[var(--color-strong)]">
                  {s.label}
                </div>
                <div className="truncate text-[10px] text-[var(--color-muted)]">
                  {s.url}
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleToggle(s)}
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    s.enabled
                      ? "bg-[var(--color-accent)] text-white"
                      : "border border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  {s.enabled ? "启用" : "停用"}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="rounded px-2 py-0.5 text-[10px] text-[var(--color-muted)] hover:text-red-500"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="名称（可选）"
          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1 text-xs"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1 text-xs"
        />
        {error && (
          <div className="text-[10px] text-red-500">{error}</div>
        )}
        <button
          onClick={handleAdd}
          className="w-full rounded border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-strong)] hover:border-[var(--color-accent)]"
        >
          添加
        </button>
      </div>
    </div>
  );
}