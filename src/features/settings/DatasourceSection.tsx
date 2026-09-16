import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link2,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useDataSourceStore } from "@/stores/datasourceStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSignalStore } from "@/stores/signalStore";
import type { DataSource, DataSourceProvider } from "@/lib/types";

interface ProviderSpec {
  id: DataSourceProvider;
  nameKey: string;
  descriptionKey: string;
  available: boolean;
  caveatKey?: string;
}

const PROVIDERS: ProviderSpec[] = [
  {
    id: "bilibili",
    nameKey: "settings.datasource.provider.bilibili.name",
    descriptionKey: "settings.datasource.provider.bilibili.description",
    available: true,
    caveatKey: "settings.datasource.provider.bilibili.caveat",
  },
  {
    id: "kuaishou",
    nameKey: "settings.datasource.provider.kuaishou.name",
    descriptionKey: "settings.datasource.provider.kuaishou.description",
    available: false,
  },
  {
    id: "weibo",
    nameKey: "settings.datasource.provider.weibo.name",
    descriptionKey: "settings.datasource.provider.weibo.description",
    available: false,
  },
];

export function DatasourceSection() {
  const { t } = useTranslation();
  const { loaded, sources, error, load, clearError } = useDataSourceStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[var(--color-strong)]">
            {t("settings.datasource.title")}
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {t("settings.datasource.subtitle")}
          </p>
        </div>
        {error && (
          <button
            onClick={clearError}
            className="text-[0.6rem] text-[var(--color-muted)] hover:text-[var(--color-strong)]"
          >
            {t("settings.datasource.clearError")}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div className="break-all">{error}</div>
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            spec={p}
            source={sources.find((s) => s.provider === p.id) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------- 单个平台卡片 ---------------- */

function ProviderCard({
  spec,
  source,
}: {
  spec: ProviderSpec;
  source: DataSource | null;
}) {
  const { t } = useTranslation();
  const { connecting, disconnect } = useDataSourceStore();
  const isConnecting = connecting === spec.id;
  const providerName = t(spec.nameKey);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-strong)]">
            {providerName}
          </span>
          <StatusBadge spec={spec} source={source} />
        </div>
        {source?.status === "connected" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  t("settings.datasource.disconnectConfirm", {
                    name: providerName,
                  })
                )
              ) {
                disconnect(source.id);
              }
            }}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {t("settings.datasource.disconnect")}
          </Button>
        )}
      </div>

      <p className="mt-1 text-xs text-[var(--color-muted)]">
        {t(spec.descriptionKey)}
      </p>

      {!spec.available && (
        <div className="mt-3 rounded-md border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-muted)]">
          {t("settings.datasource.comingSoon")}
        </div>
      )}

      {spec.available && !source && (
        <ConnectForm spec={spec} busy={isConnecting} />
      )}

      {spec.available && source?.status === "connected" && (
        <ConnectedPanel source={source} />
      )}

      {spec.available && source && source.status !== "connected" && (
        <ConnectForm spec={spec} busy={isConnecting} existing={source} />
      )}
    </div>
  );
}

function StatusBadge({
  spec,
  source,
}: {
  spec: ProviderSpec;
  source: DataSource | null;
}) {
  const { t } = useTranslation();
  if (!spec.available) {
    return <Badge tone="neutral">{t("settings.datasource.status.unsupported")}</Badge>;
  }
  if (!source) {
    return (
      <Badge tone="neutral">{t("settings.datasource.status.disconnected")}</Badge>
    );
  }
  switch (source.status) {
    case "connected":
      return (
        <Badge tone="success">{t("settings.datasource.status.connected")}</Badge>
      );
    case "expired":
      return (
        <Badge tone="warn">{t("settings.datasource.status.expired")}</Badge>
      );
    case "error":
      return (
        <Badge tone="danger">{t("settings.datasource.status.error")}</Badge>
      );
    default:
      return (
        <Badge tone="neutral">
          {t("settings.datasource.status.disconnected")}
        </Badge>
      );
  }
}

/* ---------------- 未连接：配置表单 ---------------- */

function ConnectForm({
  spec,
  busy,
  existing,
}: {
  spec: ProviderSpec;
  busy: boolean;
  existing?: DataSource;
}) {
  const { t } = useTranslation();
  const { connect, pendingAuthUrl, clearPendingAuthUrl } =
    useDataSourceStore();
  const [clientId, setClientId] = useState(existing?.client_id ?? "");
  const [clientSecret, setClientSecret] = useState(
    existing?.client_secret ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canConnect =
    clientId.trim().length > 0 && clientSecret.trim().length > 0 && !busy;

  async function handleConnect() {
    setLocalError(null);
    setCopied(false);
    try {
      await connect(spec.id, clientId.trim(), clientSecret.trim());
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCopy() {
    if (!pendingAuthUrl) return;
    try {
      await navigator.clipboard.writeText(pendingAuthUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = pendingAuthUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setLocalError("Copy failed. Please select and copy manually.");
      }
    }
  }

  async function handleOpenManually() {
    if (!pendingAuthUrl) return;
    try {
      await invokeOpenExternal(pendingAuthUrl);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[0.6rem] text-[var(--color-muted)]">
            {t("settings.datasource.clientId")}
          </label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={t("settings.datasource.clientIdPlaceholder")}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5 text-xs text-[var(--color-strong)] focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[0.6rem] text-[var(--color-muted)]">
            {t("settings.datasource.clientSecret")}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={t("settings.datasource.clientSecretPlaceholder")}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5 text-xs text-[var(--color-strong)] focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {spec.caveatKey && (
        <div className="rounded-md border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/5 px-2 py-1.5 text-[0.6rem] leading-relaxed text-[var(--color-warn)]">
          {t(spec.caveatKey)}
        </div>
      )}

      {localError && (
        <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-2 py-1.5 text-[0.6rem] text-[var(--color-danger)]">
          {localError}
        </div>
      )}

      {busy && pendingAuthUrl && (
        <div className="space-y-1.5 rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] font-medium text-[var(--color-accent)]">
              {t("settings.datasource.waitingBrowser")}
            </span>
            <button
              onClick={clearPendingAuthUrl}
              className="text-[var(--color-muted)] hover:text-[var(--color-strong)]"
              title={t("settings.datasource.cancelAuthHint")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="break-all rounded bg-[var(--color-panel)] px-1.5 py-1 font-mono text-[0.6rem] text-[var(--color-muted)]">
            {pendingAuthUrl}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("settings.datasource.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  {t("settings.datasource.copyLink")}
                </>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleOpenManually}>
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("settings.datasource.reopenBrowser")}
            </Button>
          </div>
          <p className="text-[0.6rem] leading-relaxed text-[var(--color-muted)]">
            {t("settings.datasource.browserOpenFailed")}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="text-[0.6rem] text-[var(--color-muted)]">
          {t("settings.datasource.authorizeHint")}
        </div>
        <Button size="sm" onClick={handleConnect} disabled={!canConnect}>
          {busy ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t("settings.datasource.waitingAuth")}
            </>
          ) : (
            <>
              <Link2 className="h-3 w-3 mr-1" />
              {t("settings.datasource.connect")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

async function invokeOpenExternal(url: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_external", { url });
}

/* ---------------- 已连接：用户信息 + 同步 ---------------- */

function ConnectedPanel({ source }: { source: DataSource }) {
  const { t } = useTranslation();
  const { fetchSignals, markSynced, syncing } = useDataSourceStore();
  const projects = useProjectStore((s) => s.projects);
  const [projectId, setProjectId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    added: number;
    failed: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projectId, projects]);

  const isSyncing = busy || syncing === source.id;

  async function handleSync() {
    if (!projectId) return;
    setBusy(true);
    setSyncError(null);
    setResult(null);
    try {
      const signals = await fetchSignals(source.id, 50);
      const addSignal = useSignalStore.getState().add;
      let added = 0;
      let failed = 0;

      for (const s of signals) {
        try {
          await addSignal({
            project_id: projectId,
            signal_type: s.signal_type,
            data: s.data,
            source: s.source,
            source_verifiability: s.source_verifiability as
              | "high"
              | "medium"
              | "low",
            payment_signal_present: s.payment_signal_present,
          });
          added++;
        } catch (e) {
          console.error("[datasource] 写入信号失败", e);
          failed++;
        }
      }

      await markSynced(source.id);
      setResult({ added, failed });
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        {source.user_avatar ? (
          <img
            src={source.user_avatar}
            alt=""
            className="h-7 w-7 rounded-full border border-[var(--color-border)]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-xs text-[var(--color-muted)]">
            {source.label[0]}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs text-[var(--color-strong)]">
            {source.user_name ?? t("settings.datasource.authorized")}
          </div>
          <div className="truncate text-[0.6rem] text-[var(--color-muted)]">
            {source.last_sync_at
              ? t("settings.datasource.lastSync", {
                  time: formatTime(source.last_sync_at),
                })
              : t("settings.datasource.neverSynced")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={projects.length === 0 || isSyncing}
          className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5 text-xs text-[var(--color-strong)] focus:border-[var(--color-accent)] disabled:opacity-50"
        >
          {projects.length === 0 ? (
            <option value="">{t("settings.datasource.noProjects")}</option>
          ) : (
            projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>
        <Button
          size="sm"
          onClick={handleSync}
          disabled={!projectId || isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t("settings.datasource.syncing")}
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              {t("settings.datasource.syncToProject")}
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-accent-2)]/40 bg-[var(--color-accent-2)]/10 px-2 py-1.5 text-[0.6rem] text-[var(--color-accent-2)]">
          <CheckCircle2 className="h-3 w-3" />
          {t("settings.datasource.syncResultAdded", { n: result.added })}
          {result.failed > 0 &&
            t("settings.datasource.syncResultFailed", { n: result.failed })}
        </div>
      )}

      {syncError && (
        <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-2 py-1.5 text-[0.6rem] text-[var(--color-danger)]">
          {syncError}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}