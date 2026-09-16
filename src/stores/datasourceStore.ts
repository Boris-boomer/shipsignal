import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  DataSource,
  DataSourceProvider,
  OAuthStartOutput,
  TokenInfo,
  BiliUserInfo,
  FetchedSignal,
} from "@/lib/types";
import {
  listDataSources,
  upsertDataSource,
  deleteDataSource,
  markDataSourceSynced,
} from "@/lib/db";
import { nowIso, uuid } from "@/lib/utils";

const PROVIDER_LABELS: Record<DataSourceProvider, string> = {
  bilibili: "B站",
  kuaishou: "快手",
  weibo: "微博",
};

const OAUTH_TIMEOUT_MS = 5 * 60 * 1000;

interface DataSourceState {
  loaded: boolean;
  sources: DataSource[];
  connecting: DataSourceProvider | null;
  syncing: string | null;
  error: string | null;
  pendingAuthUrl: string | null;

  load: () => Promise<void>;
  connect: (
    provider: DataSourceProvider,
    clientId: string,
    clientSecret: string
  ) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  fetchSignals: (id: string, limit?: number) => Promise<FetchedSignal[]>;
  markSynced: (id: string) => Promise<void>;
  clearError: () => void;
  clearPendingAuthUrl: () => void;
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  loaded: false,
  sources: [],
  connecting: null,
  syncing: null,
  error: null,
  pendingAuthUrl: null,

  async load() {
    const sources = await listDataSources();
    set({ sources, loaded: true });
  },

  async connect(provider, clientId, clientSecret) {
    set({ connecting: provider, error: null, pendingAuthUrl: null });

    // 先挂监听，再启动，避免回调先到
    const codePromise = waitForOAuthCode(provider, OAUTH_TIMEOUT_MS);

    try {
      const start = await invoke<OAuthStartOutput>("oauth_start", {
        input: { provider, client_id: clientId },
      });

      // 把授权链接暴露给 UI，作为 fallback
      set({ pendingAuthUrl: start.auth_url });

      // 尝试用系统默认浏览器打开
      try {
        await invoke("open_external", { url: start.auth_url });
      } catch (e) {
        console.warn(
          "[datasource] 自动打开浏览器失败，请手动复制授权链接",
          e
        );
      }

      const code = await codePromise;

      const token = await invoke<TokenInfo>("oauth_exchange_token", {
        input: {
          provider,
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
      });

      let userInfo: BiliUserInfo | null = null;
      if (provider === "bilibili") {
        try {
          userInfo = await invoke<BiliUserInfo>("bili_fetch_user_info", {
            client_id: clientId,
            client_secret: clientSecret,
            access_token: token.access_token,
          });
        } catch (e) {
          console.warn("[datasource] bili_fetch_user_info 失败", e);
        }
      }

      const existing = get().sources.find((s) => s.provider === provider);
      const now = nowIso();
      const expiresAt =
        token.expires_at != null
          ? Math.floor(Date.now() / 1000) + token.expires_at
          : null;

      const ds: DataSource = {
        id: existing?.id ?? uuid(),
        provider,
        label: PROVIDER_LABELS[provider],
        client_id: clientId,
        client_secret: clientSecret,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_expires_at: expiresAt,
        scopes: JSON.stringify(token.scopes),
        user_openid: userInfo?.openid ?? existing?.user_openid ?? null,
        user_name: userInfo?.name ?? existing?.user_name ?? null,
        user_avatar: userInfo?.face ?? existing?.user_avatar ?? null,
        status: "connected",
        last_sync_at: existing?.last_sync_at ?? null,
        last_error: null,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      await upsertDataSource(ds);
      set({ pendingAuthUrl: null });
      await get().load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg, pendingAuthUrl: null });
      throw e;
    } finally {
      set({ connecting: null });
    }
  },

  async disconnect(id) {
    await deleteDataSource(id);
    await get().load();
  },

  async fetchSignals(id, limit = 50) {
    const source = get().sources.find((s) => s.id === id);
    if (!source) throw new Error("数据源不存在");
    if (!source.client_id || !source.client_secret || !source.access_token) {
      throw new Error("数据源未完成配置");
    }

    set({ syncing: id, error: null });
    try {
      const signals = await invoke<FetchedSignal[]>("bili_fetch_signals", {
        client_id: source.client_id,
        client_secret: source.client_secret,
        access_token: source.access_token,
        limit,
      });
      return signals;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg });
      throw e;
    } finally {
      set({ syncing: null });
    }
  },

  async markSynced(id) {
    await markDataSourceSynced(id);
    await get().load();
  },

  clearError() {
    set({ error: null });
  },

  clearPendingAuthUrl() {
    set({ pendingAuthUrl: null });
  },
}));

/* ---------------- OAuth 回调等待 ---------------- */

function waitForOAuthCode(
  provider: DataSourceProvider,
  timeoutMs: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let unlistenCode: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("授权超时（5 分钟未收到回调）"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      unlistenCode?.();
      unlistenError?.();
    }

    function finish(err: Error | null, code?: string) {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve(code ?? "");
    }

    listen<{ provider: string; code: string }>("oauth://code", (e) => {
      if (e.payload.provider !== provider) return;
      finish(null, e.payload.code);
    })
      .then((fn) => {
        unlistenCode = fn;
      })
      .catch((err) =>
        finish(err instanceof Error ? err : new Error(String(err)))
      );

    listen<{ provider: string; message: string }>("oauth://error", (e) => {
      if (e.payload.provider !== provider) return;
      finish(new Error(e.payload.message));
    })
      .then((fn) => {
        unlistenError = fn;
      })
      .catch((err) =>
        finish(err instanceof Error ? err : new Error(String(err)))
      );
  });
}