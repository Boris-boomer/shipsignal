import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Minimize2, Power } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

export function CloseConfirmDialog() {
  const { t } = useTranslation();
  const setCloseBehavior = useSettingsStore((s) => s.setCloseBehavior);
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listen("app://close-requested", () => {
      setOpen(true);
      setRemember(false);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  if (!open) return null;

  async function handleExit() {
    try {
      if (remember) {
        await setCloseBehavior("exit");
      }
      await invoke("force_quit");
    } catch (e) {
      console.error("[window] force_quit failed", e);
    }
  }

  async function handleTray() {
    try {
      if (remember) {
        await setCloseBehavior("tray");
      }
      await invoke("minimize_to_tray");
      setOpen(false);
    } catch (e) {
      console.error("[window] minimize_to_tray failed", e);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("window.closeConfirm.title")}
        </div>
        <div className="text-xs leading-relaxed text-[var(--color-muted)]">
          {t("window.closeConfirm.body")}
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 px-3 py-2 text-xs text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="cursor-pointer"
          />
          {t("window.closeConfirm.remember")}
        </label>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleTray}
            className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] transition-colors hover:border-[var(--color-accent)]"
          >
            <Minimize2 className="h-4 w-4" />
            {t("window.closeConfirm.tray")}
          </button>
          <button
            onClick={handleExit}
            className="flex w-full items-center gap-2 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20"
          >
            <Power className="h-4 w-4" />
            {t("window.closeConfirm.exit")}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-md px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-strong)]"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}