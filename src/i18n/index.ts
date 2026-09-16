import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getSetting } from "@/lib/db";
import { zh } from "./locales/zh";
import { en } from "./locales/en";

export type Locale = "zh" | "en";

const DEFAULT_LOCALE: Locale = "zh";

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
});

// 启动时异步加载用户上次选择的语言
void getSetting("locale").then((raw) => {
  if (raw === "zh" || raw === "en") {
    if (i18n.language !== raw) {
      void i18n.changeLanguage(raw);
    }
  }
});

/**
 * AI system prompt 的语言指令。附加到每个 prompt 末尾，
 * 确保 AI 用当前 UI 语言回复。
 */
export function languageDirective(): string {
  const lang = i18n.language || DEFAULT_LOCALE;
  if (lang.startsWith("en")) {
    return "\n\nIMPORTANT: Always respond in English, regardless of the input language.";
  }
  return "\n\n重要：请始终用中文回复，无论用户输入是什么语言。";
}

export default i18n;