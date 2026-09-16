import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AiSettings } from "@/lib/types";
import { getSetting, setSetting } from "@/lib/db";

export type FontScale =
  | "compact"
  | "standard"
  | "comfortable"
  | "large"
  | "xlarge"
  | "xxlarge"
  | "huge";

export type Theme = "dark" | "light" | "system";
export type CloseBehavior = "ask" | "exit" | "tray";

const FONT_SCALE_PX: Record<FontScale, string> = {
  compact: "15px",
  standard: "17px",
  comfortable: "21px",
  large: "25px",
  xlarge: "30px",
  xxlarge: "36px",
  huge: "44px",
};

export function applyFontScale(scale: FontScale) {
  const px = FONT_SCALE_PX[scale] ?? FONT_SCALE_PX.standard;
  document.documentElement.style.fontSize = px;
}

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  const effective = resolveTheme(theme);
  document.documentElement.dataset.theme = effective;
  try {
    localStorage.setItem("shipssignal-theme", effective);
  } catch {
    // ignore
  }
}

async function pushCloseBehavior(behavior: CloseBehavior) {
  try {
    await invoke("set_close_behavior", { behavior });
  } catch (e) {
    console.error("[settings] set_close_behavior failed", e);
  }
}

interface SettingsState {
  loaded: boolean;
  ai: AiSettings;
  theme: Theme;
  fontScale: FontScale;
  closeBehavior: CloseBehavior;
  load: () => Promise<void>;
  saveAi: (patch: Partial<AiSettings>) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setFontScale: (scale: FontScale) => Promise<void>;
  setCloseBehavior: (behavior: CloseBehavior) => Promise<void>;
}

const DEFAULT_AI: AiSettings = {
  api_base: "https://api.openai.com/v1",
  api_key: "",
  model: "gpt-4o-mini",
  temperature: 0.4,
};

const DEFAULT_FONT_SCALE: FontScale = "standard";
const DEFAULT_THEME: Theme = "dark";
const DEFAULT_CLOSE_BEHAVIOR: CloseBehavior = "ask";

function isFontScale(v: unknown): v is FontScale {
  return (
    v === "compact" ||
    v === "standard" ||
    v === "comfortable" ||
    v === "large" ||
    v === "xlarge" ||
    v === "xxlarge" ||
    v === "huge"
  );
}

function isTheme(v: unknown): v is Theme {
  return v === "dark" || v === "light" || v === "system";
}

function isCloseBehavior(v: unknown): v is CloseBehavior {
  return v === "ask" || v === "exit" || v === "tray";
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  ai: DEFAULT_AI,
  theme: DEFAULT_THEME,
  fontScale: DEFAULT_FONT_SCALE,
  closeBehavior: DEFAULT_CLOSE_BEHAVIOR,

  async load() {
    if (get().loaded) return;
    const raw = await getSetting("ai_settings");
    const ai: AiSettings = raw
      ? { ...DEFAULT_AI, ...JSON.parse(raw) }
      : DEFAULT_AI;

    const themeRaw = await getSetting("theme");
    const theme: Theme = isTheme(themeRaw) ? themeRaw : DEFAULT_THEME;

    const fontRaw = await getSetting("font_scale");
    const fontScale: FontScale = isFontScale(fontRaw)
      ? fontRaw
      : DEFAULT_FONT_SCALE;

    const closeRaw = await getSetting("close_behavior");
    const closeBehavior: CloseBehavior = isCloseBehavior(closeRaw)
      ? closeRaw
      : DEFAULT_CLOSE_BEHAVIOR;

    applyTheme(theme);
    applyFontScale(fontScale);
    await pushCloseBehavior(closeBehavior);

    set({ ai, theme, fontScale, closeBehavior, loaded: true });
  },

  async saveAi(patch) {
    const next = { ...get().ai, ...patch };
    set({ ai: next });
    await setSetting("ai_settings", JSON.stringify(next));
  },

  async setTheme(theme) {
    set({ theme });
    applyTheme(theme);
    await setSetting("theme", theme);
  },

  async setFontScale(scale) {
    set({ fontScale: scale });
    applyFontScale(scale);
    await setSetting("font_scale", scale);
  },

  async setCloseBehavior(behavior) {
    set({ closeBehavior: behavior });
    await pushCloseBehavior(behavior);
    await setSetting("close_behavior", behavior);
  },
}));

if (typeof window !== "undefined" && "matchMedia" in window) {
  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        const current = useSettingsStore.getState().theme;
        if (current === "system") {
          applyTheme("system");
        }
      });
  } catch {
    // ignore
  }
}