import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { retrieveRelated, type RagHit } from "@/lib/rag";
import { getEmbedder } from "@/lib/embedding";

interface Props {
  projectId: string;
  query: string;
}

export function RelatedHistory({ projectId, query }: Props) {
  const [hits, setHits] = useState<RagHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const e = await getEmbedder();
      setEnabled(e !== null);
    })();
  }, []);

  useEffect(() => {
    if (enabled !== true || !query.trim()) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await retrieveRelated(projectId, query, 3);
        if (alive) setHits(list);
      } catch (e) {
        console.warn("[rag] failed", e);
        if (alive) setHits([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled, projectId, query]);

  if (enabled === null || enabled === false) return null;

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        翻历史…
      </div>
    );
  }

  if (!hits || hits.length === 0) return null;

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      <details>
        <summary className="cursor-pointer text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]">
          <span className="inline-flex items-center gap-1.5">
            <History className="h-3 w-3" />
            相关历史（{hits.length}）
          </span>
        </summary>
        <div className="mt-2 space-y-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3">
          {hits.map((h) => (
            <div key={h.id} className="text-xs leading-relaxed">
              <span className="text-[var(--color-muted)]">
                {h.created_at.slice(0, 10)} · {h.source}：
              </span>
              <span className="ml-1 text-[var(--color-strong)]">{h.text}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}