import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useSettingsStore,
  type FontScale,
  type CloseBehavior,
} from "@/stores/settingsStore";
import {
  AI_PROVIDERS,
  CUSTOM_PROVIDER_ID,
  detectProviderId,
  getProvider,
} from "@/lib/providers";
import { DatasourceSection } from "./DatasourceSection";
import { ExportSection } from "./ExportSection";
import { AboutSection } from "./AboutSection";

const FONT_OPTIONS: {
  value: FontScale;
  labelKey: string;
  px: string;
}[] = [
  {
    value: "compact",
    labelKey: "settings.appearance.fontSize.compact",
    px: "15px",
  },
  {
    value: "standard",
    labelKey: "settings.appearance.fontSize.standard",
    px: "17px",
  },
  {
    value: "comfortable",
    labelKey: "settings.appearance.fontSize.comfortable",
    px: "21px",
  },
  {
    value: "large",
    labelKey: "settings.appearance.fontSize.large",
    px: "25px",
  },
  {
    value: "xlarge",
    labelKey: "settings.appearance.fontSize.xlarge",
    px: "30px",
  },
  {
    value: "xxlarge",
    labelKey: "settings.appearance.fontSize.xxlarge",
    px: "36px",
  },
  {
    value: "huge",
    labelKey: "settings.appearance.fontSize.huge",
    px: "44px",
  },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const {
    ai,
    saveAi,
    theme,
    setTheme,
    fontScale,
    setFontScale,
    closeBehavior,
    setCloseBehavior,
  } = useSettingsStore();
  const [draft, setDraft] = useState(ai);
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setDraft(ai);
  }, [ai]);

  const providerId = useMemo(
    () => detectProviderId(draft.api_base),
    [draft.api_base]
  );
  const provider = getProvider(providerId);

  function handleProviderChange(id: string) {
    if (id === CUSTOM_PROVIDER_ID) {
      setDraft((d) => ({ ...d }));
      return;
    }
    const p = getProvider(id);
    if (!p) return;
    setDraft((d) => ({
      ...d,
      api_base: p.api_base,
      model: p.default_model,
    }));
  }

  async function handleSave() {
    await saveAi(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-strong)]">
          {t("settings.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("settings.subtitle")}
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("settings.ai.title")}
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">
            {t("settings.ai.provider")}
          </label>
          <select
            value={providerId}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.nameKey)}
              </option>
            ))}
          </select>
          {provider?.hintKey && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {t(provider.hintKey)}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--color-muted)]">
            {t("settings.ai.apiKey")}
          </label>
          <input
            type="password"
            value={draft.api_key}
            onChange={(e) => setDraft({ ...draft, api_key: e.target.value })}
            placeholder={t("settings.ai.apiKeyPlaceholder")}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-strong)]"
          >
            {advancedOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {t("settings.ai.advanced")}
          </button>

          {advancedOpen && (
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  {t("settings.ai.apiBase")}
                </label>
                <input
                  value={draft.api_base}
                  onChange={(e) =>
                    setDraft({ ...draft, api_base: e.target.value })
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  {t("settings.ai.model")}
                </label>
                <input
                  value={draft.model}
                  onChange={(e) =>
                    setDraft({ ...draft, model: e.target.value })
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">
                  {t("settings.ai.temperature")}
                </label>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={draft.temperature}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      temperature: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-[var(--color-strong)] focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-[var(--color-accent-2)]">
              {t("settings.saved")}
            </span>
          )}
          <button
            onClick={handleSave}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {t("settings.save")}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <div className="text-sm font-medium text-[var(--color-strong)]">
          {t("settings.appearance.title")}
        </div>

        <div>
          <div className="mb-2 text-xs text-[var(--color-muted)]">
            {t("settings.appearance.theme")}
          </div>
          <div className="flex gap-2">
            {(["dark", "light", "system"] as const).map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs " +
                  (theme === th
                    ? "border-[var(--color-accent)] bg-[var(--color-panel-2)] text-[var(--color-strong)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]")
                }
              >
                {t(
                  th === "dark"
                    ? "settings.appearance.theme.dark"
                    : th === "light"
                    ? "settings.appearance.theme.light"
                    : "settings.appearance.theme.system"
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs text-[var(--color-muted)]">
            {t("settings.appearance.fontSize")}
          </div>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setFontScale(o.value)}
                className={
                  "flex flex-col items-center gap-0.5 rounded-md border px-3 py-1.5 text-xs " +
                  (fontScale === o.value
                    ? "border-[var(--color-accent)] bg-[var(--color-panel-2)] text-[var(--color-strong)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-strong)]")
                }
              >
                <span>{t(o.labelKey)}</span>
                <span className="text-[0.6rem] opacity-60">{o.px}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.6rem] text-[var(--color-muted)]">
            {t("settings.appearance.fontSizeHint")}
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs text-[var(--color-muted)]">
            {t("settings.appearance.closeBehavior")}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ask", "exit", "tray"] as const).map((b: CloseBehavior) => (
              <button
                key={b}
                onClick={() => setCloseBehavior(b)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs " +
                  (closeBehavior === b
                    ? "border-[var(--color-accent)] bg-[var(--color-panel-2)] text-[var(--color-strong)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-strong)]")
                }
              >
                {t(
                  b === "ask"
                    ? "settings.appearance.closeBehavior.ask"
                    : b === "exit"
                    ? "settings.appearance.closeBehavior.exit"
                    : "settings.appearance.closeBehavior.tray"
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <DatasourceSection />

      <ExportSection />

      <AboutSection />
    </div>
  );
}