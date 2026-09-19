import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { listOllamaModels, type OllamaModel } from "@/lib/ollama";

interface Props {
  base: string;
  value: string;
  onChange: (model: string) => void;
}

export function OllamaModelPicker({ base, value, onChange }: Props) {
  const [models, setModels] = useState<OllamaModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listOllamaModels(base);
      if (list.length === 0) {
        setError("没检测到本地模型。先跑 `ollama pull qwen3:8b`。");
        setModels([]);
        return;
      }
      setModels(list);
      // 如果当前没值或值不在列表里，自动选第一个
      if (!value || !list.some((m) => m.name === value)) {
        onChange(list[0].name);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--color-muted)]">
        Model
      </label>
      <div className="flex gap-2">
        {models && models.length > 0 ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)]"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="qwen3:8b"
            className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)]"
          />
        )}
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-2 text-xs hover:bg-[var(--color-panel-2)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {error && (
        <div className="mt-1 text-xs text-amber-500">{error}</div>
      )}
    </div>
  );
}