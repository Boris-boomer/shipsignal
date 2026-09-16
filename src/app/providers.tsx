import { useEffect, useState, type ReactNode } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProjectStore } from "@/stores/projectStore";
import { getDb } from "@/lib/db";

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSettings = useSettingsStore((s) => s.load);
  const loadProjects = useProjectStore((s) => s.loadAll);

  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();

    (async () => {
      try {
        await getDb();
        console.log(
          `[bootstrap] db ready in ${(performance.now() - t0).toFixed(0)}ms`
        );

        await Promise.all([loadSettings(), loadProjects()]);
        console.log(
          `[bootstrap] all ready in ${(performance.now() - t0).toFixed(0)}ms`
        );

        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("[bootstrap] failed", e);
        if (!cancelled) setError(String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadSettings, loadProjects]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "#f87171",
          fontSize: 13,
        }}
      >
        启动失败：{error}
      </div>
    );
  }

  if (!ready) return <SplashScreen />;

  return <>{children}</>;
}

function SplashScreen() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            height: 40,
            width: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            background: "var(--color-accent)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          S
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
          }}
        >
          正在加载本地数据…
        </div>
      </div>
    </div>
  );
}